import { describe, expect, test } from 'vitest';
import { compileFiles, compileMessageNode } from '../../main/compiler/createCompiler.js';
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
      '134ee10d6143f77d.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\nimport{LOCALE_EN_US,LOCALE_RU_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * messageCount\n * ```\n * **en-US**\n * ```html\n * You have <b>{count, number}</b> unread messages\n * ```\n * **ru-RU**\n * ```html\n * У вас <b>{count, number}</b> непрочитанных сообщений\n * ```\n */\nexport default function(locale){\nreturn locale===LOCALE_EN_US?M(LOCALE_EN_US,"You have ",E("b",null,A("count","number"))," unread messages"):locale===LOCALE_RU_RU?M(LOCALE_RU_RU,"У вас ",E("b",null,A("count","number"))," непрочитанных сообщений"):null;\n}\n',
      '27343573573cbc00.js':
        'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\nimport{LOCALE_EN_US,LOCALE_RU_RU}from"./locales.js";\n\n/**\n * **Message key**\n * ```text\n * messageReceived\n * ```\n * **en-US**\n * ```html\n * {gender, select, male {He} female {She} other {They}} sent you a message\n * ```\n * **ru-RU**\n * ```html\n * {gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение\n * ```\n */\nexport default function(locale){\nreturn locale===LOCALE_EN_US?M(LOCALE_EN_US,S("gender","select",{"male":"He","female":"She","other":"They"})," sent you a message"):locale===LOCALE_RU_RU?M(LOCALE_RU_RU,S("gender","select",{"male":"Он отправил","female":"Она отправила","other":"Они отправили"})," вам сообщение"):null;\n}\n',
      'index.js':
        'export{default as messageCount}from"./134ee10d6143f77d.js";\nexport{default as messageReceived}from"./27343573573cbc00.js";\n',
      'index.d.ts':
        'import{MessageNode}from"mfml";\n\n/**\n * **Message key**\n * ```text\n * messageCount\n * ```\n * **en-US**\n * ```html\n * You have <b>{count, number}</b> unread messages\n * ```\n * **ru-RU**\n * ```html\n * У вас <b>{count, number}</b> непрочитанных сообщений\n * ```\n */\nexport declare function messageCount(locale:string):MessageNode<{"count":unknown}>|null;\n\n/**\n * **Message key**\n * ```text\n * messageReceived\n * ```\n * **en-US**\n * ```html\n * {gender, select, male {He} female {She} other {They}} sent you a message\n * ```\n * **ru-RU**\n * ```html\n * {gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение\n * ```\n */\nexport declare function messageReceived(locale:string):MessageNode<{"gender":unknown}>|null;\n',
    });
  });
});
