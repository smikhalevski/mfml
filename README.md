# typed-i18n

Code generator and runtime for type-safe i18n with ICU and XML support.

Prepare your translations in a `translations.json` file:
```json
{
  "greeting": {
    "en": "Hello, {name}!",
    "ru": "Привет, {name}!"
  }
}
```

Compile translations module source and write it to file:
```ts
import {compileModule} from '@smikhalevski/typed-i18n/lib/compiler';
import fs from 'fs';
import translations from './translations.json';

const source = compileModule({translations});

fs.writeFileSync('./messages.ts', source);
```

Use compiled module in the application source:
```ts
import {greeting} from './mesasges';
import {createRuntime} from '@smikhalevski/typed-i18n/lib/runtime';

const runtime = createRuntime();

console.log(greeting(runtime, 'en', {name: 'Karen'}));
// → Hello, Karen!
```
