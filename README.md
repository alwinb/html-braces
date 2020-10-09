Safe HTML-aware Template Engine
================================

***Warning*** This is an old project that is no longer under development. I am leaving it up here as a resource for whomever might find it useful. 

Html-braces is a safe, html-aware template engine. 

* It automatically escapes the input in a mannar that is appropriate for the html context in which template placeholders appear. 

* It is easy to add custom helper functions and 'special forms' for custom syntax or control flow from within javascript. 

It is opininated in that **automatic html-aware escaping ought to be built into any template language that is used to produce html**. 

Aimed at server-side usage. Templates render strings of raw html, and preserve the formatting idiosyncrasies of your templates.  


Inspiration
-----------

Html-braces is similar in syntax to the handlebars and htmlbars template languages. It's html-awareness is similar to htmlbars. The use of s-expressions which lead me to turn html-braces into a lisp-like language was inspired by this [note](https://gist.github.com/wycats/8116673) from the handlebars autor. 


Quick guide
-----------

Plain template. 

```javascript
var Template = require('html-braces')
var t = new Template('<p>Hello there, {{ name }}!</p>')
console.log(t.render({ name:'joe' }))
```

Custom helper function.

```javascript
var Template = require('html-braces')

var helpers = {
  capitalize: function(str) {
    return str[0].toUpperCase()+str.substr(1)
  }
}

var conf = { helpers:helpers }
var t = new Template('<p>Hello there, {{ (capitalize name) }}!</p>', conf)
console.log(t.render({ name:'joe' }))
```

Syntax
------

Templates are plain html5 files, except that html-braces interprets double braces `{{`…`}}` as template tags, **if** they occur in one of the following html contexts:

* In html-data position. For example:
	`<h1>Hello, {{ name }}</h1>`

* In rcdata position (textarea and title elements). For example:
	`<textarea>Hello, {{ name }}</textarea>`

* In attributes position. For example:
	`<h1 id="hello" {{ attrs }}>Hello there!</h1>`

* In attribute-value position. For example:
	`<h1 id="hello" class={{ classname }}>Hello there!`

You can use helper functions and (as we'll see later) also 'special-form' functions for custom control flow and variable binding. Example:

	<h1>Hello {{ (capitalize name) }}</h1>

Application of the (custom) helper function `capitalize` is written like in lisp, as `(capitalize name)` instead of `capitalize(name)`. Such helper applications can be nested, e.g. 

	<h1>Hello {{ (joinName (capitalize firstName) (capitalize lastName)) }}</h1>

In addition to normal template tags, such as `{{ name }}` above, html-braces has template-open and template-close tags such as `{{#if}}` and `{{\if}}`. These tags may only occur in html-data position. Example:

	<body>{{#if (eq a b)}} <p>This is only visible when a === b</p> {{/if}}</body>

The content of a block tag is interpreted as the last argument to the expression in the open-tag. For example, intuitively, the above is equivalent to the following (except that at the time of writing, strings inside template tags are not supported). 

	<body>{{ (if (eq a b) (raw_html_data "<p>This is only visible when a === b</p>")) }}</body>

This is useful for defining custom helpers, block tags, control flow and variable binders. 


Custom Special forms
--------------------

Special forms look like helper functions at first sight, but their arguments are not evaluated. Instead, the arguments to special forms are passed as uninterpreted code, aka. 'symbolic expressions', aka. abstract syntax trees. 

You can define your own special forms as functions that take an environment, and return a function. This function is called like a standard helper function except its arguments are not interpreted, but passed as syntax trees. Thus, you can decide for yourself if, how, and in what environment to interpret them. 

Limitations
-----------

* Strings, nor numbers are supported in teplate tags yet. 

* Paths, like `{{ person.name }}` are not yet supported but will be soon.

* There's no official API for working with evaluation environments
  when writing your own custom special forms, yet. 

* Template tags in DOCTYPE and CDATA tags are not interpreted. 
	Likewise, template tags within html comments are not interpreted.
	You can put them there, but they remain untouched. 

* Template tags within `<script>` and `<style>` elements are not yet supported.
	They may be, however, I'd recommend against using them anyway. Html-braces will ensure that the result is properly escaped, html-wise. But **it will not ensure that the escaped content is valid javascript or css**, respectively. 

* PLAINTEXT data is not supported. This is only used in the deprecated html `<plaintext>` tag anyway. 

