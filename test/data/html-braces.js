
var samples = 
{ helper: '<h1>Hello {{ (capitalize name) }}</h1>'
, nestedHelper: '<h1>Hello {{ (joinName (capitalize firstName) (capitalize lastName)) }}</h1>'
, blockTag: '<body>{{#if (eq a b)}} <p>This is only visible when a === b</p> {{/if}}</body>'
, eachTag: '<ul>{{#each (index item) list }}<li>{{ item }}</li>{{/each}}</ul>'
, callHelper: '<span>{{ (x) }}</span>'
, doubleCall: 'double call {{ ((lorem g) a b) }}'
, dataPosition: '<h1>Hello {{ name }}</h1>'
, attributesPosition: '<h1 id="hello" {{ attrs }}>Hello there!</h1>'
, attributeValuePosition: '<h1 id="hello" class={{ classname }}>Hello there!'
, rcdataPosition: '<textarea> foo {{ stuff }} bar </textarea>'
, rawtextPosition: '<script> foo {{ stuff }} bar </script>'
, commentPosition: '<!-- {{ test }} -->'
, chains: '<div name={{ person.name }} {{ person.whatev }}>bla</div>'
}

var weirdSamples = 
{ touchingAttributesTags1: '<div {{ attrs }}{{ attrs }}>foo</div>'
, touchingAttributesTags2: '<div name={{ name }}{{ attrs }}>foo</div>'
, afterCharRef: 'data &amp{{ a }} lorem'
, invalidSExpression: 'invalid {{ at<>trs }} tag content'
, invalidNesting: 'invalid {{ (attrs asdf () }} tag content'
, doubleApplication: '<div {{ hello }}>{{(lipsum)}}</div> '
, unescapedAmpInRcData: '<textarea>{{ (raw_html_data html) }} & two</textarea>'
, dangerousTextarea: '<textarea>Hi & </text{{ foo }} & two</textarea>'
, blockTagInRcData: '<textarea>One {{#if (eq a b)}} Two {{ three }} Four {{/if}} three</textarea>'
, htmlErrors: '<span class="test"b=>{{ x }}</span>'
}

var EOFSamples = 
{
}

module.exports = 
{ samples:samples
, EOFSamples:EOFSamples
, weirdSamples:weirdSamples }