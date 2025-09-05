import { expect, test } from 'vitest';
import { parseMessage } from '../main/parseMessage.js';

test('parses text', () => {
  expect(parseMessage('en', 'aaa')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: ['aaa'],
  });
});

test('parses an element', () => {
  expect(parseMessage('en', '<aaa>bbb</aaa>')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'element',
        tagName: 'aaa',
        attributes: {},
        children: ['bbb'],
      },
    ],
  });
});

test('parses leading and trailing text', () => {
  expect(parseMessage('en', 'aaa<bbb>ccc</bbb>ddd')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      'aaa',
      {
        nodeType: 'element',
        tagName: 'bbb',
        attributes: {},
        children: ['ccc'],
      },
      'ddd',
    ],
  });
});

test('parses nested elements', () => {
  expect(parseMessage('en', '<aaa>bbb<ccc>ddd</ccc>eee</aaa>')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'element',
        tagName: 'aaa',
        attributes: {},
        children: [
          'bbb',
          {
            nodeType: 'element',
            tagName: 'ccc',
            attributes: {},
            children: ['ddd'],
          },
          'eee',
        ],
      },
    ],
  });
});

test('parses an argument', () => {
  expect(parseMessage('en', '{xxx}')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'argument',
        name: 'xxx',
        type: undefined,
        style: undefined,
      },
    ],
  });
});

test('parses an argument with type', () => {
  expect(parseMessage('en', '{   xxx   ,   yyy   }')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'argument',
        name: 'xxx',
        type: 'yyy',
        style: undefined,
      },
    ],
  });
});

test('parses an argument with type and style', () => {
  expect(parseMessage('en', '{   xxx   ,   yyy   ,   zzz   }')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'argument',
        name: 'xxx',
        type: 'yyy',
        style: 'zzz',
      },
    ],
  });
});

test('parses select', () => {
  expect(parseMessage('en', '{   xxx   ,   yyy   ,   zzz   {   aaa   }   }')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'select',
        argumentName: 'xxx',
        type: 'yyy',
        cases: {
          zzz: ['   aaa   '],
        },
      },
    ],
  });
});

test('parses select with octothorpe', () => {
  expect(parseMessage('en', '{   xxx   ,   yyy   ,   zzz   {   #   }   }')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'select',
        argumentName: 'xxx',
        type: 'yyy',
        cases: {
          zzz: [
            '   ',
            {
              nodeType: 'argument',
              name: 'xxx',
              type: undefined,
              style: undefined,
            },
            '   ',
          ],
        },
      },
    ],
  });
});

test('parses select multiple cases', () => {
  expect(parseMessage('en', '{xxx,yyy,qqq{aaa}ppp{bbb}}')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'select',
        argumentName: 'xxx',
        type: 'yyy',
        cases: {
          ppp: ['bbb'],
          qqq: ['aaa'],
        },
      },
    ],
  });
});

test('parses select case with an element', () => {
  expect(parseMessage('en', '{xxx,yyy,ppp{<aaa></aaa>bbb}}')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'select',
        argumentName: 'xxx',
        type: 'yyy',
        cases: {
          ppp: [
            {
              nodeType: 'element',
              tagName: 'aaa',
              attributes: {},
              children: [],
            },
            'bbb',
          ],
        },
      },
    ],
  });
});

test('parses select multiple cases mixed with elements', () => {
  expect(
    parseMessage('en', '<eee>{xxx,yyy,ppp{<fff/>bbb}qqq{<kkk>aaa</kkk>}}</eee>vvv', {
      isSelfClosingTagsRecognized: true,
    })
  ).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'element',
        tagName: 'eee',
        attributes: {},
        children: [
          {
            nodeType: 'select',
            argumentName: 'xxx',
            type: 'yyy',
            cases: {
              ppp: [
                {
                  nodeType: 'element',
                  tagName: 'fff',
                  attributes: {},
                  children: [],
                },
                'bbb',
              ],
              qqq: [
                {
                  nodeType: 'element',
                  tagName: 'kkk',
                  attributes: {},
                  children: ['aaa'],
                },
              ],
            },
          },
        ],
      },
      'vvv',
    ],
  });
});
