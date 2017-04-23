(function () {
"use strict";

var parse = require('../lib/parser').parse
	, evalTemplate = require('../lib/eval').eval
	, std = require('../lib/stdlib')


function Template (string, options) {
	var options = options && typeof options === 'object' ? options : {}

  var helpers = (options.helpers && typeof options.helpers === 'object')
    ? extend (std.helpers, options.helpers)
    : std.helpers

	var p = parse (string)
		, ast = p.result

	if (p.errors.length)
		throw new SyntaxError (errorReport(p.errors))

	if (options.strict && p.warnings.length)
		throw new SyntaxError (errorReport(p.warnings))

	this.render = function (data) {
		try { 
			var out = evalTemplate(ast, {specials:std.specials, helpers:helpers, input:data})
			return out.content
    }
		catch (runtimeError) { 
			throw runtimeError
		}
	}
}


function errorReport (errors) {
	var msg = ''
	for (var i=0,l=errors.length; i<l; i++) { 
		var x = errors[i]
		msg += ['\n', x[1], ', line ', x[0].line, ':', x[0].column].join('') }
	return msg }


function extend (o1, o2) {
	var r = {}
	for (var a in o1) r[a] = o1[a]
	for (var a in o2) r[a] = o2[a]
	return r }


module.exports = Template
})();