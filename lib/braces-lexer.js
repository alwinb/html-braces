// Template Lexer
// ==============
// This is pretty much just a hand-coded state machine for
// a 'moustache' / handlebars like template syntax. 

(function () {
"use strict";

// State machine
// -------------
// The lexer does not discard any input characters, 
// but rather emits chuncks of characters (tokens). 
// The emitted token types are:
// 
// - data
// - beginTemplateTag
// - beginTemplateOpenTag
// - beginTemplateCloseTag
// - finishTemplateTag
// - name
// - space
// - dot
// - (
// - )
//
// There is a separate emitter for errors. 
// The tokenizer has 'error-recovering' built-in, thus an 'error' does
// not prevent the tokenizer from resuming. 
// 

var SPACE = /[\t\n\f ]/
var HEAD = /[a-zA-Z_]/
var TAIL = /[a-zA-Z0-9_]/
var NONNAME = /[^\t\n\f }\(\)]/ // TODO, Redo this

var EOF = null
var eof_msg = 'Premature end of input '


function StateMachine (consume, emit, emitError) {
var state = { state:'data', tagContext:'data' }
var states = {

	data: function (peek) {
		if (peek === '{') {
			emit('data')
			consume()
			this.state = 'afterOpenBrace'
		}
		else if (peek === EOF)
			emit('data')
		else
			consume()
	},

	afterOpenBrace: function (peek) {
		if (peek === '{') {
			this.state = 'tagOpen'
			consume()
		}
		else if (peek === EOF)
			emit('data')
		else {
			this.state = 'data'
			consume()
		}
	},

	tagOpen: function (peek) {
		if (peek === '#') {
			consume()
			emit('beginTemplateOpenTag', this.tagContext)
			this.state = 'beforeName'
		}
		else if (peek === '/') {
			consume()
			emit('beginTemplateCloseTag', this.tagContext)
			this.state = 'beforeName'
		}
		else {
			emit ('beginTemplateTag', this.tagContext)
			this.state = 'sexpr'
			states.sexpr.call(this, peek)
		}
	},
	
	afterCloseBrace: function (peek) {
		if (peek === '}') {
			consume()
			emit('finishTemplateTag')
			this.state = 'data'
		}
		else if (peek === EOF) { 
			emitError(eof_msg+'in template tag after single }')
			emit('finishTemplateTag')
		}
		else {
			// Branch does not consume
			emitError('single closing brace within template tag' )
			this.state = 'sexpr'
		}
	},

	sexpr: function (peek) {
		if (peek === '}') {
			emit('space')
			consume()
			this.state = 'afterCloseBrace'
		}
		else if (peek === EOF) {
			emit('space')
			emitError(eof_msg+'template tag')
		}
		else if (SPACE.test(peek)) {
			consume()
		}
		else if (peek === '(') {
			emit('space')
			consume()
			emit('(')
		}
		else if (peek === ')') {
			emit('space')
			consume()
			emit(')')
		}
		else if (HEAD.test(peek)) {
			emit('space')
			consume()
			this.state = 'name'
		}
		else {
			emit('space')
			emitError('unsupported character in name')
			consume()
			this.state = 'name'
		}
	},

	beforeName: function (peek) {
		if (peek === EOF) { 
			emitError(eof_msg+'before name')
		}
		else if (HEAD.test(peek)) {
			consume()
			this.state = 'name'
		}
		else if (NONNAME.test(peek)) {
			emitError('unsupported character in name')
			consume()
			this.state = 'name'
		}
		else {
			emitError('expecting name')
			this.state = 'sexpr'
			states.sexpr.call(this, peek)
		}
	},

	name: function (peek) {
		if (peek === EOF) { 
			emitError(eof_msg+'in name')
			emit('name')
		}
		else if (TAIL.test(peek)) {
			consume()
		}
		else if (peek === '.') {
			emit('name')
			consume()
			emit('dot')
			this.state = 'beforeName'
		}
		else if (NONNAME.test(peek)) {
			emitError('unsupported character in name')
			consume()
		}
		else {
			emit('name')
			this.state = 'sexpr'
			states.sexpr.call(this, peek)
		}
	},

} /* end of states */

function run (peek) { 
  states[state.state].call(state, peek) }

return { run:run, state:state, states:states }
}


module.exports = StateMachine
})();