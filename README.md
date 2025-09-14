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

The ICU MessageFormat + XML/HTML compiler and runtime that makes your translations tree-shakeable.

- TypeScript first.
- Integrate with any translation management system.
- Zero dependencies.

<!--/OVERVIEW-->

<br>

```sh
npm install --save-prod mfml
```

<br>

<!--/ARTICLE-->

<!--TOC-->
<!--/TOC-->

# Overview

1. Prepare translations and save in _translations.json_:

```json
{
  "en": {
    "greeting": "Hello, <b>{name}</b>!'"
  },
  "ru": {
    "greeting": "Привет, <b>{name}</b>!'"
  }
}
```

2. Compile messages to functions:

```shell
npx mfml compile translations.json --typescript
```

This command writes _translations.ts_ with following contents:

```ts
import { createMessageNode as M, createElementNode as E, createArgumentNode as A, type MessageNode } from 'mfml';

export function greeting(locale: string): MessageNode<{ name: any }> {
  if (locale === 'ru') {
    return M('ru' /*...*/);
  }
  return M('en', 'Hello, ', E('b', null, A('name')), '!');
}
```

3. Use translations in code:

```ts
import { renderText } from 'mfml';
import { greeting } from './translations.js';

renderText(greeting('en'), { arguments: { name: 'Bob' } });
```

# Integrations

Integrate translations into a React app:

```tsx
import React from 'react';
import { renderReactNode, Message, LocaleProvider } from 'mfml/react';
import { greeting } from './translations.js';

renderReactNode(greeting('en'), { arguments: { name: <MyComponent>Bob</MyComponent> } });
// or
<LocaleProvider value={'en'}>
  <Message
    message={greeting}
    arguments={{ name: <MyComponent>Bob</MyComponent> }}
  />
</LocaleProvider>;
```

# Runtime parsing

Parse a message string at runtime:

```ts
import { renderText } from 'mfml';
import { parseMessage } from 'mfml/parser';

const messageNode = parseMessage('Hello, <b>{name}</b>!');
// ⮕ { type: 'message', locale: null, children: ['Hello, ', { type: 'element', tagName: 'b', children: [{ type: 'argument', name: 'name' }] }, '!'] };

renderText(messageNode, { arguments: { name: 'Bob' } });
```
