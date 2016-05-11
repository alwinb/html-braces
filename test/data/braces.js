//
// Samples for EOFs in each of the states

var EOFSamples = 
{ tag_1: 'in tag {{  tag d'
, tag_2: 'in tag {{# tag d'
, tag_3: 'in tag {{/ tag d'
, data: 'in data'
, comment: 'in {{- comm'
, afterOpenBrace: 'in afterOpenBrace {'
, afterDoubleOpenBrace: 'in afterDoubleOpenBrace {{'
, afterCloseBrace: 'in afterCloseBrace {{ tag data }'
, afterCommentDash: 'in afterCommentDash {{- comment -'
, afterCommentCloseBrace: 'in afterCommentCloseBrace {{- comment -}'
, afterTag: 'eof {{ after tag }}'
}


//
// Some other unusual samples

var weirdSamples = 
{ tooManyOpenBraces: 'many braces {{{ tag data }} thus '
, singleCoseBraceInTag: 'single close {{ brace} in tag }}'
, singleCoseBraceInTag2: 'single close {{ brace}in tag }}'
, singleCoseBraceInComment: 'single close {{- brace} in comment -}}'
, openBracesInTag: 'open {{ brace{ in tag -}}'
, weirdComment: 'comment {{- with -} within -}}'
, manyOpenBraces: 'tag with {{{ too many openings }}'
, manyOpenBraces2: 'tag with {{{too many openings }}'
}


//
// Some samples with s expressions

var sExpressions = 
{ multipleSExpressions: 'many {{ tag (data with) }} thus '
, symbolChain: 'some {{ person.name }}'
, spaceInSymbolChain: 'more {{ person. name }}'
, dotTerminatedSymbol: 'more {{ person.}} name }}'
, path4: 'more {{ person.} name }}'
, path5: 'more {{ person.}name }}'
, path6: 'more {{ person.@name }}'
, path7: 'more {{ person.) name }}'
, path8: 'more {{ person.(name }}'
, path9: 'more {{ person. name }}'
}


//
// Unusual input types

var unusualInput = 
{ object: {}
, null: null
, array: [1,2,3]
, empty: ''
}


module.exports = 
{ EOFSamples:EOFSamples
, weirdSamples:weirdSamples
, sExpressions:sExpressions
, unusualInput:unusualInput }
