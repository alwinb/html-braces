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

function StateMachine (consume, emit, emitError) {
	var _html = HtmlStates(consume, emit, emitError)
	var _tmpl = TemplateStates(consume, emit, emitError)

	var self = { run:run }
	var machine, context
  var state = _html.state

	function run (peek) {
		machine[state.state].call(state, peek)
    //console.log(peek, state)
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
				_html.states.beforeAttributeName.call(state, peek)	 // fallback to old
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
				_html.states.afterAttributeName.call(state, peek)
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
				_html.states.beforeAttributeValue.call(state, peek)	// fallback to old
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
				_html.states.data.call(state, peek)	// fallback to old
		},

    // TODO patch lessThanSignIn_, endTagOpenIn_, 
    lessThanSignIn_: function (peek) {
			if (peek === '{') {
				emit('endTagPrefix')
				this.tagContext = context = this.stack[0]
				machine = tmpl
				this.state = 'afterOpenBrace'
				consume()
			}
			else
				_html.states.lessThanSignIn_.call(state, peek)	// fallback to old
    },
    
    endTagOpenIn_: function (peek) {
			if (peek === '{') {
				emit('endTagPrefix')
				this.tagContext = context = this.stack[0]
				machine = tmpl
				this.state = 'afterOpenBrace'
				consume()
			}
			else
				_html.states.endTagOpenIn_.call(state, peek)  // fallback to old
    },

		rcdata: function (peek) {
			if (peek === '{') {
				// So no, here we want to not emit, 
				// rather, the unemitted rcdata should become part of the placeholder
				emit('rcdata')
				this.tagContext = context = 'rcdata'
				machine = tmpl
				this.state = 'afterOpenBrace'
				consume()
			}
			else {
				_html.states.rcdata.call(state, peek)	// fallback to old
        //console.log('after', state)
      }
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
				// 'beforeAttributeName' in the newer lexer
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
				_tmpl.states.afterCloseBrace.call(state, peek) // fallback to old
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
				_tmpl.states.afterCommentCloseBrace.call(state, peek) // fallback to old
		}
	}

	var html = extend(_html.states, html_patch)
	var tmpl = extend(_tmpl.states, tmpl_patch)
	var machine = html
	return self
}

module.exports = StateMachine