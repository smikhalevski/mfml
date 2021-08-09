# mfml

The ICU MessageFormat + XML/HTML compiler and runtime that make your translations tree-shakeable.

# Motivation

Splitting the app code into chunks and loading those chunks at runtime is usually handled by a bundler. Modern i18n
tools, such as `i18next`, rely on JSON files that are baked into an application bundle or loaded asynchronously. This
approach has several downsides:

- You have to somehow split your translations into separate JSON files before bundling;
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

MFML supports ICU MessageFormat and XML/HTML markup. The compiler is highly customizable, and the runtime
is [just 1.5 KB gzipped](https://bundlephobia.com/result?p=mfml-runtime).

# Usage example

Install compiler, CLI utility and runtime libraries.

```shell
npm install --save-dev mfml-compiler mfml-cli 

npm install --save-prod mfml-runtime 
```

Create files that hold your translations. File names must be locale names. By default, locales are matched
using [`locale-matcher`](https://github.com/smikhalevski/locale-matcher), so `en-US`, `en_us`, `en`, and
even `EN+us.UTF8` are all valid locale names.

```json5
// ./translations/en-US.json

{
  "hello": "Hello, <strong>{name}</strong>"
}
```

```json5
// ./translations/ru-RU.json

{
  "hello": "Привет, <strong>{name}</strong>"
}
```

Compile these files with `mfmlc` to TypeScript. Remove `--ts` flag to disable typings.

```shell
mfmlc --include './translations/*.json' --outDir './gen' --ts;
```

This command would output `./gen/messages.ts` file with message functions and corresponding TypeScript interfaces.

<details>
<summary>The content of <code>./gen/messages.json</code></summary>
<p>

```ts
import {MessageFunction} from 'mfml-runtime';

const b = 'en-US';
const d = [b, 'ru-RU'];

export interface Hello {
  name: unknown;
}

let hello: MessageFunction<Hello> = (runtime, locale, values) => {
  const {f, e, a, l} = runtime;
  const {name: g} = values;
  return l(locale, d) === 1
      ? f('Привет, ', e('strong', null, a(locale, g)))
      : f('Hello, ', e('strong', null, a(b, g)));
};

export {hello};
```

</p>
</details>

Import compiled message functions in your code.

```ts
import * as Messages from './gen/messages';
import {createStringRuntime} from 'mfml-runtime';

const stringRuntime = createStringRuntime();

Messages.hello(stringRuntime, 'en-US', {name: 'Karen'}) // → "Hello, Karen!"
```

Have a look at https://github.com/smikhalevski/mfml/tree/master/examples for real-world use-cases implementation.

# Configuration

Configurations have the following priorities from highest to lowest:

- CLI parameters;
- Options from `mfml.config.js` or other configuration file provided through `--config` CLI parameter;
- Options from presets.

## CLI parameters

##### `-h`/`--help`

Print the help document.

##### `-V`/`--version`

Print the installed version number.

##### `-c <file>`, `--config <file>`

The config path. By default, compiler looks up for a `mfml.config.js` in the current directory.

##### `-i <pattern>`, `--include <pattern>`

The pattern of file paths that must be included in the compilation. This option is required and must present either
among CLI options or in the configuration file.

##### `-o <dir>`, `--outDir <dir>`

The output folder for all emitted files. This option is required and must present either among CLI options or in the
configuration file.

##### `-d <dir>`, `--rootDir <dir>`

The root folder from which included file paths are resolved.

##### `-p <preset>`, `--preset <preset>`

The path of a configuration preset.

##### `-a <adapter>`, `--adapter <adapter>`

The path to a compilation adapter.

##### `-l <locale>`, `--defaultLocale <locale>`

The default locale.

##### `-t`/`--ts`

Produce TypeScript typings for message functions.

## Presets

Preset is a configuration file that provides defaults for your configuration. There are two built-in presets: `html`
and `markdown`.

## Adapters

An adapter is the central part of the CLI utility. It is a function that receives a fully resolved config and compiled
files outputs files.

```ts
type Adapter<Options> = (config: IResolvedConfig & Partial<Options>) => void;
```

By default, [`localeFilesAdapter`](./packages/mfml-cli/src/main/adapters/localeFilesAdapter.ts) is used.

# React integration

# ICU considerations

By default, the parser uses the
default `DOUBLE_OPTIONAL` [apostrophe mode](http://site.icu-project.org/design/formatting/messageformat/newsyntax), in
which a single apostrophe only starts quoted literal text if it immediately precedes a curly brace `{}`, or a pound
symbol `#` if inside a plural format. A literal apostrophe `'` is represented by either a single `'` or a doubled `''`
apostrophe character.
