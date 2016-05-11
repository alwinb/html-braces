var HtmlStates = require('html-lexer/lib/html')
var TemplateStates = require('./braces-lexer')

function extend (o1, o2) {
	var r = {}
	for (var a in o1) r[a] = o1[a]
	for (var a in o2) r[a] = o2[a]
	return r }

// I really don't like how I'm monkey-patching both
// html-lexer and the template lexer here. But I can't come up with 
// an elegant way to do this right now, bah. 

function StateMachine (stream, emit, emitError) {
	var self = { run:run, state:'data', context:null, tagContext:'data' }
	var consume = stream.advance
	var machine, context

	var _html = HtmlStates(stream, emit, emitError)
	var _tmpl = TemplateStates(stream, emit, emitError)

	function run () {
		machine[self.state].call(self, stream.peek(), stream)
	}

	// Patch html states as follows.
	// These are all the states of the html tokenizer in which 
	// template tags are allowed to occur

	var html_patch = {

		beforeAttributeName: function (peek) {
			if (peek === '{') {
				emit('space')
				this.tagContext = context = 'attributes'
				machine = tmpl
				this.state = 'afterOpenBrace'
				consume()
			}
			else
				_html.states.beforeAttributeName.call(self, peek)	 // fallback to old
		},

		afterAttributeName: function (peek) {
			if (peek === '{') {
				emit('space') // it was a stand alone attribute
				this.tagContext = context = 'attributes'
				machine = tmpl
				this.state = 'afterOpenBrace'
				consume()
			}
			else
				_html.states.afterAttributeName.call(self, peek)
		},

		beforeAttributeValue: function (peek) {
			if (peek === '{') {
				emit('equals')
				this.tagContext = context = 'attributeValue'
				machine = tmpl
				this.state = 'afterOpenBrace'
				consume()
			}
			else
				_html.states.beforeAttributeValue.call(self, peek)	// fallback to old
		},

		data: function (peek) {
			if (peek === '{') {
				emit('data')
				this.tagContext = context = 'data'
				machine = tmpl
				this.state = 'afterOpenBrace'
				consume()
			}
			else
				_html.states.data.call(self, peek)	// fallback to old
		},
		
		rcdata: function (peek) {
			if (peek === '{') {
				emit('rcdata')
				this.tagContext = context = 'rcdata'
				machine = tmpl
				this.state = 'afterOpenBrace'
				consume()
			}
			else
				_html.states.rcdata.call(self, peek)	// fallback to old
		}
	}

	// Patch the template states as follows. 
	// These are the template states that defer back to 
	// the html tokenizer

	var tmpl_patch = {

		afterOpenBrace: function (peek) {
			if (peek === '{') {
				this.state = 'tagOpen'
				consume()
			}
			else {
				machine = html
				this.state = (context === 'attributes') ? 'attributeName'
				: (context === 'attributeValue') ? 'attributeValueUnquoted'
				: (context === 'rcdata') ? 'rcdata'
				: 'data'
				consume()
			}
		},

		afterCloseBrace: function (peek) {
			if (peek === '}') {
				consume()
				emit('finishTemplateTag')
				machine = html
				this.state = context === 'data' ? 'data'
					: context === 'rcdata' ? 'rcdata' : 'afterAttributeValueQuoted'
			}
			else
				_tmpl.states.afterCloseBrace.call(self, peek) // fallback to old
		},

		afterCommentCloseBrace: function (peek) {
			if (peek === '}') {
				consume()
				emit('finishTemplateComment')
				machine = html
				this.state = context === 'data' ? 'data'
					: context === 'rcdata' ? 'rcdata' : 'afterAttributeValueQuoted'
			}
			else
				_tmpl.states.afterCommentCloseBrace.call(self, peek) // fallback to old
		}
	}

	var html = extend(_html.states, html_patch)
	var tmpl = extend(_tmpl.states, tmpl_patch)
	var machine = html
	return self
}

module.exports = StateMachine