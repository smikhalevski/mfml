import { describe, expect, test } from 'vitest';
import { compileMessageNode, compileModule } from '../../main/compiler/compileModule.js';
import { parseMessage } from '../../main/parser/parseMessage.js';

describe('compileMessageNode', () => {
  test('compiles text', () => {
    expect(compileMessageNode('LLL', parseMessage('ru', 'aaa'))).toBe('M(LLL,"aaa")');
    expect(compileMessageNode('LLL', parseMessage('ru', 'aaa<!--zzz-->bbb'))).toBe('M(LLL,"aaabbb")');
  });

  test('compiles elements', () => {
    expect(compileMessageNode('LLL', parseMessage('ru', '<aaa>bbb</aaa>'))).toBe('M(LLL,E("aaa",null,"bbb"))');
    expect(compileMessageNode('LLL', parseMessage('ru', '<aaa><bbb>ccc</bbb></aaa>'))).toBe(
      'M(LLL,E("aaa",null,E("bbb",null,"ccc")))'
    );
    expect(
      compileMessageNode(
        'LLL',
        parseMessage('ru', '<aaa/>', { tokenizerOptions: { isSelfClosingTagsRecognized: true } })
      )
    ).toBe('M(LLL,E("aaa"))');
    expect(compileMessageNode('LLL', parseMessage('ru', '<aaa xxx="zzz" yyy="{vvv}fff">bbb</aaa>'))).toBe(
      'M(LLL,E("aaa",{"xxx":"zzz","yyy":[A("vvv"),"fff"]},"bbb"))'
    );
  });

  test('compiles attributes', () => {
    expect(compileMessageNode('LLL', parseMessage('ru', 'aaa{xxx}bbb'))).toBe('M(LLL,"aaa",A("xxx"),"bbb")');
    expect(compileMessageNode('LLL', parseMessage('ru', 'aaa{xxx,yyy}bbb'))).toBe('M(LLL,"aaa",A("xxx","yyy"),"bbb")');
    expect(compileMessageNode('LLL', parseMessage('ru', 'aaa{xxx,yyy,zzz}bbb'))).toBe(
      'M(LLL,"aaa",A("xxx","yyy","zzz"),"bbb")'
    );
  });
});

describe('compileModule', () => {
  test('compiles messages as a typescript module', () => {
    expect(
      compileModule({
        'en-US': {
          messageCount: 'You have <b>{count, number}</b> unread messages',
          messageReceived: '{gender, select, male {He} female {She} other {They}} sent you a message',
        },
        'ru-RU': {
          messageCount: 'У вас <b>{count, number}</b> непрочитанных сообщений',
          messageReceived:
            '{gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение',
        },
      })
    ).toBe(
      `import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S,type MessageNode}from"mfml";

const LOCALE_EN_US="en-US";
const LOCALE_RU_RU="ru-RU";

export function messageCount(locale:string):MessageNode<{"count":unknown}>|null{
return locale===LOCALE_EN_US?M(LOCALE_EN_US,"You have ",E("b",null,A("count","number"))," unread messages"):locale===LOCALE_RU_RU?M(LOCALE_RU_RU,"У вас ",E("b",null,A("count","number"))," непрочитанных сообщений"):null;
}

export function messageReceived(locale:string):MessageNode<{"gender":unknown}>|null{
return locale===LOCALE_EN_US?M(LOCALE_EN_US,S("gender","select",{"male":"He","female":"She","other":"They"})," sent you a message"):locale===LOCALE_RU_RU?M(LOCALE_RU_RU,S("gender","select",{"male":"Он отправил","female":"Она отправила","other":"Они отправили"})," вам сообщение"):null;
}
`
    );
  });

  test('compiles messages as a javascript module', () => {
    expect(
      compileModule(
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
        { language: 'javascript' }
      )
    ).toBe(
      `import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";

const LOCALE_EN_US="en-US";
const LOCALE_RU_RU="ru-RU";

export function messageCount(locale){
return locale===LOCALE_EN_US?M(LOCALE_EN_US,"You have ",E("b",null,A("count","number"))," unread messages"):locale===LOCALE_RU_RU?M(LOCALE_RU_RU,"У вас ",E("b",null,A("count","number"))," непрочитанных сообщений"):null;
}

export function messageReceived(locale){
return locale===LOCALE_EN_US?M(LOCALE_EN_US,S("gender","select",{"male":"He","female":"She","other":"They"})," sent you a message"):locale===LOCALE_RU_RU?M(LOCALE_RU_RU,S("gender","select",{"male":"Он отправил","female":"Она отправила","other":"Они отправили"})," вам сообщение"):null;
}
`
    );
  });
});
