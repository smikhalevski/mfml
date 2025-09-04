import { describe, expect, test } from 'vitest';
import { compileFiles, compileMessageNode, compileMessageTsType } from '../../main/compiler/createCompiler.js';
import { createParser, parseMessage } from '../../main/parser/createParser.js';
import { createTokenizer, htmlTokenizer } from '../../main/parser/index.js';

describe('compileMessageNode', () => {
  const tokenizer = createTokenizer();

  test('compiles text', () => {
    expect(compileMessageNode('LLL', parseMessage('ru', 'aaa', { tokenizer }))).toBe('M(LLL,"aaa")');
    expect(compileMessageNode('LLL', parseMessage('ru', 'aaa<!--zzz-->bbb', { tokenizer }))).toBe('M(LLL,"aaabbb")');
  });

  test('compiles elements', () => {
    expect(compileMessageNode('LLL', parseMessage('ru', '<aaa>bbb</aaa>', { tokenizer }))).toBe(
      'M(LLL,E("aaa",null,"bbb"))'
    );
    expect(compileMessageNode('LLL', parseMessage('ru', '<aaa><bbb>ccc</bbb></aaa>', { tokenizer }))).toBe(
      'M(LLL,E("aaa",null,E("bbb",null,"ccc")))'
    );
    expect(
      compileMessageNode(
        'LLL',
        parseMessage('ru', '<aaa/>', { tokenizer: createTokenizer({ isSelfClosingTagsRecognized: true }) })
      )
    ).toBe('M(LLL,E("aaa"))');
    expect(
      compileMessageNode('LLL', parseMessage('ru', '<aaa xxx="zzz" yyy="{vvv}fff">bbb</aaa>', { tokenizer }))
    ).toBe('M(LLL,E("aaa",{"xxx":"zzz","yyy":[A("vvv"),"fff"]},"bbb"))');
  });

  test('compiles attributes', () => {
    expect(compileMessageNode('LLL', parseMessage('ru', 'aaa{xxx}bbb', { tokenizer }))).toBe(
      'M(LLL,"aaa",A("xxx"),"bbb")'
    );
    expect(compileMessageNode('LLL', parseMessage('ru', 'aaa{xxx,yyy}bbb', { tokenizer }))).toBe(
      'M(LLL,"aaa",A("xxx","yyy"),"bbb")'
    );
    expect(compileMessageNode('LLL', parseMessage('ru', 'aaa{xxx,yyy,zzz}bbb', { tokenizer }))).toBe(
      'M(LLL,"aaa",A("xxx","yyy","zzz"),"bbb")'
    );
  });
});

describe('compileMessageTsType', () => {
  test('compiles message type', () => {
    expect(compileMessageTsType(new Map())).toBe('MessageNode|null');
    expect(compileMessageTsType(new Map().set('xxx', new Set()))).toBe('MessageNode<{"xxx":unknown}>|null');
    expect(compileMessageTsType(new Map().set('xxx', new Set(['string'])))).toBe('MessageNode<{"xxx":string}>|null');
    expect(compileMessageTsType(new Map().set('xxx', new Set(['string', 'string|number'])))).toBe(
      'MessageNode<{"xxx":(string)&(string|number)}>|null'
    );
  });
});

describe('compileFiles', () => {
  test('compiles messages as a node_module', async () => {
    await expect(
      compileFiles(
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
    ).resolves.toStrictEqual({
      'locales.js': 'export const LOCALE_EN_US="en-US";\nexport const LOCALE_RU_RU="ru-RU";\n',

      '33798097687e9a5a.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
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
        'return locale===LOCALE_EN_US?M(locale,"You have ",E("b",null,A("count","number"))," unread messages"):locale===LOCALE_RU_RU?M(locale,"У вас ",E("b",null,A("count","number"))," непрочитанных сообщений"):null;\n' +
        '}\n',

      '7a5becc89388f4b3.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
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
        'return locale===LOCALE_EN_US?M(locale,S("gender","select",{"male":"He","female":"She","other":"They"})," sent you a message"):locale===LOCALE_RU_RU?M(locale,S("gender","select",{"male":"Он отправил","female":"Она отправила","other":"Они отправили"})," вам сообщение"):null;\n' +
        '}\n',

      'index.js':
        'export{default as messageCount}from"./33798097687e9a5a.js";\n' +
        'export{default as messageReceived}from"./7a5becc89388f4b3.js";\n',

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
        'export declare function messageCount(locale:string):MessageNode<{"count":number|bigint}>|null;\n' +
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
        'export declare function messageReceived(locale:string):MessageNode<{"gender":number|string}>|null;\n',

      'metadata.d.ts':
        'export type SupportedLocale="en-US"|"ru-RU";\n' +
        '\n' +
        'export declare const supportedLocales:readonly SupportedLocale[];\n',

      'metadata.js':
        'import{LOCALE_EN_US,LOCALE_RU_RU}from"./locales.js";\n' +
        '\n' +
        'export const supportedLocales=[LOCALE_EN_US,LOCALE_RU_RU];\n',
    });
  });

  test('compiles message that does not support all locales', async () => {
    await expect(
      compileFiles(
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
    ).resolves.toStrictEqual({
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',

      'da48dd32158fb414.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
        'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * aaa\n' +
        ' * ```\n' +
        ' * **en**\n' +
        ' * ```html\n' +
        ' * Hello\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Привет\n' +
        ' * ```\n' +
        ' */\n' +
        'export default function(locale){\n' +
        'return locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n' +
        '}\n',

      'f837c12c31f24686.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
        'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * bbb\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Пока\n' +
        ' * ```\n' +
        ' */\n' +
        'export default function(locale){\n' +
        'return locale===LOCALE_RU?M(locale,"Пока"):null;\n' +
        '}\n',

      'index.js':
        'export{default as aaa}from"./da48dd32158fb414.js";\nexport{default as bbb}from"./f837c12c31f24686.js";\n',

      'index.d.ts':
        'import{MessageNode}from"mfml";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * aaa\n' +
        ' * ```\n' +
        ' * **en**\n' +
        ' * ```html\n' +
        ' * Hello\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Привет\n' +
        ' * ```\n' +
        ' */\n' +
        'export declare function aaa(locale:string):MessageNode|null;\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * bbb\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Пока\n' +
        ' * ```\n' +
        ' */\n' +
        'export declare function bbb(locale:string):MessageNode|null;\n',

      'metadata.d.ts':
        'export type SupportedLocale="en"|"ru";\n' +
        '\n' +
        'export declare const supportedLocales:readonly SupportedLocale[];\n',

      'metadata.js':
        'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\nexport const supportedLocales=[LOCALE_EN,LOCALE_RU];\n',
    });
  });

  test('compiles message that does not support all locales and has a fallback', async () => {
    await expect(
      compileFiles(
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
    ).resolves.toStrictEqual({
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',

      'da48dd32158fb414.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
        'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * aaa\n' +
        ' * ```\n' +
        ' * **en**\n' +
        ' * ```html\n' +
        ' * Hello\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Привет\n' +
        ' * ```\n' +
        ' */\n' +
        'export default function(locale){\n' +
        'return locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n' +
        '}\n',

      'df80aa4728084514.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
        'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * bbb\n' +
        ' * ```\n' +
        ' * **ru**, en\n' +
        ' * ```html\n' +
        ' * Пока\n' +
        ' * ```\n' +
        ' */\n' +
        'export default function(locale){\n' +
        'return locale===LOCALE_RU||locale===LOCALE_EN?M(locale,"Пока"):null;\n' +
        '}\n',

      'index.js':
        'export{default as aaa}from"./da48dd32158fb414.js";\nexport{default as bbb}from"./df80aa4728084514.js";\n',

      'index.d.ts':
        'import{MessageNode}from"mfml";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * aaa\n' +
        ' * ```\n' +
        ' * **en**\n' +
        ' * ```html\n' +
        ' * Hello\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Привет\n' +
        ' * ```\n' +
        ' */\n' +
        'export declare function aaa(locale:string):MessageNode|null;\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * bbb\n' +
        ' * ```\n' +
        ' * **ru**, en\n' +
        ' * ```html\n' +
        ' * Пока\n' +
        ' * ```\n' +
        ' */\n' +
        'export declare function bbb(locale:string):MessageNode|null;\n',

      'metadata.d.ts':
        'export type SupportedLocale="en"|"ru";\n' +
        '\n' +
        'export declare const supportedLocales:readonly SupportedLocale[];\n',

      'metadata.js':
        'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\nexport const supportedLocales=[LOCALE_EN,LOCALE_RU];\n',
    });
  });

  test('compiles message that does not support all locales and has a fallback with an infinite loop', async () => {
    await expect(
      compileFiles(
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
    ).resolves.toStrictEqual({
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\n',

      'da48dd32158fb414.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
        'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * aaa\n' +
        ' * ```\n' +
        ' * **en**\n' +
        ' * ```html\n' +
        ' * Hello\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Привет\n' +
        ' * ```\n' +
        ' */\n' +
        'export default function(locale){\n' +
        'return locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):null;\n' +
        '}\n',

      'f837c12c31f24686.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
        'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * bbb\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Пока\n' +
        ' * ```\n' +
        ' */\n' +
        'export default function(locale){\n' +
        'return locale===LOCALE_RU?M(locale,"Пока"):null;\n' +
        '}\n',

      'index.js':
        'export{default as aaa}from"./da48dd32158fb414.js";\nexport{default as bbb}from"./f837c12c31f24686.js";\n',

      'index.d.ts':
        'import{MessageNode}from"mfml";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * aaa\n' +
        ' * ```\n' +
        ' * **en**\n' +
        ' * ```html\n' +
        ' * Hello\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Привет\n' +
        ' * ```\n' +
        ' */\n' +
        'export declare function aaa(locale:string):MessageNode|null;\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * bbb\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Пока\n' +
        ' * ```\n' +
        ' */\n' +
        'export declare function bbb(locale:string):MessageNode|null;\n',

      'metadata.d.ts':
        'export type SupportedLocale="en"|"ru";\n' +
        '\n' +
        'export declare const supportedLocales:readonly SupportedLocale[];\n',

      'metadata.js':
        'import{LOCALE_EN,LOCALE_RU}from"./locales.js";\n\nexport const supportedLocales=[LOCALE_EN,LOCALE_RU];\n',
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
      'locales.js': 'export const LOCALE_EN="en";\nexport const LOCALE_RU="ru";\nexport const LOCALE_ES="es";\n',

      'ae90451fba08dbc3.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
        'import{LOCALE_EN,LOCALE_RU,LOCALE_ES}from"./locales.js";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * aaa\n' +
        ' * ```\n' +
        ' * **en**\n' +
        ' * ```html\n' +
        ' * Hello\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Привет\n' +
        ' * ```\n' +
        ' * **es**\n' +
        ' * ```html\n' +
        ' * Hola\n' +
        ' * ```\n' +
        ' */\n' +
        'export default function(locale){\n' +
        'return locale===LOCALE_EN?M(locale,"Hello"):locale===LOCALE_RU?M(locale,"Привет"):locale===LOCALE_ES?M(locale,"Hola"):null;\n' +
        '}\n',

      '90657e4b25d1765d.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
        'import{LOCALE_EN,LOCALE_RU,LOCALE_ES}from"./locales.js";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * bbb\n' +
        ' * ```\n' +
        ' * **ru**, en, es\n' +
        ' * ```html\n' +
        ' * Пока\n' +
        ' * ```\n' +
        ' */\n' +
        'export default function(locale){\n' +
        'return locale===LOCALE_RU||locale===LOCALE_EN||locale===LOCALE_ES?M(locale,"Пока"):null;\n' +
        '}\n',

      'index.js':
        'export{default as aaa}from"./ae90451fba08dbc3.js";\nexport{default as bbb}from"./90657e4b25d1765d.js";\n',

      'index.d.ts':
        'import{MessageNode}from"mfml";\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * aaa\n' +
        ' * ```\n' +
        ' * **en**\n' +
        ' * ```html\n' +
        ' * Hello\n' +
        ' * ```\n' +
        ' * **ru**\n' +
        ' * ```html\n' +
        ' * Привет\n' +
        ' * ```\n' +
        ' * **es**\n' +
        ' * ```html\n' +
        ' * Hola\n' +
        ' * ```\n' +
        ' */\n' +
        'export declare function aaa(locale:string):MessageNode|null;\n' +
        '\n' +
        '/**\n' +
        ' * **Message key**\n' +
        ' * ```text\n' +
        ' * bbb\n' +
        ' * ```\n' +
        ' * **ru**, en, es\n' +
        ' * ```html\n' +
        ' * Пока\n' +
        ' * ```\n' +
        ' */\n' +
        'export declare function bbb(locale:string):MessageNode|null;\n',

      'metadata.d.ts':
        'export type SupportedLocale="en"|"ru"|"es";\n' +
        '\n' +
        'export declare const supportedLocales:readonly SupportedLocale[];\n',

      'metadata.js':
        'import{LOCALE_EN,LOCALE_RU,LOCALE_ES}from"./locales.js";\n' +
        '\n' +
        'export const supportedLocales=[LOCALE_EN,LOCALE_RU,LOCALE_ES];\n',
    });
  });
});
