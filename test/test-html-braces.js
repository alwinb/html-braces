var Mixed = require('../lib/lexer')
	, Lexer = require('html-lexer/lib/lexer')(Mixed)
	, Parser = require('../lib/parser')
	, Samples = require('./data/html-braces')

function test (fn, title, samples) {
	console.log('Test '+title+'\n'+new Array(title.length+6).join('=')+'\n')
	for (var a in samples) {
		console.log(samples[a])
		console.log(fn(samples[a]))
		console.log('\n')
	}
}

function tokenize (str) {
  return new Lexer (str).toArray()
}

function parse (str) {
	return JSON.stringify(Parser.parse(str), null, 2)
}

test(tokenize, 'samples', Samples.samples)
test(tokenize, 'EOF samples', Samples.EOFSamples)
test(tokenize, 'corner cases', Samples.weirdSamples)

test(parse, 'samples', Samples.samples)
test(parse, 'EOF samples', Samples.EOFSamples)
test(parse, 'corner cases', Samples.weirdSamples)


