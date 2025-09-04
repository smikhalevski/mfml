import { describe, expect, test } from 'vitest';
import { parseMessage } from '../../main/parser/createParser.js';
import { MessageNode } from '../../main/types.js';
import { createTokenizer } from '../../main/parser/createTokenizer.js';

describe('parseMessage', () => {
  const tokenizer = createTokenizer();

  test('parses text', () => {
    expect(parseMessage('en', 'aaa', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'text',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 0,
          endIndex: 3,
          value: 'aaa',
        },
      ],
    } satisfies MessageNode);
  });

  test('parses implicitly opened tags', () => {
    expect(
      parseMessage('en', '</aaa>bbb', { tokenizer: createTokenizer({ implicitlyOpenedTags: ['aaa'] }) })
    ).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'element',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 2,
          endIndex: 5,
          tagName: 'aaa',
          attributeNodes: null,
          childNodes: null,
        },
        {
          nodeType: 'text',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 6,
          endIndex: 9,
          value: 'bbb',
        },
      ],
    } satisfies MessageNode);
  });

  test('parses a comment', () => {
    expect(parseMessage('en', 'aaa<!--hidden-->bbb', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'text',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 0,
          endIndex: 3,
          value: 'aaa',
        },
        {
          nodeType: 'text',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 16,
          endIndex: 19,
          value: 'bbb',
        },
      ],
    } satisfies MessageNode);
  });

  test('parses an element', () => {
    expect(parseMessage('en', '<aaa>bbb</aaa>', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'element',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 1,
          endIndex: 4,
          tagName: 'aaa',
          attributeNodes: null,
          childNodes: [
            {
              nodeType: 'text',
              parentNode: expect.objectContaining({ nodeType: 'element' }),
              startIndex: 5,
              endIndex: 8,
              value: 'bbb',
            },
          ],
        },
      ],
    } satisfies MessageNode);
  });

  test('parses leading and trailing text', () => {
    expect(parseMessage('en', 'aaa<bbb>ccc</bbb>ddd', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'text',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 0,
          endIndex: 3,
          value: 'aaa',
        },
        {
          nodeType: 'element',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 4,
          endIndex: 7,
          tagName: 'bbb',
          attributeNodes: null,
          childNodes: [
            {
              nodeType: 'text',
              parentNode: expect.objectContaining({ nodeType: 'element' }),
              startIndex: 8,
              endIndex: 11,
              value: 'ccc',
            },
          ],
        },
        {
          nodeType: 'text',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 17,
          endIndex: 20,
          value: 'ddd',
        },
      ],
    } satisfies MessageNode);
  });

  test('parses nested elements', () => {
    expect(parseMessage('en', '<aaa>bbb<ccc>ddd</ccc>eee</aaa>', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'element',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 1,
          endIndex: 4,
          tagName: 'aaa',
          attributeNodes: null,
          childNodes: [
            {
              nodeType: 'text',
              parentNode: expect.objectContaining({ nodeType: 'element' }),
              startIndex: 5,
              endIndex: 8,
              value: 'bbb',
            },
            {
              nodeType: 'element',
              parentNode: expect.objectContaining({ nodeType: 'element' }),
              startIndex: 9,
              endIndex: 12,
              tagName: 'ccc',
              attributeNodes: null,
              childNodes: [
                {
                  nodeType: 'text',
                  parentNode: expect.objectContaining({ nodeType: 'element' }),
                  startIndex: 13,
                  endIndex: 16,
                  value: 'ddd',
                },
              ],
            },
            {
              nodeType: 'text',
              parentNode: expect.objectContaining({ nodeType: 'element' }),
              startIndex: 22,
              endIndex: 25,
              value: 'eee',
            },
          ],
        },
      ],
    } satisfies MessageNode);
  });

  test('parses an argument', () => {
    expect(parseMessage('en', '{xxx}', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'argument',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 1,
          endIndex: 4,
          name: 'xxx',
          typeNode: null,
          styleNode: null,
          optionNodes: null,
          categoryNodes: null,
        },
      ],
    } satisfies MessageNode);
  });

  test('parses an argument with a type', () => {
    expect(parseMessage('en', '{   xxx   ,   yyy   }', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'argument',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 4,
          endIndex: 7,
          name: 'xxx',
          typeNode: {
            nodeType: 'literal',
            parentNode: expect.objectContaining({ nodeType: 'argument' }),
            startIndex: 14,
            endIndex: 17,
            value: 'yyy',
          },
          styleNode: null,
          optionNodes: null,
          categoryNodes: null,
        },
      ],
    } satisfies MessageNode);
  });

  test('parses an argument with a type and a style', () => {
    expect(parseMessage('en', '{   xxx   ,   yyy   ,   zzz   }', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'argument',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 4,
          endIndex: 7,
          name: 'xxx',
          typeNode: {
            nodeType: 'literal',
            parentNode: expect.objectContaining({ nodeType: 'argument' }),
            startIndex: 14,
            endIndex: 17,
            value: 'yyy',
          },
          styleNode: {
            nodeType: 'literal',
            parentNode: expect.objectContaining({ nodeType: 'argument' }),
            startIndex: 24,
            endIndex: 27,
            value: 'zzz',
          },
          optionNodes: null,
          categoryNodes: null,
        },
      ],
    } satisfies MessageNode);
  });

  test('parses an argument with a category', () => {
    expect(parseMessage('en', '{   xxx   ,   yyy   ,   zzz   {   aaa   }   }', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'argument',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 4,
          endIndex: 7,
          name: 'xxx',
          typeNode: {
            nodeType: 'literal',
            parentNode: expect.objectContaining({ nodeType: 'argument' }),
            startIndex: 14,
            endIndex: 17,
            value: 'yyy',
          },
          styleNode: null,
          optionNodes: null,
          categoryNodes: [
            {
              nodeType: 'category',
              parentNode: expect.objectContaining({ nodeType: 'argument' }),
              startIndex: 24,
              endIndex: 27,
              name: 'zzz',
              childNodes: [
                {
                  nodeType: 'text',
                  parentNode: expect.objectContaining({ nodeType: 'category' }),
                  startIndex: 31,
                  endIndex: 40,
                  value: '   aaa   ',
                },
              ],
            },
          ],
        },
      ],
    } satisfies MessageNode);
  });

  test('parses a category with an octothorpe', () => {
    expect(parseMessage('en', '{   xxx   ,   yyy   ,   zzz   {   #   }   }', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'argument',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 4,
          endIndex: 7,
          name: 'xxx',
          typeNode: {
            nodeType: 'literal',
            parentNode: expect.objectContaining({ nodeType: 'argument' }),
            startIndex: 14,
            endIndex: 17,
            value: 'yyy',
          },
          styleNode: null,
          optionNodes: null,
          categoryNodes: [
            {
              nodeType: 'category',
              parentNode: expect.objectContaining({ nodeType: 'argument' }),
              startIndex: 24,
              endIndex: 27,
              name: 'zzz',
              childNodes: [
                {
                  nodeType: 'text',
                  parentNode: expect.objectContaining({ nodeType: 'category' }),
                  startIndex: 31,
                  endIndex: 34,
                  value: '   ',
                },
                {
                  nodeType: 'octothorpe',
                  parentNode: expect.objectContaining({ nodeType: 'category' }),
                  startIndex: 34,
                  endIndex: 35,
                },
                {
                  nodeType: 'text',
                  parentNode: expect.objectContaining({ nodeType: 'category' }),
                  startIndex: 35,
                  endIndex: 38,
                  value: '   ',
                },
              ],
            },
          ],
        },
      ],
    } satisfies MessageNode);
  });

  test('parses argument with multiple categories', () => {
    expect(parseMessage('en', '{xxx,yyy,qqq{aaa}ppp{bbb}}', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'argument',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 1,
          endIndex: 4,
          name: 'xxx',
          typeNode: {
            nodeType: 'literal',
            parentNode: expect.objectContaining({ nodeType: 'argument' }),
            startIndex: 5,
            endIndex: 8,
            value: 'yyy',
          },
          styleNode: null,
          optionNodes: null,
          categoryNodes: [
            {
              nodeType: 'category',
              parentNode: expect.objectContaining({ nodeType: 'argument' }),
              startIndex: 9,
              endIndex: 12,
              name: 'qqq',
              childNodes: [
                {
                  nodeType: 'text',
                  parentNode: expect.objectContaining({ nodeType: 'category' }),
                  startIndex: 13,
                  endIndex: 16,
                  value: 'aaa',
                },
              ],
            },
            {
              nodeType: 'category',
              parentNode: expect.objectContaining({ nodeType: 'argument' }),
              startIndex: 17,
              endIndex: 20,
              name: 'ppp',
              childNodes: [
                {
                  nodeType: 'text',
                  parentNode: expect.objectContaining({ nodeType: 'category' }),
                  startIndex: 21,
                  endIndex: 24,
                  value: 'bbb',
                },
              ],
            },
          ],
        },
      ],
    } satisfies MessageNode);
  });

  test('parses an element nested in a category', () => {
    expect(parseMessage('en', '{xxx,yyy,ppp{<aaa></aaa>bbb}}', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'argument',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 1,
          endIndex: 4,
          name: 'xxx',
          typeNode: {
            nodeType: 'literal',
            parentNode: expect.objectContaining({ nodeType: 'argument' }),
            startIndex: 5,
            endIndex: 8,
            value: 'yyy',
          },
          styleNode: null,
          optionNodes: null,
          categoryNodes: [
            {
              nodeType: 'category',
              parentNode: expect.objectContaining({ nodeType: 'argument' }),
              startIndex: 9,
              endIndex: 12,
              name: 'ppp',
              childNodes: [
                {
                  nodeType: 'element',
                  parentNode: expect.objectContaining({ nodeType: 'category' }),
                  startIndex: 14,
                  endIndex: 17,
                  tagName: 'aaa',
                  attributeNodes: null,
                  childNodes: null,
                },
                {
                  nodeType: 'text',
                  parentNode: expect.objectContaining({ nodeType: 'category' }),
                  startIndex: 24,
                  endIndex: 27,
                  value: 'bbb',
                },
              ],
            },
          ],
        },
      ],
    } satisfies MessageNode);
  });

  test('parses an argument with multiple categories mixed with elements', () => {
    expect(
      parseMessage('en', '<eee>{xxx,yyy,ppp{<fff/>bbb}qqq{<kkk>aaa</kkk>}}</eee>vvv', {
        tokenizer: createTokenizer({ isSelfClosingTagsRecognized: true }),
      })
    ).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'element',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 1,
          endIndex: 4,
          tagName: 'eee',
          attributeNodes: null,
          childNodes: [
            {
              nodeType: 'argument',
              parentNode: expect.objectContaining({ nodeType: 'element' }),
              startIndex: 6,
              endIndex: 9,
              name: 'xxx',
              typeNode: {
                nodeType: 'literal',
                parentNode: expect.objectContaining({ nodeType: 'argument' }),
                startIndex: 10,
                endIndex: 13,
                value: 'yyy',
              },
              styleNode: null,
              optionNodes: null,
              categoryNodes: [
                {
                  nodeType: 'category',
                  parentNode: expect.objectContaining({ nodeType: 'argument' }),
                  startIndex: 14,
                  endIndex: 17,
                  name: 'ppp',
                  childNodes: [
                    {
                      nodeType: 'element',
                      parentNode: expect.objectContaining({ nodeType: 'category' }),
                      startIndex: 19,
                      endIndex: 22,
                      tagName: 'fff',
                      attributeNodes: null,
                      childNodes: null,
                    },
                    {
                      nodeType: 'text',
                      parentNode: expect.objectContaining({ nodeType: 'category' }),
                      startIndex: 24,
                      endIndex: 27,
                      value: 'bbb',
                    },
                  ],
                },
                {
                  nodeType: 'category',
                  parentNode: expect.objectContaining({ nodeType: 'argument' }),
                  startIndex: 28,
                  endIndex: 31,
                  name: 'qqq',
                  childNodes: [
                    {
                      nodeType: 'element',
                      parentNode: expect.objectContaining({ nodeType: 'category' }),
                      startIndex: 33,
                      endIndex: 36,
                      tagName: 'kkk',
                      attributeNodes: null,
                      childNodes: [
                        {
                          nodeType: 'text',
                          parentNode: expect.objectContaining({ nodeType: 'element' }),
                          startIndex: 37,
                          endIndex: 40,
                          value: 'aaa',
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          nodeType: 'text',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 54,
          endIndex: 57,
          value: 'vvv',
        },
      ],
    } satisfies MessageNode);
  });

  test('parses argument options', () => {
    expect(parseMessage('en', '{xxx,yyy, aaa=vvv bbb = "ppp"}', { tokenizer })).toStrictEqual({
      nodeType: 'message',
      parentNode: null,
      locale: 'en',
      childNodes: [
        {
          nodeType: 'argument',
          parentNode: expect.objectContaining({ nodeType: 'message' }),
          startIndex: 1,
          endIndex: 4,
          name: 'xxx',
          typeNode: {
            nodeType: 'literal',
            parentNode: expect.objectContaining({ nodeType: 'argument' }),
            startIndex: 5,
            endIndex: 8,
            value: 'yyy',
          },
          styleNode: null,
          optionNodes: [
            {
              nodeType: 'option',
              parentNode: expect.objectContaining({ nodeType: 'argument' }),
              startIndex: 10,
              endIndex: 13,
              name: 'aaa',
              valueNode: {
                nodeType: 'literal',
                parentNode: expect.objectContaining({ nodeType: 'option' }),
                startIndex: 14,
                endIndex: 17,
                value: 'vvv',
              },
            },
            {
              nodeType: 'option',
              parentNode: expect.objectContaining({ nodeType: 'argument' }),
              startIndex: 18,
              endIndex: 21,
              name: 'bbb',
              valueNode: {
                nodeType: 'literal',
                parentNode: expect.objectContaining({ nodeType: 'option' }),
                startIndex: 25,
                endIndex: 28,
                value: 'ppp',
              },
            },
          ],
          categoryNodes: null,
        },
      ],
    } satisfies MessageNode);
  });
});
