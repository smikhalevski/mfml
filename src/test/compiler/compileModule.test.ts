import { describe, expect, test } from 'vitest';
import { compileMessageNode, compileModule } from '../../main/compiler/compileModule.js';
import { parseMessage } from '../../main/parser/parseMessage.js';

describe('compileMessageNode', () => {
  test('compiles text', () => {
    expect(compileMessageNode(parseMessage('ru', 'aaa'))).toBe('M("ru","aaa")');
    expect(compileMessageNode(parseMessage('ru', 'aaa<!--zzz-->bbb'))).toBe('M("ru","aaabbb")');
  });

  test('compiles elements', () => {
    expect(compileMessageNode(parseMessage('ru', '<aaa>bbb</aaa>'))).toBe('M("ru",E("aaa",null,"bbb"))');
    expect(compileMessageNode(parseMessage('ru', '<aaa><bbb>ccc</bbb></aaa>'))).toBe(
      'M("ru",E("aaa",null,E("bbb",null,"ccc")))'
    );
    expect(
      compileMessageNode(parseMessage('ru', '<aaa/>', { tokenizerOptions: { isSelfClosingTagsRecognized: true } }))
    ).toBe('M("ru",E("aaa"))');
    expect(compileMessageNode(parseMessage('ru', '<aaa xxx="zzz" yyy="{vvv}fff">bbb</aaa>'))).toBe(
      'M("ru",E("aaa",{"xxx":"zzz","yyy":[A("vvv"),"fff"]},"bbb"))'
    );
  });

  test('compiles attributes', () => {
    expect(compileMessageNode(parseMessage('ru', 'aaa{xxx}bbb'))).toBe('M("ru","aaa",A("xxx"),"bbb")');
    expect(compileMessageNode(parseMessage('ru', 'aaa{xxx,yyy}bbb'))).toBe('M("ru","aaa",A("xxx","yyy"),"bbb")');
    expect(compileMessageNode(parseMessage('ru', 'aaa{xxx,yyy,zzz}bbb'))).toBe(
      'M("ru","aaa",A("xxx","yyy","zzz"),"bbb")'
    );
  });
});

describe('compileModule', () => {
  test('compiles messages', () => {
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

export function messageCount(locale:string):MessageNode<{"count":unknown}>|null{
return locale==="en-US"?M("en-US","You have ",E("b",null,A("count","number"))," unread messages"):locale==="ru-RU"?M("ru-RU","У вас ",E("b",null,A("count","number"))," непрочитанных сообщений"):null
}

export function messageReceived(locale:string):MessageNode<{"gender":unknown}>|null{
return locale==="en-US"?M("en-US",S("gender","select",{"male":"He","female":"She","other":"They"})," sent you a message"):locale==="ru-RU"?M("ru-RU",S("gender","select",{"male":"Он отправил","female":"Она отправила","other":"Они отправили"})," вам сообщение"):null
}
`
    );
  });
});
