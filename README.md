<br/>

<p align="center">
  <a href="#readme"><picture>
    <source media="(prefers-color-scheme: dark)" srcset="./images/logo-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./images/logo-light.png" />
    <img alt="MFML" src="./images/logo-light.png" width="400" />
  </picture></a>
</p>

<br/>

<!--ARTICLE-->

<!--OVERVIEW-->

The ICU MessageFormat + XML/HTML compiler and runtime that makes your i18n messages tree-shakeable.

- TypeScript first.
- Integrates with any translation management system.
- Colocates messages and code that uses them in the same chunk.
- Highly customizable.
- First-class React support.
- Zero dependencies.
- XSS prone because due to no dangerous HTML rendering.
- [Just 3 kB gzipped.](https://bundlephobia.com/result?p=mfml)

<!--/OVERVIEW-->

<br>

```sh
npm install --save-prod mfml
```

<br>

<!--/ARTICLE-->

<!--TOC-->

- [API docs&#8239;<sup>↗</sup>](https://smikhalevski.github.io/mfml/)

<span class="toc-icon">🚀&ensp;</span>**Features**

- [Overview](#overview)
- [Parse a message](#parse-a-message)
- [Render a message as plain text](#render-a-message-as-plain-text)
- [React integration](#react-integration)

<span class="toc-icon">#️⃣&ensp;</span>**ICU Syntax**

- [Arguments and formatters](#arguments-and-formatters)
- [Value matching](#value-matching)
- [Pluralization](#pluralization)

<span class="toc-icon">🎯&ensp;</span>[**Motivation**](#motivation)

<!--/TOC-->

<!--ARTICLE-->

# Overview

Save your i18n messages in _messages.json_:

```json
{
  "en-US": {
    "greeting": "Hello, <b>{name}</b>!'"
  },
  "ru-RU": {
    "greeting": "Привет, <b>{name}</b>!'"
  }
}
```

Put your config in _mfml.config.js_:

```ts
import { defineConfig } from 'mfml/compiler';
import messages from './messages.json' with { type: 'json' };

export default defineConfig({
  messages,
});
```

Compile messages:

```shell
npx mfml
```

This would create an `@mfml/messages` npm package in _node_modules_ directory.

Now you can import message functions to produce formatted text:

```ts
import { renderToString } from 'mfml';
import { greeting } from '@mfml/messages';

renderToString({
  locale: 'en-US',
  message: greeting,
  values: { name: 'Bob' },
});
// ⮕ 'Hello, Bob!'
```

Or render messages in your React app:

```tsx
import { Message, MessageLocaleProvider } from 'mfml/react';
import { greeting } from '@mfml/messages';

export const App = () => (
  <MessageLocaleProvider value={'en-US'}>
    <Message
      message={greeting}
      values={{ name: 'Bob' }}
    />
  </MessageLocaleProvider>
);
```

This renders markup with HTML elements:

```html
Hello, <b>Bob</b>!
```

Now, your bundler would do all the heavy lifting and colocate message functions with components that use them in
the same chunk.

# Configuration

When running `mfml` from the command line, MFML will automatically try to resolve a config file named
`mfml.config.js` inside project root (other JS and TS extensions are also supported).

The most basic config file looks like this:

```ts
import { defineConfig } from 'mfml/compiler';

export default defineConfig({
  messages: {
    en: {
      greeting: 'Hello',
    },
  },
});
```

You can also explicitly specify a config file to use with the `--config` CLI option (resolved relative to `cwd`):

```shell
mfml --config my-config.js
```

There are multiple configuration options available.

## `messages`

Messages arranged by a locale.

```json5
{
  en: {
    greeting: 'Hello',
  },
  ru: {
    greeting: 'Привет',
  },
}
```

Usually, it is preferable to store messages in a separate files on per-locale basis. For example, _en.json_ and
_ru.json_. Import them in the configuration file:

```ts
import { defineConfig } from 'mfml/compiler';
import en from './en.json' with { type: 'json' };
import ru from './ru.json' with { type: 'json' };

export default defineConfig({
  messages: { en, ru },
});
```

## `outDir`

**Default:** `cwd`

The directory that contains _node_modules_ to which a package with compiled messages is written.

## `packageName`

**Default:** `@mfml/messages`

The name of the package from to which compiled messages are written.

Specify a custom package name:

```ts
export default defineConfig({
  packageName: 'my-messages',
  messages: {
    en: {
      greeting: 'Hello',
    },
  },
});
```

Import message functions from the custom package:

```ts
import { renderToString } from 'mfml';
import { greeting } from 'my-messages';

renderToString({ locale: 'en', message: greeting });
// ⮕ 'Hello'
```

## `fallbackLocales`

Mapping from a locale to a corresponding fallback locale.

For example, let's consider `fallbackLocales` set to:

```json5
{
  'ru-RU': 'ru',
  'en-US': 'en',
  ru: 'en',
}
```

In this case:

- if a message doesn't support `ru-RU` locale, then compiler would look for `ru` locale.
- if `ru` locale isn't supported as well then a compiler would fall back to `en` locale.
- if `en` isn't supported as well then `null` would be returned from a message function when called with `ru-RU`
  locale.

It is safe to have a loop in fallback locales:

```json5
{
  en: 'ru',
  ru: 'en',
}
```

This would cause a fallback to `ru` for messages that don't support `en`, and fallback to `en` for messages that don't
support `ru` without causing an infinite loop.

## `preprocessors`

The array of callbacks that are run before message parsing.

Preprocessors can be used to transform the original message text, for example to transform Markdown messages to HTML:

```ts
import { marked } from 'marked';
import { defineConfig, type Preprocessor } from 'mfml/compiler';

const parseMarkdown: Preprocessor = params => marked.parse(params.text);

export default defineConfig({
  messages: {
    en: {
      greeting: '__Hello__',
    },
  },
  preprocessors: [parseMarkdown],
});
```

The compiled message would be:

```html
<strong>Hello</strong>
```

## `postprocessors`

The array of callbacks that are run after the message was parsed as an MFML AST.

Preprocessors can be used to validate messages, rename arguments, or for other AST-based transformations.

```ts
import { defineConfig } from 'mfml/compiler';
import allowTags from 'mfml/postprocessor/allowTags';

export default defineConfig({
  messages: {
    en: {
      greeting: '<em>Hello</em>',
    },
  },
  postprocessors: [
    allowTags({
      em: true,
    }),
  ],
});
```

## `renameMessageFunction`

Returns the name of a message function for the given message key.

By default, an escaped message key is used as a function name: illegal characters are replaced with the underscore
(`"_"`).

```ts
export default defineConfig({
  messages: {
    en: {
      greeting: 'Hello',
    },
  },
  renameMessageFunction(messageKey) {
    return 'Bazinga_' + messageKey;
  },
});
```

Import the message function with the altered name:

```ts
import { renderToString } from 'mfml';
import { Bazinga_greeting } from '@mfml/messages';

renderToString({ locale: 'en', message: Bazinga_greeting });
// ⮕ 'Hello'
```

## `decodeText`

**Default:** [`decodeXML`](https://github.com/smikhalevski/speedy-entities#decode)

Decode text content before it is pushed to an MFML AST node. Use this method to decode HTML entities.

By default, the compiler supports XML entities and numeric character references:

```json5
{
  en: {
    hotOrCold: 'hot &gt; cold',
  },
}
```

Provide a custom decoder to support HTML entities:

```ts
import { decodeHTML } from 'speedy-entities';

export default defineConfig({
  messages: {
    en: {
      hello: '&CounterClockwiseContourIntegral;',
    },
  },
  decodeText: decodeHTML,
});
```

## `getArgumentTsType`

**Default:** [`getArgumentIntlTsType`](https://smikhalevski.github.io/mfml/functions/mfml_compiler.getArgumentIntlTsType.html)

Returns the TypeScript type for a given argument.

```ts
export default defineConfig({
  messages: {
    en: {
      greeting: '{name} is {age,number} years old',
    },
  },
  getArgumentTsType(argumentNode) {
    if (argumentNode.typeNode?.value === 'number') {
      return 'number|bigint';
    }
  },
});
```

This would produce a message function with the following signature:

```ts
export declare function greeting(locale: string): MessageNode<{ name: unknown; age: number | bigint }> | null;
```

By default, [`getArgumentIntlTsType`](https://smikhalevski.github.io/mfml/functions/mfml_compiler.getArgumentIntlTsType.html)
is used and returns the TypeScript type of an argument that matches the `Intl` format requirements:

| Argument type   | TypeScript type                                                           |
| :-------------- | :------------------------------------------------------------------------ |
| `number`        | `number \| bigint`                                                        |
| `date`          | `number \| Date`                                                          |
| `time`          | `number \| Date`                                                          |
| `list`          | `string[]`                                                                |
| `plural`        | `number`                                                                  |
| `selectOrdinal` | `number`                                                                  |
| `select`        | Union of category name literals and `string & {}` (for "other" category). |

## `tokenizerOptions`

**Default:** [`htmlTokenizerOptions`](https://smikhalevski.github.io/mfml/variables/mfml_parser.htmlTokenizerOptions.html)

Options that define how MFML messages are tokenized. By default, forgiving HTML tokenizer options are used.

```ts
export default defineConfig({
  messages: {
    en: {
      greeting: '<h1>Hello<p>Dear diary',
    },
  },
  tokenizerOptions: {
    implicitlyClosedTags: {
      p: ['h1'],
    },
    isUnbalancedStartTagsImplicitlyClosed: true,
  },
});
```

The compiled message would be:

```html
<h1>Hello</h1>
<p>Dear diary</p>
```

Read more about tokenization in [Parsing messages](#parsing-messages) section.

# Parsing messages

## `voidTags`

**Default:** `[]`

The list of tags that can't have any contents (since there's no end tag, no content can be put between the start tag and
the end tag).

```ts
createTokenizer({
  voidTags: ['img', 'link', 'meta'],
});
```

See [HTML5 Void Elements](https://www.w3.org/TR/2010/WD-html5-20101019/syntax.html#void-elements) for more info.

## `rawTextTags`

**Default:** `[]`

The list of tags which content is interpreted as plain text.

```ts
createTokenizer({
  rawTextTags: ['script', 'style'],
});
```

See [HTML5 Raw Text Elements](https://www.w3.org/TR/2010/WD-html5-20101019/syntax.html#raw-text-elements) for more info.

## `implicitlyClosedTags`

**Default:** `{}`

The map from a tag to a list of tags that must be closed if it is opened.

For example, in HTML `p` and `h1` tags have the following semantics:

<!-- prettier-ignore -->
```html
<p><h1>  ⮕  <p></p><h1></h1>
                ^^^^
```

To achieve this behavior, set this option to:

```ts
createTokenizer({
  implicitlyClosedTags: {
    // h1 implicitly closes p
    h1: ['p'],
  },
});
```

Use in conjunctions with [`isUnbalancedStartTagsImplicitlyClosed`](#isunbalancedstarttagsimplicitlyclosed).

## `implicitlyOpenedTags`

**Default:** `[]`

The list of tags for which a start tag is inserted if an unbalanced end tag is met. Otherwise,
a [`ParserError`](https://smikhalevski.github.io/mfml/classes/mfml_parser.ParserError.html) is thrown.

You can ignore unbalanced end tags with [`isUnbalancedEndTagsIgnored`](#isunbalancedendtagsignored).

For example, in HTML `p` and `br` tags follow this semantics:

```html
</p>   ⮕  <p></p>
           ^^^

</br>  ⮕  <br/>
              ^
```

To achieve this behavior, set this option to:

```ts
createTokenizer({
  implicitlyOpenedTags: ['p', 'br'],
});
```

## `isCaseInsensitiveTags`

**Default:** `false`

If `true` then ASCII alpha characters are case-insensitive in tag names.

This markup would cause a [`ParserError`](https://smikhalevski.github.io/mfml/classes/mfml_parser.ParserError.html) if
`isCaseInsensitiveTags` is set to `false`:

<!-- prettier-ignore -->
```html
<strong>hello</STRONG>
```

## `isSelfClosingTags​Recognized`

**Default:** `false`

If `true` then self-closing tags are recognized, otherwise they are treated as start tags.

<!-- prettier-ignore -->
```html
<link />
      ^
```

## `isUnbalancedStartTags​ImplicitlyClosed`

**Default:** `false`

If `true` then unbalanced start tags are forcefully closed. Otherwise,
a [`ParserError`](https://smikhalevski.github.io/mfml/classes/mfml_parser.ParserError.html) is thrown.

Use in conjunctions with [`isUnbalancedEndTagsIgnored`](#isunbalancedendtagsignored).

```html
<a><b></a>  ⮕  <a><b></b></a>
                      ^^^^
```

## `isUnbalancedEndTags​Ignored`

**Default:** `false`

If `true` then end tags that don't have a corresponding start tag are ignored. Otherwise,
a [`ParserError`](https://smikhalevski.github.io/mfml/classes/mfml_parser.ParserError.html) is thrown.

Use in conjunctions with [`isUnbalancedStartTagsImplicitlyClosed`](#isunbalancedstarttagsimplicitlyclosed).

```html
<a></b></a> ⮕ <a></a>
   ^^^^
```

## `isRawTextInterpolated`

**Default:** `false`

If `true` then arguments are parsed inside [`rawTextTags`](#rawtexttags).

With this setup:

```ts
createTokenizer({
  rawTextTags: ['script'],
  isRawTextInterpolated: true,
});
```

An argument inside the `<script>` tag would be interpolated:

<!-- prettier-ignore -->
```html
<script>console.log('{name}')</script>
                     ^^^^^^
```

## `isOctothorpeRecognized`

**Default:** `false`

If `true` then an octothorpe character ("#") inside an argument category is replaced with the argument value.

```html
{gender, select, male { He is a man } female { She is a # }} ^
```

# XML/HTML markup

# Arguments

# Formatters

# Preprocessors

# Postprocessors

# React integration

<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->
<!-- !!!!!!!!!!!!!!! -->

# Parse a message

In [Overview](#overview) section we showed how messages can be compiled into message functions. A message function
returns an AST that describes a message.

```ts
import { greeting } from './messages.js';

const messageNode = greeting('en-US');
```

This returns a [`MessageNode`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/mfml/interfaces/mfml.MessageNode.html)
instance that looks like this:

```json
{
  "type": "message",
  "locale": "en",
  "children": [
    "Hello, ",
    {
      "type": "element",
      "tagName": "b",
      "attributes": null,
      "children": [
        {
          "type": "argument",
          "name": "name"
        }
      ]
    },
    "!"
  ]
}
```

AST can be analyzed at runtime and rendered in any way you want.

Messages can also be parsed at runtime using
[`parseMessage`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/mfml/functions/mfml_parser.parseMessage.html):

```ts
import { parseMessage } from 'mfml/parser';

const messageNode = parseMessage('en-US', 'Hello, <b>{name}</b>!');
```

# Render a message as plain text

Message nodes can be rendered as plain text using
[`renderToString`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/mfml/interfaces/mfml.MessageNode.html):

```ts
import { parseMessage } from 'mfml/parser';
import { renderToString } from 'mfml';

const messageNode = parseMessage('en-US', 'Hello, <b>{name}</b>!');

renderToString(messageNode, { name: 'Bob' });
// ⮕ 'Hello, Bob!'
```

Note that `renderToString` doesn't render tags.

# React integration

Integrate translations into a React app:

```tsx
import { Message, MessageLocaleProvider } from 'mfml/react';
import { greeting } from './translations.js';

<MessageLocaleProvider value={'en-US'}>
  <Message
    message={greeting}
    values={{ name: <MyComponent>Bob</MyComponent> }}
  />
</MessageLocaleProvider>;
```

# Arguments and formatters

ICU MessageFormat is a templating syntax designed for internationalized messages. It allows developers to insert
variables, handle pluralization, gender, and select logic in a locale-aware way. MFML supports all ICU MessageFormat
features and allows to customize and extend them.

The most basic use case is argument placeholder replacement:

```
Hello, {name}!
```

Here, `{name}` is an argument that doesn't impose any formatting on its value. By default, during interpolation,
the actual value is cast to a string. Spaces around the argument name are ignored, so this yield the same result as:

```ts
const messageNode = parseMessage('en', 'Hello, {   name   }!');

renderToString(messageNode, { name: 'Bill' });
// ⮕ 'Hello, Bill!'
```

Argument values can be formatted during interpolation. Provide an argument type to pick a formatter that should be used:

```
You have {count, number} messages.
```

`number` uses an `Intl.NumberFormat` for formatting. MFML has three built-in argument types: `number`, `date` and
`time`. Both `date` and `time` rely on `Intl.DateTimeFormat`.

```ts
const messageNode = parseMessage('en', 'You have {count, number} messages.');

renderToString(messageNode, { count: 1024 });
// ⮕ 'You have 1,024 messages.'
```

You can provide a style for a formatter:

```
Download {progress, number, percent} complete.
```

Here a `number` formatter is used with a `percent` style:

```ts
const messageNode = parseMessage('en', 'Download {progress, number, percent} complete.');

renderToString(messageNode, { progress: 0.75 });
// ⮕ 'Download 75% complete.'
```

Built-in formatters support the following styles:

| Formatter | Style   | Example                         |
| :-------- | :------ | :------------------------------ |
| date      | short   | 1/1/70                          |
| date      | full    | Thursday, January 1, 1970       |
| date      | long    | January 1, 1970                 |
| date      | medium  | Jan 1, 1970                     |
| time      | short   | 3:00 AM                         |
| time      | full    | 3:00:00 AM Moscow Standard Time |
| time      | long    | 3:00:00 AM GMT+3                |
| time      | medium  | 3:00:00 AM                      |
| number    | decimal | 1,000                           |
| number    | percent | 75%                             |

# Value matching

Arguments can be used for value matching. For example, if you want to alter a message depending on a user's gender:

```
{gender, select, =male {He} =female {She} other {They}} sent you a message.
```

Value of the `gender` argument is used for selecting a specific category. If value is `"male"` then argument placeholder
is replaced with "He", if value is `"female"` then with "She", and for any other value "They" is rendered:

```ts
const messageNode = parseMessage('en', '{gender, select, =male {He} =female {She} other {They}} sent you a message.');

renderToString(messageNode, { gender: 'female' });
// ⮕ 'She sent you a message.'
```

Note that literal values are prefixed with an equals sign "=" while `other` isn't. This is because `other` is a special
category: it's value is used if no literal did match. If there's no matching category in `select` and no `outer`
category then argument placeholder is replaced with an empty string:

```ts
const messageNode = parseMessage('en', '{gender, select, =male {He}} sent you a message.');

renderToString(messageNode, { gender: 'helicopter' });
// ⮕ ' sent you a message.'
```

Be sure to always provide the `other` category as a fallback.

# Pluralization

Numeric argument values can be pluralized in cardinal and ordinal fashion.

Use `plural` argument type for cardinal pluralization rules:

```ts
const messageNode = parseMessage('en', 'You have {count, plural, one {one message} other {# messages}}.');

renderToString(messageNode, { count: 0 });
// ⮕ 'You have 0 messages.'

renderToString(messageNode, { count: 1 });
// ⮕ 'You have one message.'

renderToString(messageNode, { count: 75 });
// ⮕ 'You have 75 messages.'
```

You can use the special token (`#`, aka octothorpe) as a placeholder for the numeric value and it'll be output as if
`{count}` was used. If you want apply a specific formatting, use an argument placeholder:

```diff
- const messageNode = parseMessage('en', 'You have {count, plural, one {one message} other {# messages}}.');
+ const messageNode = parseMessage('en', 'You have {count, plural, one {one message} other {{count, number} messages}}.');
```

Following cardinal categories are supported:

<dl>
<dt>zero</dt>
<dd>
This category is used for languages that have grammar specialized specifically for zero number of items.
(Examples are Arabic and Latvian.)
</dd>

<dt>one</dt>
<dd>
This category is used for languages that have grammar specialized specifically for one (singular) item. Many languages,
but not all, use this plural category. (Many popular Asian languages, such as Chinese and Japanese, do not use
this category.)
</dd>

<dt>two</dt>
<dd>
This category is used for languages that have grammar specialized specifically for two (dual) items.
(Examples are Arabic and Welsh.)
</dd>

<dt>few</dt>
<dd>
This category is used for languages that have grammar specialized specifically for a small number (paucal) of items.
For some languages this is used for 2-4 items, for some 3-10 items, and other languages have even more complex rules.
</dd>

<dt>many</dt>
<dd>
This category is used for languages that have grammar specialized specifically for a larger number of items.
(Examples are Arabic, Polish, and Russian.)
</dd>

<dt>other</dt>
<dd>
This category is used if the value doesn't match one of the other plural categories. Note that this is used for `plural`
for languages (such as English) that have a simple "singular" versus "plural" dichotomy.
</dd>
</dl>

`plural` supports literal value matching as well:

```ts
const messageNode = parseMessage(
  'en',
  'You have {count, plural, =0 {no messages} one {one message} other {# messages}}.'
);

renderToString(messageNode, { count: 0 });
// ⮕ 'You have no messages.'
```

Use `selectordinal` for ordinal pluralization rules:

```ts
const messageNode = parseMessage(
  'en',
  'You finished {position, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}.'
);

renderToString(messageNode, { count: 1 });
// ⮕ 'You finished 1st.'

renderToString(messageNode, { count: 3 });
// ⮕ 'You finished 3rd.'

renderToString(messageNode, { count: 100 });
// ⮕ 'You finished 100th.'
```

Following ordinal categories are supported:

<dl>
<dt>zero</dt>
<dd>
This category is used for languages that have grammar specialized specifically for zero number of items.
(Examples are Arabic and Latvian.)
</dd>

<dt>one</dt>
<dd>
This category is used for languages that have grammar specialized specifically for one item. Many languages,
but not all, use this plural category. (Many popular Asian languages, such as Chinese and Japanese, do not use this
category.)
</dd>

<dt>two</dt>
<dd>
This category is used for languages that have grammar specialized specifically for two items.
(Examples are Arabic and Welsh.)
</dd>

<dt>few</dt>
<dd>
This category is used for languages that have grammar specialized specifically for a small number of items. For some
languages this is used for 2-4 items, for some 3-10 items, and other languages have even more complex rules.
</dd>

<dt>many</dt>
<dd>
This category is used for languages that have grammar specialized specifically for a larger number of items.
(Examples are Arabic, Polish, and Russian.)
</dd>

<dt>other</dt>
<dd>
This category is used if the value doesn't match one of the other plural categories. Note that this is used for `plural`
for languages (such as English) that have a simple "singular" versus "plural" dichotomy.
</dd>
</dl>

# Motivation

Splitting the app code into chunks and loading those chunks at runtime is usually handled by a bundler. Modern i18n
tools, such as `i18next`, rely on JSON files that are baked into an application bundle or loaded asynchronously. This
approach has several downsides:

- You have to somehow split your translations into separate JSON files before bundling. Otherwise, your clients would
  have to download all translations at application start;
- You have to load translations manually when they are needed;
- Non-used translations are still bundled and loaded unless you manually delete them;
- Errors, such as missed interpolation parameters and illegal parameter types, are thrown at runtime.

All the above is highly error-prone due to the human factor.

MFML compiles translations into message functions that you can import as a module into your code. This approach provides
multiple benefits:

- Message functions are bundled and loaded along with your code. So you don't have to manage the translation loading
  process manually;
- Message functions are tree-shakeable, so chunks assembled by a bundler would contain only used translations;
- Message functions can be type-checked at compile time. So you won't forget that translation required a parameter, or a
  parameter must be of a particular type. Change in the translation key would require changes in modules that import a
  corresponding message function. Otherwise, a type checker, or a bundler would signal you that the imported function is
  missing;
- Message functions use a runtime to render the translation. Runtimes can produce React elements, plain strings, or any
  other output you need.

<!--/ARTICLE-->
