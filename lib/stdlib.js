(function () { "use strict";

var Eval = require('./eval')
	, Ast = Eval.Ast
	, evalTemplate = Eval.eval

var helpers = 
{ raw_html_data : function (str) { return new Eval.Raw(str) }
, even: function (n) { return n%2 === 0 }
, odd: function (n) { return n%2 !== 0 }
, eq: function (a, b) { return a === b }
, neq: function (a, b) { return a !== b }
, lt: function (a, b) { return a < b }
, lte: function (a, b) { return a <= b }
, gte: function (a, b) { return a >= b }
, gt: function (a, b) { return a > b }
, lipsum: function () { return 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' }
}


// Special forms are used to implement variable binding,
// 'functions' that evaluate their arguments in nonstandard order
// or do preprocessing of the symbolic expressions 
// before evaluating them. 
// This is a flexible language extension mechanism. 

var specials = {

	'if': function (env) { return function (test, a, b) {
		var t = evalTemplate(test, env)
		return evalTemplate((t ? a : b), env)
	}},


	'each': function (env) { return function (pair, list, block) {
		// Asserts that the arguments have the expected Ast structure, e.g. 
		// `{{#each (index item) list }} some_template {{/each}}`
		var isvalid = 
			( pair instanceof Ast.List
			&& pair[0] instanceof Ast.Symbol
			&& pair[1] instanceof Ast.Symbol
			&& block instanceof Ast.Template )

		if (!isvalid)
			throw new SyntaxError ('invalid `each` special form')

		var list = evalTemplate(list, env)
		var itemvar = pair[1].name
			, indexvar = pair[0].name
			, list = list == null ? [] : list
		var childenv = clone(env.input)

		var r = []
		if (typeof list === 'object') {
			for (var i in list) {
				childenv[itemvar] = list[i]
				childenv[indexvar] = i
				r.push(evalTemplate(block, { specials:env.specials, helpers:env.helpers, input:childenv }).content)
			}
		}
		
		else for (var i=0; i<list.length; i++) {
			childenv[itemvar] = list[i]
			childenv[indexvar] = i+1 // We start lists with 1, rather than zero
			r.push(evalTemplate(block, { specials:env.specials, helpers:env.helpers, input:childenv }).content)
		}

		return new Eval.Raw(r.join(''))
	}},

	// 'let': function (env) { return function (arg1, arg2, __) {
	//	var body = arguments[arguments.length-1]
	//	var childenv = clone(env.input)
	//	// ok, need to add each of the arg1=eval(arg2) entries,
	//	//	while chaining through (possibly mutating) the env.
	//	//	once done, evalTemplate the body with the new env
	// }}
}

// This function is named after the clone method in the Io language. 
// `clone(obj)` returns a new object with it's prototype chain linked to `obj`. 
// This is useful for adding properties to, or shadowing properties of `obj`
// without mutating it. 

function clone (obj) {
	var fn = function () {}
	fn.prototype = obj
	return new fn ()
}


module.exports = 
{	 helpers:helpers
, specials:specials
}
})()