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

The [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/) +
XML/HTML compiler and runtime that makes your i18n messages tree-shakeable.

- TypeScript-first.
- Tree-shakeable: colocates messages with the code that uses them.
- Integrates with any translation management system.
- Highly customizable.
- First-class React support.
- Zero dependencies.
- XSS-resilient: no dangerous HTML rendering.
- [Just 2 kB gzipped.](https://bundlephobia.com/result?p=mfml)

<!--/OVERVIEW-->

<br>

```sh
npm install --save-prod mfml
```

<br>

<!--/ARTICLE-->

<!--TOC-->

- [API docs](https://smikhalevski.github.io/mfml/)

<span class="toc-icon">🔰&ensp;</span>[**Quick start**](#quick-start)

- [Syntax overview](#syntax-overview)
- [Arguments](#arguments)
- [Types and styles](#types-and-styles)
- [Options](#options)
- [Categories](#categories)
- [Pluralization](#pluralization)

<span class="toc-icon">⚛️&ensp;</span>**Rendering**

- [Render to string](#render-to-string)
- [React integration](#react-integration)
- [Custom formatters](#custom-formatters)

<span class="toc-icon">⚙️&ensp;</span>[**Devtool**](#devtool)

<span class="toc-icon">🛠️&ensp;</span>[**Configuration**](#configuration)

- [`messages`](#messages)
- [`outDir`](#outdir)
- [`packageName`](#packagename)
- [`fallbackLocales`](#fallbacklocales)
- [`preprocessors`](#preprocessors)
- [`postprocessors`](#postprocessors)
- [`renameMessageFunction`](#renamemessagefunction)
- [`decodeText`](#decodetext)
- [`getArgumentTSType`](#getargumenttstype)
- [`tokenizerOptions`](#tokenizeroptions)

<span class="toc-icon">🪵&ensp;</span>[**Tokenizing messages**](#tokenizing-messages)

- [`voidTags`](#voidtags)
- [`rawTextTags`](#rawtexttags)
- [`implicitlyClosedTags`](#implicitlyclosedtags)
- [`implicitlyOpenedTags`](#implicitlyopenedtags)
- [`isCaseInsensitive​Tags`](#iscaseinsensitivetags)
- [`isSelfClosingTags​Recognized`](#isselfclosingtagsrecognized)
- [`isUnbalancedStart​Tags​Implicitly​Closed`](#isunbalancedstarttagsimplicitlyclosed)
- [`isUnbalancedEndTags​Ignored`](#isunbalancedendtagsignored)
- [`isRawText​Interpolated`](#israwtextinterpolated)
- [`isOctothorpe​Recognized`](#isoctothorperecognized)

<span class="toc-icon">🌲&ensp;</span>[**Parsing messages**](#parsing-messages)

<span class="toc-icon">🎯&ensp;</span>[**Motivation**](#motivation)

<!--/TOC-->

<!--ARTICLE-->

# Quick start

Put your i18n messages in _messages.json_, grouped by locale:

```json
{
  "en": {
    "greeting": "Hello, <b>{name}</b>!"
  },
  "ru": {
    "greeting": "Привет, <b>{name}</b>!"
  }
}
```

Put your [config](#configuration) in _mfml.config.js_:

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

This would create the `@mfml/messages` npm package in _node_modules_ directory. You can configure
the [package name](#packagename) and the [output directory](#outdir) to your liking.

In your application code, import message functions to produce formatted text:

```ts
import { renderToString } from 'mfml';
import { greeting } from '@mfml/messages';

renderToString({
  message: greeting,
  values: { name: 'Bob' },
  locale: 'en',
});
// ⮕ 'Hello, Bob!'
```

Or render messages with React:

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

Now, your bundler would do all the heavy lifting and colocate message functions with components that import them in
the same chunk.

## Syntax overview

The MFML syntax is a hybrid of
the [ICU MessageFormat](https://unicode-org.github.io/icu/userguide/format_parse/messages/) syntax
and XML/HTML.

ICU MessageFormat is a templating syntax designed for internationalized messages. It allows developers to insert
variables and handle pluralization, gender, and selection logic in a locale-aware way. MFML supports all
ICU MessageFormat features and allows you to customize and extend them.

Here's the basic [argument syntax](#arguments):

```
{name}
```

Enable formatting by specifying data [type and style](#types-and-styles):

```
{age, number, integer}
```

Select over [argument categories](#categories):

```
{gender, select,
  male { He is a # }
  female { She is a # }
}
```

[Pluralization](#pluralization) is handled through argument categories as well:

```
You have {messageCount, plural,
  one { one message }
  other { # messages }
}
```

MFML supports XML/HTML tags and attributes:

```html
Hello, <strong>{name}</strong>!
```

Arguments can be used where XML/HTML allows text:

```html
<abbr title="Greetings to {name}">Hello, {name}!</abbr>
```

You can use your custom tags and setup a [custom renderer](#custom-renderer) to properly display them:

```html
<Hint title="Final offer at {discount, percent} discount!">{price}</Hint>
```

## Arguments

The most basic use case is argument placeholder replacement:

```
Hello, {name}!
```

Here, `{name}` is an argument that doesn't impose any formatting on its value. Spaces around the argument name are
ignored, so this yields the same result:

```
Hello, {   name   }!
```

[By default](#custom-formatters), during interpolation, the argument values are cast to string.

## Types and styles

Argument values can be formatted during interpolation. Provide an argument type to select the formatter to use:

```
You have {count, number} messages.
                 ^^^^^^
```

Here, `number` is an argument type. [By default](#custom-formatters), `number` type uses
[`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
for formatting.

You can also provide a style for a formatter:

```
Download {progress, number, percent} complete.
                            ^^^^^^^
```

Default configuration provides following argument types and styles:

<table>
<tr>
<th align="left">Argument type</th>
<th align="left">Argument style</th>
<th align="left">Example, <code>en</code> locale</th>
<th align="left">Required value type</th>
</tr>

<tr>
<td valign="top" rowspan="5"><code>number</code></td>
<td>—</td>
<td>1,000.99</td>
<td valign="top" rowspan="5"><code>number</code> or <code>bigint</code></td>
</tr>
<tr>
<td><code>decimal</code></td>
<td>1,000.99</td>
</tr>
<tr>
<td><code>integer</code></td>
<td>1,000</td>
</tr>
<tr>
<td><code>percent</code></td>
<td>75%</td>
</tr>
<tr>
<td><code>currency</code></td>
<td>$1,000.00</td>
</tr>

<tr>
<td valign="top" rowspan="5"><code>date</code></td>
<td>—</td>
<td>1/1/1970</td>
<td valign="top" rowspan="5"><code>number</code> or <code>Date</code></td>
</tr>
<tr>
<td><code>short</code></td>
<td>1/1/70</td>
</tr>
<tr>
<td><code>medium</code></td>
<td>Jan 1, 1970</td>
</tr>
<tr>
<td><code>long</code></td>
<td>January 1, 1970</td>
</tr>
<tr>
<td><code>full</code></td>
<td>Thursday, January 1, 1970</td>
</tr>

<tr>
<td valign="top" rowspan="5"><code>time</code></td>
<td>—</td>
<td>12:00 AM</td>
<td valign="top" rowspan="5"><code>number</code> or <code>Date</code></td>
</tr>
<tr>
<td><code>short</code></td>
<td>12:00 AM</td>
</tr>
<tr>
<td><code>medium</code></td>
<td>12:00:00 AM</td>
</tr>
<tr>
<td><code>long</code></td>
<td>12:00:00 AM UTC</td>
</tr>
<tr>
<td><code>full</code></td>
<td>12:00:00 AM Coordinated Universal Time</td>
</tr>

<tr>
<td valign="top" rowspan="4"><code>conjunction</code></td>
<td>—</td>
<td>A, B, and C</td>
<td valign="top" rowspan="4"><code>string[]</code></td>
</tr>
<tr>
<td><code>narrow</code></td>
<td>A, B, C</td>
</tr>
<tr>
<td><code>short</code></td>
<td>A, B, & C</td>
</tr>
<tr>
<td><code>long</code></td>
<td>A, B, and C</td>
</tr>

<tr>
<td valign="top" rowspan="4"><code>disjunction</code></td>
<td>—</td>
<td>A, B, or C</td>
<td valign="top" rowspan="4"><code>string[]</code></td>
</tr>
<tr>
<td><code>narrow</code></td>
<td>A, B, or C</td>
</tr>
<tr>
<td><code>short</code></td>
<td>A, B, or C</td>
</tr>
<tr>
<td><code>long</code></td>
<td>A, B, or C</td>
</tr>

</table>

## Options

Instead of using a predefined style, you can provide a set of options for a formatter:

```
{propertyArea, number,
  style=unit
  unit=acre
  unitDisplay=long
}
```

Here `style`, `unit` and `unitDisplay` are options of
the [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat).

You can find the full list of options for
[`number` arguments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#style_options)
and for
[`date` and `time` arguments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#locale_options)
on MDN.

## Categories

Arguments can use categories for conditional rendering. For example, if you want to alter a message depending on
a user's gender:

```
{gender, select,
  male {He}
  female {She}
  other {They}
}
sent you a message.
```

Value of the `gender` argument is used for selecting a specific category. If the value is `"male"` then argument
placeholder is replaced with "He", if value is `"female"` then with "She", and for any other value "They" is rendered.

`other` is a special category: its value is used if no other category matches. If there's no matching category in
`select` and no `other` category, the argument placeholder is replaced with an empty string.

It is recommended to always provide the `other` category as a fallback.

## Pluralization

Numeric argument values can be pluralized in cardinal and ordinal fashion.

Use `plural` argument type for cardinal pluralization rules:

```
You have {messageCount, plural,
  one {one message}
  other {# messages}
}.
```

Following cardinal categories are supported with `plural`:

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

Use `selectOrdinal` argument type for ordinal pluralization rules:

```
You have finished {position, selectOrdinal,
  one {#st}
  two {#nd}
  few {#rd}
  other {#th}
}.
```

Following ordinal categories are supported with `selectOrdinal`:

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

You can use the special token (`#`, aka octothorpe) as a placeholder inside a category. By default, both `plural`
and `selectOrdinal` argument types format `#` using [`number` argument type without style](#types-and-styles).

If you want apply a specific formatting, use an explicit argument instead of an octothorpe:

```
You have {messageCount, plural,
  one {one message}
  other {{messageCount, number, useGrouping=false} messages}
}.
```

Both `plural` and `selectOrdinal` support literal value matching. Prefix a value with an equals character `=`:

```
You have {messageCount, plural,
  =0 {no messages}
  one {one message}
  other {# messages}
}.
```

# Render to string

Render messages as plain text using
[`renderToString`](https://smikhalevski.github.io/mfml/functions/mfml.renderToString.html):

For example if you compiled a message:

```json
{
  "en": {
    "greeting": "Hello, <b>{name}</b>!"
  }
}
```

Then you can render it to string:

```ts
import { renderToString } from 'mfml';
import { greeting } from '@mfml/messages';

renderToString({
  message: greeting,
  values: { name: 'Bob' },
  locale: 'en',
});
// ⮕ 'Hello, Bob!'
```

By default, `renderToString` doesn't render tags and outputs only their contents. It also ignores tags that aren't
lowercase alpha: these are considered custom tags. You can change this behavior by providing a custom renderer:

```ts
import { defaultArgumentFormatter, defaultCategorySelector, type Renderer } from 'mfml';

const myRenderer: Renderer<string> = {
  renderElement(tagName, attributes, children) {
    return tagName === 'b' ? `__${children.join('')}__` : children.join('');
  },

  formatArgument: defaultArgumentFormatter,
  selectCategory: defaultCategorySelector,
};

renderToString({
  message: greeting,
  values: { name: 'Bob' },
  locale: 'en',
  renderer: myRenderer,
});
// ⮕ 'Hello, __Bob__!'
```

# React integration

MFML provides a set of components to render compiled i18n message function with React.

For example if you compiled a message:

```json
{
  "en": {
    "greeting": "Hello, <b>{name}</b>!"
  }
}
```

Then you can render it with React using
[`<Message>`](https://smikhalevski.github.io/mfml/functions/mfml_react.Message.html) component:

```tsx
import { Message, MessageLocaleProvider } from 'mfml/react';
import { greeting } from '@mfml/messages';

export const App = () => (
  <MessageLocaleProvider value={'en'}>
    <Message
      message={greeting}
      values={{ name: 'Bob' }}
    />
  </MessageLocaleProvider>
);
```

This would output:

```html
Hello, <b>Bob</b>!
```

If argument doesn't have a [type specified](#types-and-styles), then you can pass an arbitrary React markup as its
value:

```tsx
<Message
  message={greeting}
  values={{ name: <Cool>Bob</Cool> }}
/>
```

This would output:

<!-- prettier-ignore -->
```html
Hello, <b><Cool>Bob</Cool></b>!
```

## Custom renderer

By default, `<Message>` only renders tags that are lowercase alpha. Other tags are considered custom tags. You can
provide a custom renderer to support custom tags:

```tsx
import { type ReactNode } from 'react';
import { defaultArgumentFormatter, defaultCategorySelector, type Renderer } from 'mfml';
import { createReactDOMElementRenderer, Message, MessageLocaleProvider, MessageRendererProvider } from 'mfml/react';

// 1️⃣ Create a custom component
function Hint(props: { text: string; children: ReactNode }) {
  return <div title={props.text}>{props.children}</div>;
}

// 2️⃣ Create a custom renderer
const myRenderer: Renderer<string> = {
  renderElement: createReactDOMElementRenderer({
    Hint,
  }),
  formatArgument: defaultArgumentFormatter,
  selectCategory: defaultCategorySelector,
};

export const App = () => (
  // 3️⃣ Provide renderer through the context
  <MessageRendererProvider value={myRenderer}>
    <MessageLocaleProvider value={'en'}>{/* Render messages here */}</MessageLocaleProvider>
  </MessageRendererProvider>
);
```

Now you can use `<Hint>` component in your i18n messages:

```json
{
  "en": {
    "finalOffer": "Final offer: <Hint text='{discount, percent} discount!'>{price, currency}</Hint>"
  }
}
```

Render the compiled message function:

```tsx
<Message
  message={finalOffer}
  values={{ discount: 0.2, price: 1000 }}
/>
```

This would output:

<!-- prettier-ignore -->
```html
Final offer:
<div title='20% discount!'>$1,000</div>
```

# Custom formatters

MFML provides
the [`defaultArgumentFormatter`](https://smikhalevski.github.io/mfml/variables/mfml.defaultArgumentFormatter.html)
that supports `number`, `date`, `time`, `conjunction` and `disjunction` argument types
and [corresponding styles](#types-and-styles).

To change how formatters are applied, you should create a custom renderer and provide it to
[`renderToString`](#render-to-string) or to [`<Message>`](#react-integration) component (as a prop or through
a [`<MessageRendererProvider>`](https://smikhalevski.github.io/mfml/variables/mfml_react.MessageRendererProvider.html)).

Let's assume we've compiled the function which is called `randomFact` for the following message:

```
USA border length is {borderLength, unitMeter}.
                                    ^^^^^^^^^
```

Here, `unitMeter` is a custom type. Now, let's create a formatter that formats arguments with this type:

```ts
import { type ArgumentFormatter } from 'mfml';

const unitMeterArgumentFormatter: ArgumentFormatter = params => {
  if (params.type === 'unitMeter' && typeof params.value === 'number') {
    const numberFormat = new Intl.NumberFormat(params.locale, {
      style: 'unit',
      unit: 'meter',
    });

    return numberFormat.format(params.value);
  }

  return params.value;
};
```

Now, lets crete a string renderer that uses this formatter:

```ts
import { defaultArgumentFormatter, defaultCategorySelector, type Renderer } from 'mfml';

const myRenderer: Renderer<string> = {
  renderElement: (tagName, attributes, children) => children.join(''),

  // 🟡 Pass a custom formatter
  formatArgument: unitMeterArgumentFormatter,
  selectCategory: defaultCategorySelector,
};
```

Render a message to string using this custom renderer:

```ts
renderToString({
  message: randomFact,
  values: { borderLength: 8_891_000 },
  locale: 'en',

  // 🟡 Pass a custom renderer
  renderer: myRenderer,
});
// ⮕ 'USA border length is 8,891,000 m.'
```

Usually, you want multiple formatters to be available, so MFML provides factories that simplify formatter declarations:

```ts
import { combineArgumentFormatters, createNumberArgumentFormatter, createDateTimeArgumentFormatter } from 'mfml';

const myArgumentFormatter = combineArgumentFormatters([
  unitMeterArgumentFormatter,

  createNumberArgumentFormatter('number', 'decimal'),
  createNumberArgumentFormatter('number', 'integer', { maximumFractionDigits: 0 }),

  createDateTimeArgumentFormatter('date', 'short', { dateStyle: 'short' }),
]);
```

[`combineArgumentFormatters`](https://smikhalevski.github.io/mfml/functions/mfml.combineArgumentFormatters.html)
creates an argument formatter that sequentially applies each formatter from the list of formatters until one returns
a formatted value. If none of the formatters returns a formatted value, then a value returned as-is.

Of you can fallback to a default formatter:

<!-- prettier-ignore -->
```ts
import { combineArgumentFormatters, defaultArgumentFormatter } from 'mfml';

const myArgumentFormatter = combineArgumentFormatters([
  unitMeterArgumentFormatter,
  defaultArgumentFormatter,
]);
```

# Devtool

MFML provides the devtool for React DOM applications. To enable it, call
[`enableDevtool`](https://smikhalevski.github.io/mfml/functions/mfml_react.enableDevtool.html)
anywhere in your client-side code (on the server-side it is a no-op):

```ts
import { enableDevtool } from 'mfml/react';
import { debugInfo } from '@mfml/messages/metadata';

enableDevtool(debugInfo);
```

Here [`@mfml/messages`](#packagename) is a package generated by the `mfml` compiler. The exported `debugInfo` may have
substantial size, so it is recommended to split it into a separate chunk:

```ts
import { enableDevtool } from 'mfml/react';

import('@mfml/messages/metadata').then(module => enableDevtool(module.debugInfo));
```

To use the devtool, press and hold the <kbd>Alt</kbd> key (or <kbd>Option</kbd> key on Mac), then hover over a rendered
message text to reveal the related message information.

# Configuration

When running `mfml` from the command line, MFML will automatically try to resolve a config file named
_mfml.config.js_ inside the `cwd` (other JS and TS extensions are also supported).

The most basic config file looks like this:

```ts
import { defineConfig } from 'mfml/compiler';

export default defineConfig({
  messages: {
    // Your i18n messages go here, grouped by locale
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

It is recommended to store messages in separate files on per-locale basis:

<!-- prettier-ignore -->
```json5
// en.json
{
  "greeting": "Hello"
}
```

<!-- prettier-ignore -->
```json5
// ru.json
{
  "greeting": "Привет"
}
```

Then import them in your configuration file:

```ts
// mfml.config.json
import { defineConfig } from 'mfml/compiler';
import en from './en.json' with { type: 'json' };
import ru from './ru.json' with { type: 'json' };

export default defineConfig({
  messages: {
    en,
    ru,
  },
});
```

## `outDir`

**Default:** The directory that contains the config file.

The directory that contains _node_modules_ where a [package](#packagename) with compiled messages is written.

## `packageName`

**Default:** `@mfml/messages`

The name of the package where compiled messages are stored.

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

Import message functions from a custom package:

```ts
import { renderToString } from 'mfml';
import { greeting } from 'my-messages';

renderToString({
  message: greeting,
  locale: 'en',
});
// ⮕ 'Hello'
```

## `fallbackLocales`

**Default:** `{}`

Mapping from a locale to a corresponding fallback locale.

For example, let's consider `fallbackLocales` set to:

<!-- prettier-ignore -->
```json5
{
  'en-US': 'en',
  'ru-RU': 'ru',
  'ru': 'en',
}
```

In this case:

- If a message doesn't support the `ru-RU` locale, the compiler will look for the `ru` locale.

- If the `ru` locale isn't supported either, the compiler will fall back to the `en` locale.

- If the `en` locale also isn't supported, the message function will return `null` when called with the `ru-RU` locale.

It is safe to have loops in fallback locales:

```json5
{
  en: 'ru',
  ru: 'en',
}
```

This setup would result in a fallback to `ru` for messages that don't support `en`, and a fallback to `en` for messages
that don't support `ru`.

## `preprocessors`

**Default:** `[]`

The array of callbacks that are run _before_ the message is parsed as an MFML AST.

Here's how to transform Markdown messages before compilation:

```ts
import { marked } from 'marked';
import { defineConfig, type Preprocessor } from 'mfml/compiler';

const transformMarkdown: Preprocessor = params => marked.parse(params.text);

export default defineConfig({
  messages: {
    en: {
      greeting: '__Hello__',
    },
  },
  preprocessors: [transformMarkdown],
});
```

The compiled `greeting` message would have the following markup:

```html
<p><strong>Hello</strong></p>
```

## `postprocessors`

**Default:** `[]`

The array of callbacks that are run _after_ the message was parsed as an MFML AST.

Preprocessors can be used to validate messages, rename arguments, or for other AST-based transformations.

Here's how to rename all message arguments before compilation:

```ts
import { walkNode } from 'mfml';
import { defineConfig, type Postprocessor } from 'mfml/compiler';

const renameArguments: Postprocessor = params => {
  walkNode(params.messageNode, node => {
    if (node.nodeType === 'argument') {
      node.name = node.name.toLowerCase();
    }
  });

  return params.messageNode;
};

export default defineConfig({
  messages: {
    en: {
      greeting: '{NAME} is {AGE, number} years old',
      //          ^^^^ 🟡 Upper case argument names
    },
  },
  postprocessors: [renameArguments],
});
```

The compiled `greeting` message function would have the following signature:

```ts
function greeting(locale: string): MessageNode<{ name: unknown; age: number }> | null;
//                                               ^^^^ 🟡 Lower case argument names
```

## `renameMessage​Function`

**Default:** `messageKey => messageKey`

Returns the name of the message function for the given message key.

```ts
export default defineConfig({
  messages: {
    en: {
      greeting: 'Hello',
    },
  },
  renameMessageFunction: messageKey => 'Bazinga_' + messageKey,
});
```

Import the message function with the altered name:

```ts
import { renderToString } from 'mfml';
import { Bazinga_greeting } from '@mfml/messages';

renderToString({
  locale: 'en',
  message: Bazinga_greeting,
});
// ⮕ 'Hello'
```

Message function names are always escaped; illegal characters are replaced with underscores.

Compilation fails if the same function name is generated for different message keys.

## `decodeText`

**Default:** [`decodeXML`](https://github.com/smikhalevski/speedy-entities#decode)

Decode the text content before it is pushed to an MFML AST node. Use this method to decode HTML entities.

By default, the compiler supports XML entities and numeric character references.

```json
{
  "en": {
    "hotOrCold": "hot &gt; cold &#176;"
  }
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

> [!TIP]\
> Read more about [speedy-entities](https://github.com/smikhalevski/speedy-entities#readme),
> the fastest XML/HTML entity encoder/decoder in just 13 kB gzipped.

## `getArgumentTSType`

**Default:** [`getIntlArgumentTSType`](https://smikhalevski.github.io/mfml/functions/mfml_compiler.getIntlArgumentTSType.html)

Returns the TypeScript type for a given argument.

```ts
export default defineConfig({
  messages: {
    en: {
      greeting: '{name} is {age, number} years old',
    },
  },

  getArgumentTSType(argumentNode) {
    if (argumentNode.typeNode?.value === 'number') {
      return 'number';
    }
    return 'string';
  },
});
```

This would produce a message function with the following signature:

```ts
function greeting(locale: string): MessageNode<{ name: string; age: number }> | null;
```

By
default, [`getIntlArgumentTSType`](https://smikhalevski.github.io/mfml/functions/mfml_compiler.getIntlArgumentTSType.html)
is used. It returns the TypeScript type of an argument that matches the requirements
of [`Intl`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
formats.

| Argument type   | TypeScript type                                                                    |
| :-------------- | :--------------------------------------------------------------------------------- |
| `number`        | `number \| bigint`                                                                 |
| `date`          | `number \| Date`                                                                   |
| `time`          | `number \| Date`                                                                   |
| `list`          | `string[]`                                                                         |
| `plural`        | `number`                                                                           |
| `selectOrdinal` | `number`                                                                           |
| `select`        | A union of category name literals. `string & {}` is used for the `other` category. |

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

<!-- prettier-ignore -->
```html
<h1>Hello</h1><p>Dear diary</p>
```

To partially override tokenizer options use spread:

```ts
import { defineConfig } from 'mfml/compiler';
import { htmlTokenizerOptions } from 'mfml/parser';

export default defineConfig({
  // messages: { … },
  tokenizerOptions: {
    ...htmlTokenizerOptions,
    isOctothorpeRecognized: false,
  },
});
```

Read more about tokenization in [Tokenizing messages](#tokenizing-messages) section.

# Tokenizing messages

Create a tokenizer using
[`createTokenizer`](https://smikhalevski.github.io/mfml/functions/mfml_parser.createTokenizer.html)
to read message as a sequence of tokens:

```ts
import { createTokenizer } from 'mfml/parser';

const tokenizer = createTokenizer();

tokenizer.tokenize('Hello, <b>{name}</b>!', (token, startIndex, endIndex) => {
  // Handle tokens here
});
```

The callback is called with the following arguments:

| `token`               | `startIndex` | `endIndex` | Corresponding substring |
| :-------------------- | -----------: | ---------: | :---------------------- |
| `'TEXT'`              |            0 |          7 | `'Hello, '`             |
| `'START_TAG_NAME'`    |            8 |          9 | `'b'`                   |
| `'START_TAG_CLOSING'` |            9 |         10 | `'>'`                   |
| `'ARGUMENT_NAME'`     |           11 |         15 | `'name'`                |
| `'ARGUMENT_CLOSING'`  |           15 |         16 | `'}'`                   |
| `'END_TAG_NAME'`      |           18 |         19 | `'b'`                   |
| `'TEXT'`              |           20 |         21 | `'!'`                   |

Tokens are _guaranteed_ to be returned in correct order or
a [`ParserError`](https://smikhalevski.github.io/mfml/classes/mfml_parser.ParserError.html) is
thrown. Missing tokens can be inserted to restore the correct order if needed, depending on provided tokenizer option.

Create a tokenizer with a custom set of options:

```ts
const tokenizer = createTokenizer({
  isUnbalancedStartTagsImplicitlyClosed: true,
});
```

MFML provides a preconfigured forgiving HTML tokenizer
[`htmlTokenizer`](https://smikhalevski.github.io/mfml/variables/mfml_parser.htmlTokenizer.html)
and corresponding set of options
[`htmlTokenizerOptions`](https://smikhalevski.github.io/mfml/variables/mfml_parser.htmlTokenizerOptions.html):

```ts
import { createTokenizer, htmlTokenizerOptions } from 'mfml/parser';

const tokenizer = createTokenizer(htmlTokenizerOptions);
// Same as htmlTokenizer
```

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

The list of tags which content is interpreted as plain text. Tags inside raw text tag are treated as plain text.

```ts
createTokenizer({
  rawTextTags: ['script', 'style', 'plaintext'],
});
```

See [HTML5 Raw Text Elements](https://www.w3.org/TR/2010/WD-html5-20101019/syntax.html#raw-text-elements) for more info.

## `implicitlyClosedTags`

**Default:** `{}`

The map from a tag to a list of tags that must be closed if it is opened.

For example, in HTML `p` and `h1` tags have the following semantics:

<!-- prettier-ignore -->
```html
<p><h1></h1> ⮕ <p></p><h1></h1>
                   ^^^
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

Use in conjunctions with [`isUnbalancedStartTags​ImplicitlyClosed`](#isunbalancedstarttagsimplicitlyclosed).

## `implicitlyOpenedTags`

**Default:** `[]`

The list of tags for which a start tag is inserted if an unbalanced end tag is met. Otherwise,
a [`ParserError`](https://smikhalevski.github.io/mfml/classes/mfml_parser.ParserError.html) is
thrown.

You can ignore unbalanced end tags with [`isUnbalancedEndTagsIgnored`](#isunbalancedendtagsignored).

For example, in HTML `p` tag follow this semantics:

```html
</p>  ⮕ <p></p>
            ^^^
```

To achieve this behavior, set this option to:

```ts
createTokenizer({
  implicitlyOpenedTags: ['p'],
});
```

## `isCaseInsensitive​Tags`

**Default:** `false`

If `true` then [A-Z] characters are case-insensitive in tag names.

<!-- prettier-ignore -->
```html
<em></EM> ⮕ <em></em>
                  ^^^
```

## `isSelfClosingTags​Recognized`

**Default:** `false`

If `true` then self-closing tags are recognized, otherwise they are treated as start tags.

<!-- prettier-ignore -->
```html
<link />
      ^
```

## `isUnbalancedStart​Tags​Implicitly​Closed`

**Default:** `false`

If `true` then unbalanced start tags are forcefully closed. Otherwise,
a [`ParserError`](https://smikhalevski.github.io/mfml/classes/mfml_parser.ParserError.html) is
thrown.

```html
<a><b></a> ⮕ <a><b></b></a>
                    ^^^
```

Use in conjunctions with [`isUnbalancedEndTagsIgnored`](#isunbalancedendtagsignored).

## `isUnbalancedEndTags​Ignored`

**Default:** `false`

If `true` then end tags that don't have a corresponding start tag are ignored. Otherwise,
a [`ParserError`](https://smikhalevski.github.io/mfml/classes/mfml_parser.ParserError.html) is
thrown.

```html
<a></b></a> ⮕ <a></a>
    ^^^
```

Use in conjunctions with [`isUnbalancedStartTagsImplicitlyClosed`](#isunbalancedstarttagsimplicitlyclosed).

## `isRawText​Interpolated`

**Default:** `false`

If `true` then arguments are parsed inside [`rawTextTags`](#rawtexttags).

Here's how to add a raw text tag:

```ts
createTokenizer({
  rawTextTags: ['plaintext'],
  isRawTextInterpolated: true,
});
```

An argument inside the `<plaintext>` tag is interpolated:

<!-- prettier-ignore -->
```html
<plaintext>{name}</plaintext>
           ^^^^^^
```

## `isOctothorpe​Recognized`

**Default:** `false`

If `true` then an octothorpe character `#` inside an argument category is replaced with the argument value.

```
{gender, select, male { He is a # } female { She is a # }}
                                                      ^
```

# Parsing messages

Create a parser using
[`createParser`](https://smikhalevski.github.io/mfml/functions/mfml_parser.createParser.html):

```ts
import { createParser, htmlTokenizer } from 'mfml/parser';

const parser = createParser({ tokenizer: htmlTokenizer });
```

Parser converts a message text into an AST by consuming tokens produced by a tokenizer. Read more about message
tokenization in [Tokenizing messages](#tokenizing-messages) section.

Parse a message as an AST:

```ts
const messageNode = parser.parse('en', 'Hello, <b>{name}</b>!');
```

This returns a [`MessageNode`](https://smikhalevski.github.io/mfml/interfaces/mfml.MessageNode.html)
instance that looks like this:

<!-- prettier-ignore -->
```json5
{
  nodeType: 'message',
  parentNode: null,
  locale: 'en',
  childNodes: [
    {
      nodeType: 'text',
      parentNode: { /* Cyclic reference to the message node */ },
      value: 'Hello, ',
      startIndex: 0,
      endIndex: 7,
    },
    {
      nodeType: 'element',
      parentNode: { /* Cyclic reference to the message node */ },
      tagName: 'b',
      attributeNodes: null,
      childNodes: [
        {
          nodeType: 'argument',
          parentNode: { /* Cyclic reference to the element node */ },
          name: 'name',
          typeNode: null,
          styleNode: null,
          optionNodes: null,
          categoryNodes: null,
          startIndex: 11,
          endIndex: 15,
        },
      ],
      startIndex: 8,
      endIndex: 9,
    },
    {
      nodeType: 'text',
      parentNode: { /* Cyclic reference to the message node */ },
      value: '!',
      startIndex: 20,
      endIndex: 21,
    },
  ],
}
```

MFML AST can be analyzed at runtime and rendered in any way you want. In [Quick start](#quick-start) section we showed
how messages can be compiled into message functions. A message function returns an AST that describes a message:

```ts
import { greeting } from '@mfml/messages';

const messageNode = greeting('en-US');
```

Use [`walkNode`](https://smikhalevski.github.io/mfml/functions/mfml.walkNode.html) to traverse AST:

```ts
import { walkNode } from 'mfml';

walkNode(messageNode, node => {
  if (node.nodeType === 'argument') {
    // Handle argument node
  }
});
```

# Motivation

The main idea is that i18n messages are part of the code, and the application's code should be split into dynamically
loaded chunks that include the required translations. When translations change, a new version of the application should
be released.

Splitting the app code into chunks and loading those chunks at runtime is usually handled by a bundler. Modern i18n
tools, such as `i18next`, rely on JSON files that are either baked into the application bundle or loaded asynchronously.
This approach has several downsides:

- You must split your messages into separate JSON files before bundling. Otherwise, clients will have to download all
  messages when the application starts.

- You need to load messages manually when they're required.

- Unused messages remain bundled and loaded unless you remove them manually.

- Errors, such as missing interpolation parameters or invalid parameter types, are only caught at runtime.

All of the above is highly error-prone due to human factors.

MFML compiles messages into functions that can be imported as modules in your code. This approach offers multiple
benefits:

- Message functions are bundled and loaded together with your code, so you don't need to manage translation loading
  manually.

- Message functions are tree-shakeable, ensuring that the chunks produced by the bundler contain only the translations
  actually used.

- Message functions can be type-checked at compile time. This ensures you won't forget required parameters or use
  parameters of the wrong type. If a message key changes, the modules importing the corresponding message function
  will need to be updated — otherwise, the type checker or bundler will alert you that the imported function is missing.

- Message functions use a runtime to render the message. The runtime can produce React elements, plain strings, or
  any other output format you need.

<!--/ARTICLE-->

<hr/>

<p align="center">:octocat: :heart:</p>
