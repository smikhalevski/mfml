import { describe, expect, test } from 'vitest';
import {
  compileFiles,
  compileNode,
  compileMessageTsType,
  collectArgumentTsTypes,
  getNaturalArgumentTsType,
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

    collectArgumentTsTypes(messageNode, getNaturalArgumentTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map());
  });

  test('collects untyped argument types', () => {
    const messageNode = parseMessage('en', '{xxx}{yyy}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getNaturalArgumentTsType, argumentTsTypes);

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

    collectArgumentTsTypes(messageNode, getNaturalArgumentTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects differently typed argument types', () => {
    const messageNode = parseMessage('en', '{xxx,time}{xxx,number}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getNaturalArgumentTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date', 'number|bigint'])]]));
  });

  test('collects argument types from attributes', () => {
    const messageNode = parseMessage('en', '<a title="{xxx,time}">', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getNaturalArgumentTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects argument types from tag children', () => {
    const messageNode = parseMessage('en', '<a>{xxx,time}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getNaturalArgumentTsType, argumentTsTypes);

    expect(argumentTsTypes).toEqual(new Map([['xxx', new Set(['number|Date'])]]));
  });

  test('collects argument types from categories', () => {
    const messageNode = parseMessage('en', '{yyy,select,zzz{{xxx,time}} vvv{}}', { tokenizer: htmlTokenizer });
    const argumentTsTypes = new Map();

    collectArgumentTsTypes(messageNode, getNaturalArgumentTsType, argumentTsTypes);

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

    collectArgumentTsTypes(messageNode, getNaturalArgumentTsType, argumentTsTypes);

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
      'locales.js': 'export const LOCALE_EN_US="en-US";\nexport const LOCALE_RU_RU="ru-RU";\n',

      'ca2cdd8045d8491e.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\n' +
        'import{LOCALE_EN_US,LOCALE_RU_RU}from"./locales.js";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * messageCount\n' +
        ' * ```\n' +
        ' * **en-US**\n' +
        ' * ```html\n' +
        ' * You have <b>{count, number}</b> unread messages\n' +
        ' * ```\n' +
        ' * **ru-RU**\n' +
        ' * ```html\n' +
        ' * У вас <b>{count, number}</b> непрочитанных сообщений\n' +
        ' * ```\n' +
        ' */\n' +
        'export default function(locale){\n' +
        'return locale===LOCALE_EN_US?M(locale,"You have ",E("b",V("count","number"))," unread messages"):locale===LOCALE_RU_RU?M(locale,"У вас ",E("b",V("count","number"))," непрочитанных сообщений"):null;\n' +
        '}\n',

      '4dbd175fc1875370.js':
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\n' +
        'import{LOCALE_EN_US,LOCALE_RU_RU}from"./locales.js";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * messageReceived\n' +
        ' * ```\n' +
        ' * **en-US**\n' +
        ' * ```html\n' +
        ' * {gender, select, male {He} female {She} other {They}} sent you a message\n' +
        ' * ```\n' +
        ' * **ru-RU**\n' +
        ' * ```html\n' +
        ' * {gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение\n' +
        ' * ```\n' +
        ' */\n' +
        'export default function(locale){\n' +
        'return locale===LOCALE_EN_US?M(locale,V("gender","select",C("male","He"),C("female","She"),C("other","They"))," sent you a message"):locale===LOCALE_RU_RU?M(locale,V("gender","select",C("male","Он отправил"),C("female","Она отправила"),C("other","Они отправили"))," вам сообщение"):null;\n' +
        '}\n',

      'index.js':
        'export{default as messageCount}from"./ca2cdd8045d8491e.js";\n' +
        'export{default as messageReceived}from"./4dbd175fc1875370.js";\n',

      'index.d.ts':
        'import{MessageNode}from"mfml";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * messageCount\n' +
        ' * ```\n' +
        ' * **en-US**\n' +
        ' * ```html\n' +
        ' * You have <b>{count, number}</b> unread messages\n' +
        ' * ```\n' +
        ' * **ru-RU**\n' +
        ' * ```html\n' +
        ' * У вас <b>{count, number}</b> непрочитанных сообщений\n' +
        ' * ```\n' +
        ' */\n' +
        'export declare function messageCount(locale:string):MessageNode<{"count":number|bigint;}>|null;\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * messageReceived\n' +
        ' * ```\n' +
        ' * **en-US**\n' +
        ' * ```html\n' +
        ' * {gender, select, male {He} female {She} other {They}} sent you a message\n' +
        ' * ```\n' +
        ' * **ru-RU**\n' +
        ' * ```html\n' +
        ' * {gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение\n' +
        ' * ```\n' +
        ' */\n' +
        'export declare function messageReceived(locale:string):MessageNode<{"gender":"male"|"female"|(string&{});}>|null;\n',

      'metadata.js':
        'import{LOCALE_EN_US,LOCALE_RU_RU}from"./locales.js";\n' +
        '\n' +
        'export const supportedLocales=[LOCALE_EN_US,LOCALE_RU_RU];\n',

      'metadata.d.ts':
        'export type SupportedLocale="en-US"|"ru-RU";\n' +
        '\n' +
        'export declare const supportedLocales:readonly SupportedLocale[];\n',
    });
  });

  // test('compiles message that does not support all locales', async () => {
  //   await expect(
  //     compileFiles(
  //       {
  //         en: {
  //           aaa: 'Hello',
  //         },
  //         ru: {
  //           aaa: 'Привет',
  //           bbb: 'Пока',
  //         },
  //       },
  //       {
  //         parser: createParser({ tokenizer: htmlTokenizer }),
  //       }
  //     )
  //   ).resolves.toStrictEqual({
  //     'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',
  //
  //     'da48dd32158fb414.js':
  //       'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
  //       'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * aaa\n' +
  //       ' * ```\n' +
  //       ' * **en**\n' +
  //       ' * ```html\n' +
  //       ' * Hello\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Привет\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export default function(locale){\n' +
  //       'return locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n' +
  //       '}\n',
  //
  //     'f837c12c31f24686.js':
  //       'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
  //       'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * bbb\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Пока\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export default function(locale){\n' +
  //       'return locale===LOCALE_RU?M(locale,"Пока"):null;\n' +
  //       '}\n',
  //
  //     'index.js':
  //       'export{default as aaa}from"./da48dd32158fb414.js";\nexport{default as bbb}from"./f837c12c31f24686.js";\n',
  //
  //     'index.d.ts':
  //       'import{MessageNode}from"mfml";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * aaa\n' +
  //       ' * ```\n' +
  //       ' * **en**\n' +
  //       ' * ```html\n' +
  //       ' * Hello\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Привет\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export declare function aaa(locale:string):MessageNode|null;\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * bbb\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Пока\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export declare function bbb(locale:string):MessageNode|null;\n',
  //
  //     'metadata.d.ts':
  //       'export type SupportedLocale="en"|"ru";\n' +
  //       '\n' +
  //       'export declare const supportedLocales:readonly SupportedLocale[];\n',
  //
  //     'metadata.js':
  //       'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\nexport const supportedLocales=[LOCALE_EN,LOCALE_RU];\n',
  //   });
  // });
  //
  // test('compiles message that does not support all locales and has a fallback', async () => {
  //   await expect(
  //     compileFiles(
  //       {
  //         en: {
  //           aaa: 'Hello',
  //         },
  //         ru: {
  //           aaa: 'Привет',
  //           bbb: 'Пока',
  //         },
  //       },
  //       {
  //         parser: createParser({ tokenizer: htmlTokenizer }),
  //         fallbackLocales: {
  //           en: 'ru',
  //         },
  //       }
  //     )
  //   ).resolves.toStrictEqual({
  //     'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',
  //
  //     'da48dd32158fb414.js':
  //       'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
  //       'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * aaa\n' +
  //       ' * ```\n' +
  //       ' * **en**\n' +
  //       ' * ```html\n' +
  //       ' * Hello\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Привет\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export default function(locale){\n' +
  //       'return locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n' +
  //       '}\n',
  //
  //     'bafa422d7dced287.js':
  //       'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
  //       'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * bbb\n' +
  //       ' * ```\n' +
  //       ' * **ru** (Used as a fallback for en)\n' +
  //       ' * ```html\n' +
  //       ' * Пока\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export default function(locale){\n' +
  //       'return locale===LOCALE_RU||locale===LOCALE_EN?M(locale,"Пока"):null;\n' +
  //       '}\n',
  //
  //     'index.js':
  //       'export{default as aaa}from"./da48dd32158fb414.js";\nexport{default as bbb}from"./bafa422d7dced287.js";\n',
  //
  //     'index.d.ts':
  //       'import{MessageNode}from"mfml";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * aaa\n' +
  //       ' * ```\n' +
  //       ' * **en**\n' +
  //       ' * ```html\n' +
  //       ' * Hello\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Привет\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export declare function aaa(locale:string):MessageNode|null;\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * bbb\n' +
  //       ' * ```\n' +
  //       ' * **ru** (Used as a fallback for en)\n' +
  //       ' * ```html\n' +
  //       ' * Пока\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export declare function bbb(locale:string):MessageNode|null;\n',
  //
  //     'metadata.d.ts':
  //       'export type SupportedLocale="en"|"ru";\n' +
  //       '\n' +
  //       'export declare const supportedLocales:readonly SupportedLocale[];\n',
  //
  //     'metadata.js':
  //       'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\nexport const supportedLocales=[LOCALE_EN,LOCALE_RU];\n',
  //   });
  // });
  //
  // test('compiles message that does not support all locales and has a fallback with an infinite loop', async () => {
  //   await expect(
  //     compileFiles(
  //       {
  //         en: {
  //           aaa: 'Hello',
  //         },
  //         ru: {
  //           aaa: 'Привет',
  //           bbb: 'Пока',
  //         },
  //       },
  //       {
  //         parser: createParser({ tokenizer: htmlTokenizer }),
  //         fallbackLocales: {
  //           en: 'en',
  //         },
  //       }
  //     )
  //   ).resolves.toStrictEqual({
  //     'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',
  //
  //     'da48dd32158fb414.js':
  //       'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
  //       'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * aaa\n' +
  //       ' * ```\n' +
  //       ' * **en**\n' +
  //       ' * ```html\n' +
  //       ' * Hello\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Привет\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export default function(locale){\n' +
  //       'return locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n' +
  //       '}\n',
  //
  //     'f837c12c31f24686.js':
  //       'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
  //       'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * bbb\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Пока\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export default function(locale){\n' +
  //       'return locale===LOCALE_RU?M(locale,"Пока"):null;\n' +
  //       '}\n',
  //
  //     'index.js':
  //       'export{default as aaa}from"./da48dd32158fb414.js";\nexport{default as bbb}from"./f837c12c31f24686.js";\n',
  //
  //     'index.d.ts':
  //       'import{MessageNode}from"mfml";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * aaa\n' +
  //       ' * ```\n' +
  //       ' * **en**\n' +
  //       ' * ```html\n' +
  //       ' * Hello\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Привет\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export declare function aaa(locale:string):MessageNode|null;\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * bbb\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Пока\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export declare function bbb(locale:string):MessageNode|null;\n',
  //
  //     'metadata.d.ts':
  //       'export type SupportedLocale="en"|"ru";\n' +
  //       '\n' +
  //       'export declare const supportedLocales:readonly SupportedLocale[];\n',
  //
  //     'metadata.js':
  //       'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\nexport const supportedLocales=[LOCALE_EN,LOCALE_RU];\n',
  //   });
  // });
  //
  // test('compiles message with multiple fallbacks', async () => {
  //   expect(
  //     await compileFiles(
  //       {
  //         en: {
  //           aaa: 'Hello',
  //         },
  //         ru: {
  //           aaa: 'Привет',
  //           bbb: 'Пока',
  //         },
  //         es: {
  //           aaa: 'Hola',
  //         },
  //       },
  //       {
  //         parser: createParser({ tokenizer: htmlTokenizer }),
  //         fallbackLocales: {
  //           en: 'es',
  //           es: 'ru',
  //         },
  //       }
  //     )
  //   ).toStrictEqual({
  //     'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\nexport const LOCALE_ES="es";\n',
  //
  //     'ae90451fba08dbc3.js':
  //       'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
  //       'import{LOCALE_EN,LOCALE_RU,LOCALE_ES}from"./locales.js";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * aaa\n' +
  //       ' * ```\n' +
  //       ' * **en**\n' +
  //       ' * ```html\n' +
  //       ' * Hello\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Привет\n' +
  //       ' * ```\n' +
  //       ' * **es**\n' +
  //       ' * ```html\n' +
  //       ' * Hola\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export default function(locale){\n' +
  //       'return locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):locale===LOCALE_ES?M(locale,"Hola"):null;\n' +
  //       '}\n',
  //
  //     'a7d0fe00636e93cc.js':
  //       'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
  //       'import{LOCALE_EN,LOCALE_RU,LOCALE_ES}from"./locales.js";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * bbb\n' +
  //       ' * ```\n' +
  //       ' * **ru** (Used as a fallback for en, es)\n' +
  //       ' * ```html\n' +
  //       ' * Пока\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export default function(locale){\n' +
  //       'return locale===LOCALE_RU||locale===LOCALE_EN||locale===LOCALE_ES?M(locale,"Пока"):null;\n' +
  //       '}\n',
  //
  //     'index.js':
  //       'export{default as aaa}from"./ae90451fba08dbc3.js";\nexport{default as bbb}from"./a7d0fe00636e93cc.js";\n',
  //
  //     'index.d.ts':
  //       'import{MessageNode}from"mfml";\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * aaa\n' +
  //       ' * ```\n' +
  //       ' * **en**\n' +
  //       ' * ```html\n' +
  //       ' * Hello\n' +
  //       ' * ```\n' +
  //       ' * **ru**\n' +
  //       ' * ```html\n' +
  //       ' * Привет\n' +
  //       ' * ```\n' +
  //       ' * **es**\n' +
  //       ' * ```html\n' +
  //       ' * Hola\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export declare function aaa(locale:string):MessageNode|null;\n' +
  //       '\n' +
  //       '/**\n' +
  //       ' * **Message key**\n' +
  //       ' * ```text\n' +
  //       ' * bbb\n' +
  //       ' * ```\n' +
  //       ' * **ru** (Used as a fallback for en, es)\n' +
  //       ' * ```html\n' +
  //       ' * Пока\n' +
  //       ' * ```\n' +
  //       ' */\n' +
  //       'export declare function bbb(locale:string):MessageNode|null;\n',
  //
  //     'metadata.d.ts':
  //       'export type SupportedLocale="en"|"ru"|"es";\n' +
  //       '\n' +
  //       'export declare const supportedLocales:readonly SupportedLocale[];\n',
  //
  //     'metadata.js':
  //       'import{LOCALE_EN,LOCALE_RU,LOCALE_ES}from"./locales.js";\n' +
  //       '\n' +
  //       'export const supportedLocales=[LOCALE_EN,LOCALE_RU,LOCALE_ES];\n',
  //   });
  // });
});
