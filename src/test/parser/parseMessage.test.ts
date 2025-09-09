import { expect, test } from 'vitest';
import { parseMessage } from '../../main/parser/index.js';
import { MessageNode } from '../../main/ast.js';

test('parses text', () => {
  expect(parseMessage('en', 'aaa')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: 'aaa',
  } satisfies MessageNode);
});

test('concatenates text nodes', () => {
  expect(parseMessage('en', 'aaa<!--hidden-->bbb')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: 'aaabbb',
  } satisfies MessageNode);
});

test('parses an element', () => {
  expect(parseMessage('en', '<aaa>bbb</aaa>')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'element',
        tagName: 'aaa',
        attributes: null,
        children: 'bbb',
      },
    ],
  } satisfies MessageNode);
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
        attributes: null,
        children: 'ccc',
      },
      'ddd',
    ],
  } satisfies MessageNode);
});

test('parses nested elements', () => {
  expect(parseMessage('en', '<aaa>bbb<ccc>ddd</ccc>eee</aaa>')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'element',
        tagName: 'aaa',
        attributes: null,
        children: [
          'bbb',
          {
            nodeType: 'element',
            tagName: 'ccc',
            attributes: null,
            children: 'ddd',
          },
          'eee',
        ],
      },
    ],
  } satisfies MessageNode);
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
  } satisfies MessageNode);
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
  } satisfies MessageNode);
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
  } satisfies MessageNode);
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
        categories: {
          zzz: '   aaa   ',
        },
      },
    ],
  } satisfies MessageNode);
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
        categories: {
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
  } satisfies MessageNode);
});

test('parses select multiple categories', () => {
  expect(parseMessage('en', '{xxx,yyy,qqq{aaa}ppp{bbb}}')).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'select',
        argumentName: 'xxx',
        type: 'yyy',
        categories: {
          ppp: 'bbb',
          qqq: 'aaa',
        },
      },
    ],
  } satisfies MessageNode);
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
        categories: {
          ppp: [
            {
              nodeType: 'element',
              tagName: 'aaa',
              attributes: null,
              children: null,
            },
            'bbb',
          ],
        },
      },
    ],
  } satisfies MessageNode);
});

test('parses select multiple categories mixed with elements', () => {
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
        attributes: null,
        children: [
          {
            nodeType: 'select',
            argumentName: 'xxx',
            type: 'yyy',
            categories: {
              ppp: [
                {
                  nodeType: 'element',
                  tagName: 'fff',
                  attributes: null,
                  children: null,
                },
                'bbb',
              ],
              qqq: [
                {
                  nodeType: 'element',
                  tagName: 'kkk',
                  attributes: null,
                  children: 'aaa',
                },
              ],
            },
          },
        ],
      },
      'vvv',
    ],
  } satisfies MessageNode);
});

test('renames tags', () => {
  expect(parseMessage('en', '<aaa>bbb</aaa>', { renameTag: () => 'zzz' })).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'element',
        tagName: 'zzz',
        attributes: null,
        children: 'bbb',
      },
    ],
  } satisfies MessageNode);
});

test('renames tags', () => {
  expect(parseMessage('en', '<aaa>bbb</aaa>', { processText: () => 'zzz' })).toStrictEqual({
    nodeType: 'message',
    locale: 'en',
    children: [
      {
        nodeType: 'element',
        tagName: 'aaa',
        attributes: null,
        children: 'zzz',
      },
    ],
  } satisfies MessageNode);
});
