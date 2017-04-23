// Parser
// ======
// Parser and abstract syntax tree

(function () {
"use strict";
var Mixed = require('../lib/lexer')
	, Lexer = require('html-lexer/lib/lexer')(Mixed)
	, tokenize = function (str) { return Lexer(str).toArray() }

// Abstract syntax tree
// --------------------
// The parser produces a lisp-like abstract syntax tree. 
// The root of the AST for a template is a `Template` object. 
// The `content` of a `Template` is an array of mixed `Tag` objects and
// plain javascript strings. The strings are chuncks of raw html data.	
//
// Each `Tag` is a placeholder for a chunck of html in some 
// particular `context`: one of 'data', 'attributeValue', or 'attributes'.	
// Tags come with an s-`expression` to be evaluated. 
// These expressions are simply nested `Array`s of plain javascript values, 
// `Symbol` objects	 and/ or `Template` objects. 
// Block tags are parsed as `Tag`s that have a `Template` object as the last
// item of their s-expression. 

var Ast = 
{ Symbol: Symbol
, Path: Path
, Tag: Tag
, List: Array
, Template: Template }


function Template () {
	this.content = [] // Mixed `Tag` objects and (raw) strings
}

function Symbol (name, info) {
	this.name = name
	this.info = info // source position
}

// TODO use Paths instead:
function Path (names, info) {
	this.path = names
	this.info = info
}

function Tag (ctx) {
	this.context = ctx	 // one of 'data', 'attributeValue', 'attributes'
	this.expression = [] // Arrays, Paths (Symbol chains), and (for block tags) Templates
}



// Parser
// -----
// The `parse` function uses a state machine
// that keeps a stack = a path into the AST that
// is being constructed, and some additional state. 


var COMMENT = {}

// Yeah so this is rather ad-hoc, bah. 

function parse (tmpl) {
	var tokens = Lexer(tmpl)
	var errors = [], warnings = []
	var root = new Template ()
	var path = { head:root, tail:null }
	var token, info
	var state = 'template'
	// one of: 'template', 'openTag', 'closeTag', 'invalidTag', 'tag',
	// 'comment', // 'symbols', 

	function open (node) {
		add(node)
		path = { head:node, tail:path } }


	function add (x) {
		var node = path.head
		if (node instanceof Template) {
			var last = node.content[node.content.length-1]
			if (typeof x === 'string' && typeof last === 'string')
				node.content[node.content.length-1] = last+x
			else
				node.content.push(x)
		}
		else if (node instanceof Tag)
			node.expression.push(x)
		else
			node.push(x)
	}

	function error (msg) {
		errors.push([info, msg]) }

	var info = tokens.info()
		, token = tokens.next()

	while (token != null) {
    //console.log(token)
		var c = token[0]
			, chunck = token[1]
			, context = token[2]


		if (path.head === COMMENT) {
			if (c === 'finishTemplateComment')
				path = path.tail
			// else ignore token
		}

		else if (path.head instanceof Template) {
			switch (c) {

				case 'beginTemplateTag':
					open (new Tag (context))
					state = 'tag'
				break

				case 'beginTemplateOpenTag':
					open (new Tag (context))
					if (context !== 'data' && context !== 'rcdata')
						error('block tags are not allowed in '+context+' context')
					state = 'openTag'
				break

				case 'beginTemplateCloseTag':
					if (context !== 'data' && context !== 'rcdata')
						error('block tags are not allowed in '+context+' context')
					path = { head: new Tag (context), tail:path }
					state = 'closeTag'
				break

				case 'beginTemplateComment':
					path = { head: COMMENT, tail:path }
				break

				case 'error':
					warnings.push([token[2], token[1]])
				break

				// Most of the HTML tokens are passed through unchanged,
        // however, some of the erroneous ones are repaired here. 
				case 'spaceMissing':
					add (' ')
				break

				// bogusCharRefs, these one of `&`, `&#`, `&#X`, `&#x`
				case 'bogusCharRef':
					add('&amp;'+chunck.substr(1))
				break

				case 'lessThanSign':
					add('&lt;')
				break

				// Ensure that all the references are terminated
				case 'hexadecimalCharRef':
					add(chunck.substr(-1) !== ';' ? chunck+';' : chunck)
				break

				case 'decimalCharRef':
					add(chunck.substr(-1) !== ';' ? chunck+';' : chunck)
				break

				case 'namedCharRef':
					add(chunck)
					// NB: this incorrectly terminates sequences such as &ampstuff
					// as &ampstuff; rather than as &amp;stuff
					// add(chunck.substr(-1) !== ';' ? chunck+';' : chunck)
				break

				default:
					add(chunck)
				break
			}
		}
		
		else {

			switch (c) {
				case 'name':
					add(new Symbol(chunck, info))
				break

				case '(':
					var node = []
					node.info = info
					open(node)
				break
				
				case ')':
					if (path.head instanceof Array) path = path.tail
					else error('too many closing parentheses')
				break


				case 'finishTemplateTag':
					if (state === 'openTag') {
						while (!(path.head instanceof Tag))
							path = path.tail // close all (but one) unclosed ('s
						open (new Template ())
					}
					else if (state === 'closeTag') {
						var closeName = path.head.expression[0].name
						path = path.tail.tail // close the close tag (and leave it, as it wasn't added) and close the template
						var openName = path.head.expression[0].name // TODO check if there actually was an open tag
						path = path.tail // close the open tag's node (which was remained unclosed as per the above)
						if (openName !== closeName)
							error('mismatched template tags: \''+openName+'\' closed with \''+closeName+'\'')
					}
					else if (state === 'tag') {
						while (!(path.head instanceof Tag)) path = path.tail // close unclosed ('s
						if (path.head.expression.length !== 1)
							error('too many s expressions in tag')
						path.head.expression = path.head.expression[0]
						path = path.tail
						state = 'template'
					}
				break
			
				case 'error':
					errors.push([token[2], token[1]])
				break
			}
		}
	
		info = tokens.info()
		token = tokens.next()
	}

	return { warnings:warnings, errors:errors, result:root }
}


//
// Exports

module.exports = 
{ parse: parse
, Ast: Ast
}

})();