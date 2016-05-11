// Eval
// ====
// This looks a lot like a standard lisp interpreter. 
// The main difference is that symbols that occur in call position,
// (that is, as the first item of an array), are resolved against the
// environment's registered helpers and/or registered 'special forms',
// whereas symbols that occur in non-call positions are resolved 
// against the 'template context' which is, initially, the input data. 

(function () {
"use strict";
var Ast = require('../lib/parser').Ast

// ## evalTemplate
// The `evalTemplate` function evaluate a template AST `tm` against the
// environment `env`. The enviroment is a map of maps:
// `{ specials, helpers, input }` where `input` is the template's input data. 

function evalTemplate (tm, env) {

	// ### APPLY
	// This is the 'APPLY' branch of the interpreter.	 
	// `Tag`s are interpreted as an application of a built in
	// render function to their evaluated s-expression. `List`s are
	// interpreted as applications of their first item to the rest 
	// (as in lisp). 

	if (tm instanceof Ast.Tag) {
		return renderers[tm.context](evalTemplate(tm.expression, env))
	}

	else if (tm instanceof Ast.List && tm.length) {
		var op = tm[0], args = []
		if (op instanceof Ast.Symbol) {

			// **Special form functions** are lazy: they are applied to 
			// unevaluated ASTs. The special form helper function
			// can then decide on its own when, and in what context to evaluate them. 

			if (op.name in env.specials) {
				var fn = env.specials[op.name]
				for (var i=1,l=tm.length; i<l; i++)
					args.push(tm[i])
				try {
					return fn(env).apply(null, args) }
				catch (e) {
					throw new RuntimeError (op.info, e) }
			}

			// **Helper functions** instead are 'strict in their arguments', 
			// that is, the arguments are evaluted from left to right before the
			// helper function is applied to them.

			else if (op.name in env.helpers) {
				var fn = env.helpers[op.name]
				for (var i=1,l=tm.length; i<l; i++)
					args.push( evalTemplate(tm[i], env) )
				try {
					return fn.apply(null, args) }
				catch (e) {
					throw new RuntimeError (op.info, e) }
			}

			else {
				throw new RuntimeError (op.info, new TypeError ('`'+op.name+'` is not a registered helper function or special form'))
			}
		}

		// **Plain javascript functions**, like helpers, are evaluated strictly:
		// arguments are evaluated before the function is applied to them. 

		else if (typeof op === 'function') {
			for (var i=1,l=tm.length; i<l; i++)
				args.push( evalTemplate(tm[i], env) )
			return fn.apply(null, args)
		}
		
		// **Not callable**. This branch is reached when the first item of an array
		// is not a symbol or a function, e.g. it is not callable. 

		else {
			throw new RuntimeError (tm.info, new TypeError ('attempt to invoke a non-callable value'))
		}
	}
	
	// ### EVAL
	// This is the 'EVAL' branch of the interpreter. 
	// If we're not evaluating a `Tag` or an application (a `List`), then we're
	// evaluating a literal: a `Template`, a `Symbol` in non-call position, or 
	// a plain javascript value.	

	// **Templates** are stored as a list of `Tag` objects mixed with plain
	// javascript strings (of raw html). 
	// Each `Tag` evaluates to a plain javascript string of raw html, thanks to
	// the render functions. So Templates are evaluated as follows below. Note
	// that templates, when evaluated, always produce a `Raw` object. 

	else if (tm instanceof Ast.Template) {
		var out = ''
		for (var i=0,l=tm.content.length; i<l; i++) {
			var item = tm.content[i]
			if (typeof item === 'string') out += item
			else out += evalTemplate(item, env)
		}
		return new Raw (out)
	}

	// **Symbols** (in non-call position) are resolved against the input data. 

	else if (tm instanceof Ast.Symbol)
		return env.input[tm.name] //

	// **Other javascript values** are 'self evaluating'.

	else
		return tm
}


// ## RuntimeError
// An error object wrapper that stores info
// about the source position in the template

function RuntimeError (info, origin) {
	this.info = info
	this.origin = origin
	this.message = origin.message
}

RuntimeError.prototype.toString = function () {
	return ['RuntimeError: '
		, this.message
		, '\n	 at evalTemplate (<template>:'
		, this.info.line, ':', this.info.column
		, ')\n\n'
		, this.origin.stack ].join('') }



// Render primitives
// -----------------
// Raw html data that results from evaluating templates
// (and subtemplates) is wrapped in a `Raw` object. 

function Raw (string) {
	this.content = string }

Raw.prototype.toString = function () {
	return this.content
}


// `AMPLT`, `AMPQ` and `escapeChar` are used for escaping 
// html-data, rcdata and attrbute values

var AMPLT = /[&<]/g
var AMPQ = /[&"]/g

function escapeChar (c) {
	return c === '&' ? '&amp;'
	: c === '<' ? '&lt;'
	: c === '"' ? '&quot;' : c }


// The `renderData` function is called for every
// placeholder `Tag` in an 'html-data' context. It escapes all 
// strings _except_ the strings wrapped in a `Raw` object. 

function renderData (value) {
	return (value instanceof Raw)
		? value.content
		: String(value).replace(AMPLT, escapeChar)
}

// The `renderRcData` function is called for every `Tag` in
// 'rcdata' contexts. i.e. in `<textarea>` and `<title>` elements.
// It escapes all strings, _and_ the contents of `Raw` objects. 

/* NOTE: even though everyting is escaped, this is not safe unless
// the surrounding rcdata is escaped properly too. 
// Example: <textarea> Hi there </text{{ foo }}</textarea>
// with foo expanding to 'area ' will cause trouble. */

function renderRcData (value) {
	value = (value instanceof Raw) ? value.content : value
	return String(value).replace(AMPLT, escapeChar)
}

// The `renderAttributeValue` function takes a javascript value and
// returns a safe (escaped) string of html to be used as an
// html attribute value. 

function renderAttributeValue (value) {
	value = (value instanceof Raw) ? value.content : value
	return '"'+String(value).replace(AMPQ, escapeChar)+'"'
}


// The `renderAttributes` function takes a javascript value and 
// returns safe html to be used as one or more attributes and/or
// attribute-value pairs.
//
// Strings that do not match `ATTRNAME` cannot be attribute names
// and they cannot be escaped either, so we ignore them (see below)

var ATTRNAME = /^[^\t\n\f />][^\t\n\f /=>]*$/

function renderAttributes (arg) {
	var r = []

	// Arrays - each of the items is added as a standalone attribute
	if (arg instanceof Array) {
		for (var i=0,l=arg.length; i<l; i++) {
			var k = String(arg[i])
			if (ATTRNAME.test(k)) r.push(k) } }

	// Maps - each of the key-value pairs are added as an attribute
	else if (arg != null && typeof arg == 'object') {
		for (var k in arg) {
			if (arg[k] != null && typeof arg[k] !== 'function' && ATTRNAME.test(k)) {
				var v = String(arg[k])
				if (v === '') r.push(k)
				else r.push(k+'='+renderAttributeValue(v)) } } }

	// Everything else is added as a standalone attribute
	else {
		var k = String(arg)
		if (ATTRNAME.test(k)) r.push(k) }

	return r.join(' ')
}


var renderers = 
{ attributes: renderAttributes
, attributeValue: renderAttributeValue
, rcdata: renderRcData
, data: renderData }


// Exports
// -------

module.exports = 
{ eval: evalTemplate
, Raw: Raw
, Ast: Ast
}

})();