# icuc

The ICU + HTML compiler and runtime.

Prepare your translations in a `./translations.json` file:
```json
{
  "greeting": {
    "en": "Hello, <strong>{name}</strong>!",
    "ru": "Привет, <strong>{name}</strong>!"
  }
}
```

Compile translations module source and write it to `./messages.ts` file:
```ts
import {compileModule} from '@smikhalevski/icuc/lib/compiler';
import fs from 'fs';
import translations from './translations.json';

const source = compileModule({translations});

fs.writeFileSync('./messages.ts', source);
```

Use messages in the application source:
```ts
import {greeting} from './mesasges';
import {createRuntime} from '@smikhalevski/icuc';

const runtime = createRuntime();

console.log(greeting(runtime, 'en', {name: 'Karen'}));
// → Hello, Karen!
```
