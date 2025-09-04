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

This section shows how to prepare and build i18n messages with MFML.

Save your messages in a _messages.json_:

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

Create the build script in _build-messages.ts_:

```ts
import fs from 'node:fs';
import { compileFiles } from 'mfml/compiler';
import messages from './messages.json' with { type: 'json' };

fs.writeFileSync(import.meta.dirname + '/messages.ts', compileFiles(messages));
```

Build messages:

```shell
node build-messages.ts
```

This would produce _messages.ts_ with the following contents:

<!--prettier-ignore-->
```ts
import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S,type MessageNode}from"mfml";

const LOCALE_EN_US="en-US";
const LOCALE_RU_RU="ru-RU";

export function greeting(locale:string):MessageNode<{"name":unknown}>|null{
return locale===LOCALE_EN_US?M(LOCALE_EN_US,"Hello, ",E("b",null,A("name")),"!'"):locale===LOCALE_RU_RU?M(LOCALE_RU_RU,"Привет, ",E("b",null,A("name")),"!'"):null;
}
```

Now, you can import functions exported from _messages.ts_ to produce text messages:

```ts
import { renderText } from 'mfml';
import { greeting } from './messages.js';

renderText(greeting('en-US'), { name: 'Bob' });
// ⮕ 'Hello, Bob!'
```

Or render messages in your React app:

```tsx
import { Message } from 'mfml/react';
import { greeting } from './messages.js';

export const App = () => (
  <Message
    message={greeting}
    values={{ name: 'Bob' }}
  />
);
```

This renders markup with HTML elements:

```html
Hello, <b>Bob</b>!
```

Now, your bundler would do all the heavy lifting an colocate message functions with components that use them in the same
chunk.

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
[`renderText`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/mfml/interfaces/mfml.MessageNode.html):

```ts
import { parseMessage } from 'mfml/parser';
import { renderText } from 'mfml';

const messageNode = parseMessage('en-US', 'Hello, <b>{name}</b>!');

renderText(messageNode, { name: 'Bob' });
// ⮕ 'Hello, Bob!'
```

Note that `renderText` doesn't render tags.

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

renderText(messageNode, { name: 'Bill' });
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

renderText(messageNode, { count: 1024 });
// ⮕ 'You have 1,024 messages.'
```

You can provide a style for a formatter:

```
Download {progress, number, percent} complete.
```

Here a `number` formatter is used with a `percent` style:

```ts
const messageNode = parseMessage('en', 'Download {progress, number, percent} complete.');

renderText(messageNode, { progress: 0.75 });
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

renderText(messageNode, { gender: 'female' });
// ⮕ 'She sent you a message.'
```

Note that literal values are prefixed with an equals sign "=" while `other` isn't. This is because `other` is a special
category: it's value is used if no literal did match. If there's no matching category in `select` and no `outer`
category then argument placeholder is replaced with an empty string:

```ts
const messageNode = parseMessage('en', '{gender, select, =male {He}} sent you a message.');

renderText(messageNode, { gender: 'helicopter' });
// ⮕ ' sent you a message.'
```

Be sure to always provide the `other` category as a fallback.

# Pluralization

Numeric argument values can be pluralized in cardinal and ordinal fashion.

Use `plural` argument type for cardinal pluralization rules:

```ts
const messageNode = parseMessage('en', 'You have {count, plural, one {one message} other {# messages}}.');

renderText(messageNode, { count: 0 });
// ⮕ 'You have 0 messages.'

renderText(messageNode, { count: 1 });
// ⮕ 'You have one message.'

renderText(messageNode, { count: 75 });
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

renderText(messageNode, { count: 0 });
// ⮕ 'You have no messages.'
```

Use `selectordinal` for ordinal pluralization rules:

```ts
const messageNode = parseMessage(
  'en',
  'You finished {position, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}.'
);

renderText(messageNode, { count: 1 });
// ⮕ 'You finished 1st.'

renderText(messageNode, { count: 3 });
// ⮕ 'You finished 3rd.'

renderText(messageNode, { count: 100 });
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
