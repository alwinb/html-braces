var Tmpl = require('../lib/braces-lexer')
	, Lexer = require('html-lexer/lib/lexer')(Tmpl)
	, Samples = require('./data/braces')

function test (title, samples) {
	console.log('Test '+title+'\n'+new Array(title.length+6).join('=')+'\n')
	for (var a in samples) {
		console.log(samples[a])
		console.log(new Lexer(samples[a]).all())
		console.log('\n')
	}
}

test ('unusual inputs', Samples.unusualInput)
test ('EOF samples', Samples.EOFSamples)
test ('corner cases', Samples.weirdSamples)
test ('s expression samples', Samples.sExpressions)
