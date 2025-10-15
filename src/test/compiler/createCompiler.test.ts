import { describe, expect, test } from 'vitest';
import {
  compileFiles,
  compileNode,
  compileMessageTSType,
  collectArgumentTSTypes,
  getIntlArgumentTSType,
  CompilerError,
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

describe('compileMessageTSType', () => {
  test('compiles message type', () => {
    expect(compileMessageTSType(new Map())).toBe('MessageNode<void>|null');
    expect(compileMessageTSType(new Map().set('xxx', new Set()))).toBe('MessageNode<{"xxx":unknown;}>|null');
    expect(compileMessageTSType(new Map().set('xxx', new Set(['string'])))).toBe('MessageNode<{"xxx":string;}>|null');
    expect(compileMessageTSType(new Map().set('xxx', new Set(['string', 'string|number'])))).toBe(
      'MessageNode<{"xxx":(string)&(string|number);}>|null'
    );
  });
});

describe('collectArgumentTSTypes', () => {
  test('empty is no arguments', () => {
    const messageNode = parseMessage('en', '', { tokenizer: htmlTokenizer });
    const argumentTSTypes = new Map();

    collectArgumentTSTypes(messageNode, getIntlArgumentTSType, argumentTSTypes);

    expect(argumentTSTypes).toEqual(new Map());
  });

  test('collects untyped argument types', () => {
    const messageNode = parseMessage('en', '{xxx}{yyy}', { tokenizer: htmlTokenizer });
    const argumentTSTypes = new Map();

    collectArgumentTSTypes(messageNode, getIntlArgumentTSType, argumentTSTypes);

    expect(argumentTSTypes).toEqual(
      new Map([
        ['xxx', new Set()],
        ['yyy', new Set()],
      ])
    );
  });

  test('collects typed and untyped argument types', () => {
    const messageNode = parseMessage('en', '{xxx,time}{xxx}', { tokenizer: htmlTokenizer });
    const argumentTSTypes = new Map();

    collectArgumentTSTypes(messageNode, getIntlArgumentTSType, argumentTSTypes);

    expect(argumentTSTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects differently typed argument types', () => {
    const messageNode = parseMessage('en', '{xxx,time}{xxx,number}', { tokenizer: htmlTokenizer });
    const argumentTSTypes = new Map();

    collectArgumentTSTypes(messageNode, getIntlArgumentTSType, argumentTSTypes);

    expect(argumentTSTypes).toEqual(new Map([['xxx', new Set(['number|Date', 'number|bigint'])]]));
  });

  test('collects argument types from attributes', () => {
    const messageNode = parseMessage('en', '<a title="{xxx,time}">', { tokenizer: htmlTokenizer });
    const argumentTSTypes = new Map();

    collectArgumentTSTypes(messageNode, getIntlArgumentTSType, argumentTSTypes);

    expect(argumentTSTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects argument types from tag children', () => {
    const messageNode = parseMessage('en', '<a>{xxx,time}', { tokenizer: htmlTokenizer });
    const argumentTSTypes = new Map();

    collectArgumentTSTypes(messageNode, getIntlArgumentTSType, argumentTSTypes);

    expect(argumentTSTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects argument types from categories', () => {
    const messageNode = parseMessage('en', '{yyy,select,zzz{{xxx,time}} vvv{}}', { tokenizer: htmlTokenizer });
    const argumentTSTypes = new Map();

    collectArgumentTSTypes(messageNode, getIntlArgumentTSType, argumentTSTypes);

    expect(argumentTSTypes).toEqual(
      new Map([
        ['yyy', new Set(['"zzz"|"vvv"'])],
        ['xxx', new Set(['number|Date'])],
      ])
    );
  });

  test('collects argument types from categories and other', () => {
    const messageNode = parseMessage('en', '{yyy,select,zzz{{xxx,time}} vvv{} other{}}', { tokenizer: htmlTokenizer });
    const argumentTSTypes = new Map();

    collectArgumentTSTypes(messageNode, getIntlArgumentTSType, argumentTSTypes);

    expect(argumentTSTypes).toEqual(
      new Map([
        ['yyy', new Set(['"zzz"|"vvv"|(string&{})'])],
        ['xxx', new Set(['number|Date'])],
      ])
    );
  });
});

describe('compileFiles', () => {
  const parser = createParser({ tokenizer: htmlTokenizer });

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
        { parser }
      )
    ).toStrictEqual({
      '43e39178.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN_US,LOCALE_RU_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * messageCount\n * ```\n * **en-US**\n * ```html\n * You have <b>{count, number}</b> unread messages\n * ```\n * **ru-RU**\n * ```html\n * У вас <b>{count, number}</b> непрочитанных сообщений\n * ```\n */\nexport default function messageCount(locale){\nreturn locale===LOCALE_EN_US?M(locale,"You have ",E("b",V("count","number"))," unread messages"):locale===LOCALE_RU_RU?M(locale,"У вас ",E("b",V("count","number"))," непрочитанных сообщений"):null;\n}\nmessageCount.h="43e39178";\n',
      '87bd85dd.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN_US,LOCALE_RU_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * messageReceived\n * ```\n * **en-US**\n * ```html\n * {gender, select, male {He} female {She} other {They}} sent you a message\n * ```\n * **ru-RU**\n * ```html\n * {gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение\n * ```\n */\nexport default function messageReceived(locale){\nreturn locale===LOCALE_EN_US?M(locale,V("gender","select",C("male","He"),C("female","She"),C("other","They"))," sent you a message"):locale===LOCALE_RU_RU?M(locale,V("gender","select",C("male","Он отправил"),C("female","Она отправила"),C("other","Они отправили"))," вам сообщение"):null;\n}\nmessageReceived.h="87bd85dd";\n',
      'index.js':
        'export{default as messageCount}from"./43e39178.js";\nexport{default as messageReceived}from"./87bd85dd.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * messageCount\n * ```\n * **en-US**\n * ```html\n * You have <b>{count, number}</b> unread messages\n * ```\n * **ru-RU**\n * ```html\n * У вас <b>{count, number}</b> непрочитанных сообщений\n * ```\n */\nexport declare function messageCount(locale:string):MessageNode<{"count":number|bigint;}>|null;\n\n/**\n * **Message key**\n * ```text\n * messageReceived\n * ```\n * **en-US**\n * ```html\n * {gender, select, male {He} female {She} other {They}} sent you a message\n * ```\n * **ru-RU**\n * ```html\n * {gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение\n * ```\n */\nexport declare function messageReceived(locale:string):MessageNode<{"gender":"male"|"female"|(string&{});}>|null;\n',
      'locales.js': 'export const LOCALE_EN_US="en-US";\nexport const LOCALE_RU_RU="ru-RU";\n',
      'metadata.js':
        'export default {\n  "packageName": "@mfml/messages",\n  "supportedLocales": [\n    "en-US",\n    "ru-RU"\n  ],\n  "messages": {\n    "43e39178": {\n      "messageKey": "messageCount",\n      "functionName": "messageCount",\n      "argumentNames": [\n        "count"\n      ],\n      "locales": [\n        "en-US",\n        "ru-RU"\n      ]\n    },\n    "87bd85dd": {\n      "messageKey": "messageReceived",\n      "functionName": "messageReceived",\n      "argumentNames": [\n        "gender"\n      ],\n      "locales": [\n        "en-US",\n        "ru-RU"\n      ]\n    }\n  }\n};\n',
      'metadata.d.ts':
        'import{PackageMetadata}from"mfml";\n\ndeclare const metadata:PackageMetadata;\n\nexport default metadata;\n',
      'package.json':
        '{\n  "name": "@mfml/messages",\n  "type": "module",\n  "main": "./index.js",\n  "types": "./index.d.ts",\n  "exports": {\n    ".": "./index.js",\n    "./metadata": "./metadata.js",\n    "./package.json": "./package.json"\n  },\n  "sideEffects": false\n}',
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
        { parser }
      )
    ).toStrictEqual({
      '7c551010.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport default function aaa(locale){\nreturn locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n}\naaa.h="7c551010";\n',
      'bf6eb534.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru**\n * ```html\n * Пока\n * ```\n */\nexport default function bbb(locale){\nreturn locale===LOCALE_RU?M(locale,"Пока"):null;\n}\nbbb.h="bf6eb534";\n',
      'index.js': 'export{default as aaa}from"./7c551010.js";\nexport{default as bbb}from"./bf6eb534.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport declare function aaa(locale:string):MessageNode<void>|null;\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru**\n * ```html\n * Пока\n * ```\n */\nexport declare function bbb(locale:string):MessageNode<void>|null;\n',
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',
      'metadata.js':
        'export default {\n  "packageName": "@mfml/messages",\n  "supportedLocales": [\n    "en",\n    "ru"\n  ],\n  "messages": {\n    "7c551010": {\n      "messageKey": "aaa",\n      "functionName": "aaa",\n      "argumentNames": [],\n      "locales": [\n        "en",\n        "ru"\n      ]\n    },\n    "bf6eb534": {\n      "messageKey": "bbb",\n      "functionName": "bbb",\n      "argumentNames": [],\n      "locales": [\n        "ru"\n      ]\n    }\n  }\n};\n',
      'metadata.d.ts':
        'import{PackageMetadata}from"mfml";\n\ndeclare const metadata:PackageMetadata;\n\nexport default metadata;\n',
      'package.json':
        '{\n  "name": "@mfml/messages",\n  "type": "module",\n  "main": "./index.js",\n  "types": "./index.d.ts",\n  "exports": {\n    ".": "./index.js",\n    "./metadata": "./metadata.js",\n    "./package.json": "./package.json"\n  },\n  "sideEffects": false\n}',
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
          parser,
          fallbackLocales: {
            en: 'ru',
          },
        }
      )
    ).toStrictEqual({
      '7c551010.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport default function aaa(locale){\nreturn locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n}\naaa.h="7c551010";\n',
      '15def7bf.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru** ← en\n * ```html\n * Пока\n * ```\n */\nexport default function bbb(locale){\nreturn locale===LOCALE_RU||locale===LOCALE_EN?M(locale,"Пока"):null;\n}\nbbb.h="15def7bf";\n',
      'index.js': 'export{default as aaa}from"./7c551010.js";\nexport{default as bbb}from"./15def7bf.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport declare function aaa(locale:string):MessageNode<void>|null;\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru** ← en\n * ```html\n * Пока\n * ```\n */\nexport declare function bbb(locale:string):MessageNode<void>|null;\n',
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',
      'metadata.js':
        'export default {\n  "packageName": "@mfml/messages",\n  "supportedLocales": [\n    "en",\n    "ru"\n  ],\n  "fallbackLocales": {\n    "en": "ru"\n  },\n  "messages": {\n    "7c551010": {\n      "messageKey": "aaa",\n      "functionName": "aaa",\n      "argumentNames": [],\n      "locales": [\n        "en",\n        "ru"\n      ]\n    },\n    "15def7bf": {\n      "messageKey": "bbb",\n      "functionName": "bbb",\n      "argumentNames": [],\n      "locales": [\n        "ru"\n      ]\n    }\n  }\n};\n',
      'metadata.d.ts':
        'import{PackageMetadata}from"mfml";\n\ndeclare const metadata:PackageMetadata;\n\nexport default metadata;\n',
      'package.json':
        '{\n  "name": "@mfml/messages",\n  "type": "module",\n  "main": "./index.js",\n  "types": "./index.d.ts",\n  "exports": {\n    ".": "./index.js",\n    "./metadata": "./metadata.js",\n    "./package.json": "./package.json"\n  },\n  "sideEffects": false\n}',
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
          parser,
          fallbackLocales: {
            en: 'en',
          },
        }
      )
    ).toStrictEqual({
      '7c551010.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport default function aaa(locale){\nreturn locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n}\naaa.h="7c551010";\n',
      'bf6eb534.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru**\n * ```html\n * Пока\n * ```\n */\nexport default function bbb(locale){\nreturn locale===LOCALE_RU?M(locale,"Пока"):null;\n}\nbbb.h="bf6eb534";\n',
      'index.js': 'export{default as aaa}from"./7c551010.js";\nexport{default as bbb}from"./bf6eb534.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n */\nexport declare function aaa(locale:string):MessageNode<void>|null;\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru**\n * ```html\n * Пока\n * ```\n */\nexport declare function bbb(locale:string):MessageNode<void>|null;\n',
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',
      'metadata.js':
        'export default {\n  "packageName": "@mfml/messages",\n  "supportedLocales": [\n    "en",\n    "ru"\n  ],\n  "fallbackLocales": {\n    "en": "en"\n  },\n  "messages": {\n    "7c551010": {\n      "messageKey": "aaa",\n      "functionName": "aaa",\n      "argumentNames": [],\n      "locales": [\n        "en",\n        "ru"\n      ]\n    },\n    "bf6eb534": {\n      "messageKey": "bbb",\n      "functionName": "bbb",\n      "argumentNames": [],\n      "locales": [\n        "ru"\n      ]\n    }\n  }\n};\n',
      'metadata.d.ts':
        'import{PackageMetadata}from"mfml";\n\ndeclare const metadata:PackageMetadata;\n\nexport default metadata;\n',
      'package.json':
        '{\n  "name": "@mfml/messages",\n  "type": "module",\n  "main": "./index.js",\n  "types": "./index.d.ts",\n  "exports": {\n    ".": "./index.js",\n    "./metadata": "./metadata.js",\n    "./package.json": "./package.json"\n  },\n  "sideEffects": false\n}',
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
          parser,
          fallbackLocales: {
            en: 'es',
            es: 'ru',
          },
        }
      )
    ).toStrictEqual({
      '63ff3c3b.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU,LOCALE_ES}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n * **es**\n * ```html\n * Hola\n * ```\n */\nexport default function aaa(locale){\nreturn locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):locale===LOCALE_ES?M(locale,"Hola"):null;\n}\naaa.h="63ff3c3b";\n',
      'c702b4c9.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\nimport{LOCALE_EN,LOCALE_RU,LOCALE_ES}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru** ← en ← es\n * ```html\n * Пока\n * ```\n */\nexport default function bbb(locale){\nreturn locale===LOCALE_RU||locale===LOCALE_EN||locale===LOCALE_ES?M(locale,"Пока"):null;\n}\nbbb.h="c702b4c9";\n',
      'index.js': 'export{default as aaa}from"./63ff3c3b.js";\nexport{default as bbb}from"./c702b4c9.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * aaa\n * ```\n * **en**\n * ```html\n * Hello\n * ```\n * **ru**\n * ```html\n * Привет\n * ```\n * **es**\n * ```html\n * Hola\n * ```\n */\nexport declare function aaa(locale:string):MessageNode<void>|null;\n\n/**\n * **Message key**\n * ```text\n * bbb\n * ```\n * **ru** ← en ← es\n * ```html\n * Пока\n * ```\n */\nexport declare function bbb(locale:string):MessageNode<void>|null;\n',
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\nexport const LOCALE_ES="es";\n',
      'metadata.js':
        'export default {\n  "packageName": "@mfml/messages",\n  "supportedLocales": [\n    "en",\n    "ru",\n    "es"\n  ],\n  "fallbackLocales": {\n    "en": "es",\n    "es": "ru"\n  },\n  "messages": {\n    "63ff3c3b": {\n      "messageKey": "aaa",\n      "functionName": "aaa",\n      "argumentNames": [],\n      "locales": [\n        "en",\n        "ru",\n        "es"\n      ]\n    },\n    "c702b4c9": {\n      "messageKey": "bbb",\n      "functionName": "bbb",\n      "argumentNames": [],\n      "locales": [\n        "ru"\n      ]\n    }\n  }\n};\n',
      'metadata.d.ts':
        'import{PackageMetadata}from"mfml";\n\ndeclare const metadata:PackageMetadata;\n\nexport default metadata;\n',
      'package.json':
        '{\n  "name": "@mfml/messages",\n  "type": "module",\n  "main": "./index.js",\n  "types": "./index.d.ts",\n  "exports": {\n    ".": "./index.js",\n    "./metadata": "./metadata.js",\n    "./package.json": "./package.json"\n  },\n  "sideEffects": false\n}',
    });
  });

  test('throws if duplicated function names', async () => {
    await expect(
      compileFiles(
        {
          en: { aaa: '', bbb: '' },
        },
        {
          parser,
          renameMessageFunction: () => 'ccc',
        }
      )
    ).rejects.toStrictEqual(
      new AggregateError([
        new CompilerError('bbb', 'en', new Error('The function name "ccc" is already used for the "aaa" message.')),
      ])
    );
  });
});
