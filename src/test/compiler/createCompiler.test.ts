import { describe, expect, test } from 'vitest';
import {
  compileFiles,
  compileNode,
  compileMessageTsType,
  collectArgumentTsTypes,
  getArgumentIntlTsType,
} from '../../main/compiler/createCompiler.js';
import { createParser, parseMessage } from '../../main/parser/createParser.js';
import { createTokenizer, htmlTokenizer } from '../../main/parser/index.js';

describe('compileNode', () => {
  const tokenizer = createTokenizer();

  test('compiles text', () => {
    expect(compileNode(parseMessage('ru', 'aaa', { tokenizer }))).toBe('M(locale,"aaa")');
    expect(compileNode(parseMessage('ru', 'aaa<!--zzz-->bbb', { tokenizer }))).toBe('M(locale,"aaa","bbb")');
  });

  test('compiles elements', () => {
    expect(compileNode(parseMessage('ru', '<aaa>bbb</aaa>', { tokenizer }))).toBe('M(locale,E("aaa","bbb"))');
    expect(compileNode(parseMessage('ru', '<aaa><bbb>ccc</bbb></aaa>', { tokenizer }))).toBe(
      'M(locale,E("aaa",E("bbb","ccc")))'
    );
    expect(
      compileNode(parseMessage('ru', '<aaa/>', { tokenizer: createTokenizer({ isSelfClosingTagsRecognized: true }) }))
    ).toBe('M(locale,E("aaa"))');
    expect(compileNode(parseMessage('ru', '<aaa xxx="zzz" yyy="{vvv}fff">bbb</aaa>', { tokenizer }))).toBe(
      'M(locale,E("aaa",A("xxx","zzz"),A("yyy",V("vvv"),"fff"),"bbb"))'
    );
  });

  test('compiles attributes', () => {
    expect(compileNode(parseMessage('ru', 'aaa{xxx}bbb', { tokenizer }))).toBe('M(locale,"aaa",V("xxx"),"bbb")');
    expect(compileNode(parseMessage('ru', 'aaa{xxx,yyy}bbb', { tokenizer }))).toBe(
      'M(locale,"aaa",V("xxx","yyy"),"bbb")'
    );
    expect(compileNode(parseMessage('ru', 'aaa{xxx,yyy,zzz}bbb', { tokenizer }))).toBe(
      'M(locale,"aaa",V("xxx","yyy","zzz"),"bbb")'
    );
  });
});

describe('compileMessageTsType', () => {
  test('compiles message type', () => {
    expect(compileMessageTsType(new Map())).toBe('MessageNode<void>|null');
    expect(compileMessageTsType(new Map().set('xxx', new Set()))).toBe('MessageNode<{"xxx":unknown;}>|null');
    expect(compileMessageTsType(new Map().set('xxx', new Set(['string'])))).toBe('MessageNode<{"xxx":string;}>|null');
    expect(compileMessageTsType(new Map().set('xxx', new Set(['string', 'string|number'])))).toBe(
      'MessageNode<{"xxx":(string)&(string|number);}>|null'
    );
  });
});

describe('collectArgumentTsTypes', () => {
  test('empty is no arguments', () => {
    const messageNode = parseMessage('en', '', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentIntlTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map());
  });

  test('collects untyped argument types', () => {
    const messageNode = parseMessage('en', '{xxx}{yyy}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentIntlTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(
      new Map([
        ['xxx', new Set()],
        ['yyy', new Set()],
      ])
    );
  });

  test('collects typed and untyped argument types', () => {
    const messageNode = parseMessage('en', '{xxx,time}{xxx}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentIntlTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects differently typed argument types', () => {
    const messageNode = parseMessage('en', '{xxx,time}{xxx,number}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentIntlTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date', 'number|bigint'])]]));
  });

  test('collects argument types from attributes', () => {
    const messageNode = parseMessage('en', '<a title="{xxx,time}">', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentIntlTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects argument types from tag children', () => {
    const messageNode = parseMessage('en', '<a>{xxx,time}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentIntlTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects argument types from categories', () => {
    const messageNode = parseMessage('en', '{yyy,select,zzz{{xxx,time}} vvv{}}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentIntlTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(
      new Map([
        ['yyy', new Set(['"zzz"|"vvv"'])],
        ['xxx', new Set(['number|Date'])],
      ])
    );
  });

  test('collects argument types from categories and other', () => {
    const messageNode = parseMessage('en', '{yyy,select,zzz{{xxx,time}} vvv{} other{}}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getArgumentIntlTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(
      new Map([
        ['yyy', new Set(['"zzz"|"vvv"|(string&{})'])],
        ['xxx', new Set(['number|Date'])],
      ])
    );
  });
});

describe('compileFiles', () => {
  test('compiles messages as a node_module', async () => {
    expect(
      await compileFiles(
        {
          'en-US': {
            messageCount: 'You have <b>{count, number}</b> unread messages',
            messageReceived: '{gender, select, male {He} female {She} other {They}} sent you a message',
          },
          'ru-RU': {
            messageCount: 'У вас <b>{count, number}</b> непрочитанных сообщений',
            messageReceived:
              '{gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение',
          },
        },
        { parser: createParser({ tokenizer: htmlTokenizer }) }
      )
    ).toStrictEqual({
      '13a21ab9ce3494ec.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN_US,LOCALE_RU_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * messageCount\n * ```\n * **en-US**\n * ```html\n * You have <b>{count, number}</b> unread messages\n * ```\n * **ru-RU**\n * ```html\n * У вас <b>{count, number}</b> непрочитанных сообщений\n * ```\n */\nexport default function messageCount(locale){\nreturn locale===LOCALE_EN_US?M(locale,"You have ",E("b",V("count","number"))," unread messages"):locale===LOCALE_RU_RU?M(locale,"У вас ",E("b",V("count","number"))," непрочитанных сообщений"):null;\n}\n',
      'a3a36ac58fb4ed28.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN_US,LOCALE_RU_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * messageReceived\n * ```\n * **en-US**\n * ```html\n * {gender, select, male {He} female {She} other {They}} sent you a message\n * ```\n * **ru-RU**\n * ```html\n * {gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение\n * ```\n */\nexport default function messageReceived(locale){\nreturn locale===LOCALE_EN_US?M(locale,V("gender","select",C("male","He"),C("female","She"),C("other","They"))," sent you a message"):locale===LOCALE_RU_RU?M(locale,V("gender","select",C("male","Он отправил"),C("female","Она отправила"),C("other","Они отправили"))," вам сообщение"):null;\n}\n',
      'index.js':
        'export{default as messageCount}from"./13a21ab9ce3494ec.js";\nexport{default as messageReceived}from"./a3a36ac58fb4ed28.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * messageCount\n * ```\n * **en-US**\n * ```html\n * You have <b>{count, number}</b> unread messages\n * ```\n * **ru-RU**\n * ```html\n * У вас <b>{count, number}</b> непрочитанных сообщений\n * ```\n */\nexport declare function messageCount(locale:string):MessageNode<{"count":number|bigint;}>|null;\n\n/**\n * **Message key**\n * ```text\n * messageReceived\n * ```\n * **en-US**\n * ```html\n * {gender, select, male {He} female {She} other {They}} sent you a message\n * ```\n * **ru-RU**\n * ```html\n * {gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение\n * ```\n */\nexport declare function messageReceived(locale:string):MessageNode<{"gender":"male"|"female"|(string&{});}>|null;\n',
      'locales.js': 'export const LOCALE_EN_US="en-US";\nexport const LOCALE_RU_RU="ru-RU";\n',
      'metadata.js': 'export default {\n  "supportedLocales": [\n    "en-US",\n    "ru-RU"\n  ]\n};\n',
      'metadata.d.ts':
        'import{Metadata}from "mfml";\n\nexport type SupportedLocale="en-US"|"ru-RU";\n\ndeclare const metadata:Metadata;\n\nexport default metadata;\n',
    });
  });

  test('compiles message that does not support all locales', async () => {
    expect(
      await compileFiles(
        {
          en: {
            aaa: 'Hello',
          },
          ru: {
            aaa: 'Привет',
            bbb: 'Пока',
          },
        },
        {
          parser: createParser({ tokenizer: htmlTokenizer }),
        }
      )
    ).toStrictEqual({
      'e46c76abca073d4c.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport default function aaa(locale){\nreturn locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n}\n',
      'e7828a0beb5f01ff.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru**\n * ```html\n * Пока\n * ```\n */\nexport default function bbb(locale){\nreturn locale===LOCALE_RU?M(locale,"Пока"):null;\n}\n',
      'index.js':
        'export{default as aaa}from"./e46c76abca073d4c.js";\nexport{default as bbb}from"./e7828a0beb5f01ff.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport declare function aaa(locale:string):MessageNode<void>|null;\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru**\n * ```html\n * Пока\n * ```\n */\nexport declare function bbb(locale:string):MessageNode<void>|null;\n',
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',
      'metadata.js': 'export default {\n  "supportedLocales": [\n    "en",\n    "ru"\n  ]\n};\n',
      'metadata.d.ts':
        'import{Metadata}from "mfml";\n\nexport type SupportedLocale="en"|"ru";\n\ndeclare const metadata:Metadata;\n\nexport default metadata;\n',
    });
  });

  test('compiles message that does not support all locales and has a fallback', async () => {
    expect(
      await compileFiles(
        {
          en: {
            aaa: 'Hello',
          },
          ru: {
            aaa: 'Привет',
            bbb: 'Пока',
          },
        },
        {
          parser: createParser({ tokenizer: htmlTokenizer }),
          fallbackLocales: {
            en: 'ru',
          },
        }
      )
    ).toStrictEqual({
      'e46c76abca073d4c.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport default function aaa(locale){\nreturn locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n}\n',
      '806661b426cd8693.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru** ← en\n * ```html\n * Пока\n * ```\n */\nexport default function bbb(locale){\nreturn locale===LOCALE_RU||locale===LOCALE_EN?M(locale,"Пока"):null;\n}\n',
      'index.js':
        'export{default as aaa}from"./e46c76abca073d4c.js";\nexport{default as bbb}from"./806661b426cd8693.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport declare function aaa(locale:string):MessageNode<void>|null;\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru** ← en\n * ```html\n * Пока\n * ```\n */\nexport declare function bbb(locale:string):MessageNode<void>|null;\n',
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',
      'metadata.js': 'export default {\n  "supportedLocales": [\n    "en",\n    "ru"\n  ]\n};\n',
      'metadata.d.ts':
        'import{Metadata}from "mfml";\n\nexport type SupportedLocale="en"|"ru";\n\ndeclare const metadata:Metadata;\n\nexport default metadata;\n',
    });
  });

  test('compiles message that does not support all locales and has a fallback with an infinite loop', async () => {
    expect(
      await compileFiles(
        {
          en: {
            aaa: 'Hello',
          },
          ru: {
            aaa: 'Привет',
            bbb: 'Пока',
          },
        },
        {
          parser: createParser({ tokenizer: htmlTokenizer }),
          fallbackLocales: {
            en: 'en',
          },
        }
      )
    ).toStrictEqual({
      'e46c76abca073d4c.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport default function aaa(locale){\nreturn locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n}\n',
      'e7828a0beb5f01ff.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru**\n * ```html\n * Пока\n * ```\n */\nexport default function bbb(locale){\nreturn locale===LOCALE_RU?M(locale,"Пока"):null;\n}\n',
      'index.js':
        'export{default as aaa}from"./e46c76abca073d4c.js";\nexport{default as bbb}from"./e7828a0beb5f01ff.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport declare function aaa(locale:string):MessageNode<void>|null;\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru**\n * ```html\n * Пока\n * ```\n */\nexport declare function bbb(locale:string):MessageNode<void>|null;\n',
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',
      'metadata.js': 'export default {\n  "supportedLocales": [\n    "en",\n    "ru"\n  ]\n};\n',
      'metadata.d.ts':
        'import{Metadata}from "mfml";\n\nexport type SupportedLocale="en"|"ru";\n\ndeclare const metadata:Metadata;\n\nexport default metadata;\n',
    });
  });

  test('compiles message with multiple fallbacks', async () => {
    expect(
      await compileFiles(
        {
          en: {
            aaa: 'Hello',
          },
          ru: {
            aaa: 'Привет',
            bbb: 'Пока',
          },
          es: {
            aaa: 'Hola',
          },
        },
        {
          parser: createParser({ tokenizer: htmlTokenizer }),
          fallbackLocales: {
            en: 'es',
            es: 'ru',
          },
        }
      )
    ).toStrictEqual({
      '50b1b1677bcfea54.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU,LOCALE_ES}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n * **es**\n * ```html\n * Hola\n * ```\n */\nexport default function aaa(locale){\nreturn locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):locale===LOCALE_ES?M(locale,"Hola"):null;\n}\n',
      '3e1aed2ec3b5cc47.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU,LOCALE_ES}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru** ← en ← es\n * ```html\n * Пока\n * ```\n */\nexport default function bbb(locale){\nreturn locale===LOCALE_RU||locale===LOCALE_EN||locale===LOCALE_ES?M(locale,"Пока"):null;\n}\n',
      'index.js':
        'export{default as aaa}from"./50b1b1677bcfea54.js";\nexport{default as bbb}from"./3e1aed2ec3b5cc47.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n * **es**\n * ```html\n * Hola\n * ```\n */\nexport declare function aaa(locale:string):MessageNode<void>|null;\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru** ← en ← es\n * ```html\n * Пока\n * ```\n */\nexport declare function bbb(locale:string):MessageNode<void>|null;\n',
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\nexport const LOCALE_ES="es";\n',
      'metadata.js': 'export default {\n  "supportedLocales": [\n    "en",\n    "ru",\n    "es"\n  ]\n};\n',
      'metadata.d.ts':
        'import{Metadata}from "mfml";\n\nexport type SupportedLocale="en"|"ru"|"es";\n\ndeclare const metadata:Metadata;\n\nexport default metadata;\n',
    });
  });
});
