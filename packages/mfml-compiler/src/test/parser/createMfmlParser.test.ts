import {
  ContainerNode,
  IAttributeNode,
  IElementNode,
  IFunctionNode,
  ISelectNode,
  ITextNode,
  Node,
  NodeType,
} from '../../main/parser/parser-types';
import {createMfmlParser} from '../../main/parser/createMfmlParser';

describe('createMfmlParser', () => {

  const parse = createMfmlParser();

  test('parses text', () => {
    expect(parse('aaa')).toEqual(<Node>{
      nodeType: NodeType.TEXT,
      value: 'aaa',
      parent: null,
      start: 0,
      end: 3,
    });
  });

  test('parses an argument', () => {
    expect(parse('{foo}')).toEqual(<Node>{
      nodeType: NodeType.ARGUMENT,
      name: 'foo',
      parent: null,
      start: 0,
      end: 5,
    });
  });

  test('parses a function', () => {
    expect(parse('{foo,number}')).toEqual(<Node>{
      nodeType: NodeType.FUNCTION,
      name: 'number',
      argumentName: 'foo',
      children: [],
      parent: null,
      start: 0,
      end: 12,
    });
  });

  test('parses a function with a param', () => {
    const rootNode: Node = {
      nodeType: NodeType.FUNCTION,
      name: 'date',
      argumentName: 'foo',
      children: [
        {
          nodeType: NodeType.TEXT,
          value: 'YYYY-MM-DD',
          parent: null,
          start: 10,
          end: 20,
        },
      ],
      parent: null,
      start: 0,
      end: 10,
    };

    rootNode.children[0].parent = rootNode;

    expect(parse('{foo,date,YYYY-MM-DD}')).toEqual(rootNode);
  });

  test('parses a function with an argument param', () => {
    const rootNode: Node = {
      nodeType: NodeType.FUNCTION,
      name: 'date',
      argumentName: 'foo',
      children: [
        {
          nodeType: NodeType.ARGUMENT,
          name: 'bar',
          parent: null,
          start: 10,
          end: 15,
        },
      ],
      parent: null,
      start: 0,
      end: 10,
    };

    rootNode.children[0].parent = rootNode;

    expect(parse('{foo,date,{bar}}')).toEqual(rootNode);
  });

  test('parses a select node', () => {
    const rootNode: Node = {
      nodeType: NodeType.SELECT,
      argumentName: 'foo',
      pluralOffset: undefined,
      children: [
        {
          nodeType: NodeType.SELECT_CASE,
          key: 'aaa',
          children: [
            {
              nodeType: NodeType.TEXT,
              value: 'AAA',
              parent: null,
              start: 19,
              end: 22,
            },
          ],
          parent: null,
          start: 14,
          end: 23,
        },
        {
          nodeType: NodeType.SELECT_CASE,
          key: 'bbb',
          children: [
            {
              nodeType: NodeType.TEXT,
              value: 'BBB',
              parent: null,
              start: 29,
              end: 32,
            },
          ],
          parent: null,
          start: 23,
          end: 33,
        },
      ],
      parent: null,
      start: 0,
      end: 34,
    };

    rootNode.children[0].parent = rootNode;
    rootNode.children[1].parent = rootNode;

    (rootNode.children[0] as ContainerNode).children[0].parent = rootNode.children[0] as ContainerNode;
    (rootNode.children[1] as ContainerNode).children[0].parent = rootNode.children[1] as ContainerNode;

    expect(parse('{foo, select, aaa {AAA} bbb {BBB} }')).toEqual(rootNode);
  });

  test('parses a plural node', () => {
    const rootNode: Node = {
      nodeType: NodeType.PLURAL,
      argumentName: 'foo',
      pluralOffset: undefined,
      children: [
        {
          nodeType: NodeType.SELECT_CASE,
          key: 'one',
          children: [
            {
              nodeType: NodeType.TEXT,
              value: 'aaa',
              parent: null,
              start: 19,
              end: 22,
            },
          ],
          parent: null,
          start: 14,
          end: 23,
        },
        {
          nodeType: NodeType.SELECT_CASE,
          key: 'many',
          children: [
            {
              nodeType: NodeType.OCTOTHORPE,
              parent: null,
              start: 30,
              end: 31,
            },
            {
              nodeType: NodeType.TEXT,
              value: ' bbb',
              parent: null,
              start: 31,
              end: 35,
            },
          ],
          parent: null,
          start: 23,
          end: 36,
        },
      ],
      parent: null,
      start: 0,
      end: 37,
    };

    rootNode.children[0].parent = rootNode;
    rootNode.children[1].parent = rootNode;

    (rootNode.children[0] as ContainerNode).children[0].parent = rootNode.children[0] as ContainerNode;
    (rootNode.children[1] as ContainerNode).children[0].parent = rootNode.children[1] as ContainerNode;
    (rootNode.children[1] as ContainerNode).children[1].parent = rootNode.children[1] as ContainerNode;

    expect(parse('{foo, plural, one {aaa} many {# bbb} }')).toEqual(rootNode);
  });

  test('parses a container element', () => {
    expect(parse('<foo></foo>')).toEqual(<Node>{
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attributes: [],
      children: [],
      parent: null,
      start: 0,
      end: 11,
    });
  });

  test('parses a self-closing element', () => {
    const parse = createMfmlParser({
      selfClosingEnabled: true,
    });

    expect(parse('<foo/>')).toEqual(<Node>{
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attributes: [],
      children: [],
      parent: null,
      start: 0,
      end: 6,
    });
  });

  test('parses non-closed tag', () => {
    expect(parse('<foo>')).toEqual(<Node>{
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attributes: [],
      children: [],
      parent: null,
      start: 0,
      end: 5,
    });
  });

  test('parses nested non-closed tag', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attributes: [],
      children: [
        {
          nodeType: NodeType.ELEMENT,
          tagName: 'bar',
          attributes: [],
          children: [],
          parent: null,
          start: 5,
          end: 10,
        },
      ],
      parent: null,
      start: 0,
      end: 10,
    };

    rootNode.children[0].parent = rootNode;

    expect(parse('<foo><bar>')).toEqual(rootNode);
  });

  test('parses implicitly closed tags', () => {
    const parse = createMfmlParser({
      endsAncestorAt(ancestors, token) {
        return ancestors[0].name === 'p' && token.name === 'p' ? 0 : -1;
      },
    });

    const rootNode: Node = {
      nodeType: NodeType.FRAGMENT,
      children: [
        {
          nodeType: NodeType.ELEMENT,
          tagName: 'p',
          attributes: [],
          children: [
            {
              nodeType: NodeType.TEXT,
              value: 'aaa',
              parent: null,
              start: 3,
              end: 6,
            },
          ],
          parent: null,
          start: 0,
          end: 6,
        },
        {
          nodeType: NodeType.ELEMENT,
          tagName: 'p',
          attributes: [],
          children: [
            {
              nodeType: NodeType.TEXT,
              value: 'bbb',
              parent: null,
              start: 9,
              end: 12,
            },
          ],
          parent: null,
          start: 6,
          end: 12,
        },
      ],
      parent: null,
      start: 0,
      end: 12,
    };

    rootNode.children[0].parent = rootNode;
    rootNode.children[1].parent = rootNode;

    (rootNode.children[0] as ContainerNode).children[0].parent = rootNode.children[0] as ContainerNode;
    (rootNode.children[1] as ContainerNode).children[0].parent = rootNode.children[1] as ContainerNode;

    expect(parse('<p>aaa<p>bbb')).toEqual(rootNode);
  });

  test('parses an element with an attribute', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attributes: [
        {
          nodeType: NodeType.ATTRIBUTE,
          name: 'bar',
          children: [
            {
              nodeType: NodeType.TEXT,
              value: 'aaa',
              parent: null,
              start: 10,
              end: 13,
            },
          ],
          parent: null,
          start: 5,
          end: 14,
        },
      ],
      children: [],
      parent: null,
      start: 0,
      end: 21,
    };

    rootNode.attributes[0].parent = rootNode;
    rootNode.attributes[0].children[0].parent = rootNode.attributes[0];

    expect(parse('<foo bar="aaa"></foo>')).toEqual(rootNode);
  });

  test('parses nested container elements', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attributes: [],
      children: [
        {
          nodeType: NodeType.ELEMENT,
          tagName: 'bar',
          attributes: [],
          children: [],
          parent: null,
          start: 5,
          end: 16,
        },
      ],
      parent: null,
      start: 0,
      end: 22,
    };

    rootNode.children[0].parent = rootNode;

    expect(parse('<foo><bar></bar></foo>')).toEqual(rootNode);
  });

  test('parses an element that is nested in a select', () => {

    const rootNode: Node = {
      nodeType: NodeType.SELECT,
      argumentName: 'www',
      pluralOffset: undefined,
      children: [
        {
          nodeType: NodeType.SELECT_CASE,
          key: 'aaa',
          children: [
            {
              nodeType: NodeType.ELEMENT,
              tagName: 'foo',
              attributes: [],
              children: [
                {
                  nodeType: NodeType.TEXT,
                  value: 'AAA',
                  parent: null,
                  start: 24,
                  end: 27,
                },
              ],
              parent: null,
              start: 19,
              end: 33,
            },
          ],
          parent: null,
          start: 14,
          end: 34,
        },
        {
          nodeType: NodeType.SELECT_CASE,
          key: 'bbb',
          children: [
            {
              nodeType: NodeType.ELEMENT,
              tagName: 'bar',
              attributes: [],
              children: [
                {
                  nodeType: NodeType.TEXT,
                  value: 'BBB',
                  parent: null,
                  start: 45,
                  end: 48,
                },
              ],
              parent: null,
              start: 40,
              end: 54,
            },
          ],
          parent: null,
          start: 34,
          end: 55,
        },
      ],
      parent: null,
      start: 0,
      end: 56,
    };

    rootNode.children[0].parent = rootNode;
    rootNode.children[1].parent = rootNode;

    (rootNode.children[0] as ContainerNode).children[0].parent = rootNode.children[0] as ContainerNode;
    (rootNode.children[1] as ContainerNode).children[0].parent = rootNode.children[1] as ContainerNode;

    ((rootNode.children[0] as ContainerNode).children[0] as ContainerNode).children[0].parent = (rootNode.children[0] as ContainerNode).children[0] as ContainerNode;
    ((rootNode.children[1] as ContainerNode).children[0] as ContainerNode).children[0].parent = (rootNode.children[1] as ContainerNode).children[0] as ContainerNode;

    expect(parse('{www, select, aaa {<foo>AAA</foo>} bbb {<bar>BBB</bar>} }')).toEqual(rootNode);
  });

  test('parses an argument surrounded by text and nested in an element', () => {
    const rootNode: Node = {
      nodeType: NodeType.FRAGMENT,
      children: [
        {
          nodeType: NodeType.TEXT,
          value: 'aaa',
          parent: null,
          start: 0,
          end: 3,
        },
        {
          nodeType: NodeType.ELEMENT,
          tagName: 'b',
          attributes: [],
          children: [
            {
              nodeType: NodeType.TEXT,
              value: 'bbb',
              parent: null,
              start: 6,
              end: 9,
            },
            {
              nodeType: NodeType.ARGUMENT,
              name: 'foo',
              parent: null,
              start: 9,
              end: 14,
            },
            {
              nodeType: NodeType.TEXT,
              value: 'ddd',
              parent: null,
              start: 14,
              end: 17,
            },
          ],
          parent: null,
          start: 3,
          end: 21,
        },
        {
          nodeType: NodeType.TEXT,
          value: 'eee',
          parent: null,
          start: 21,
          end: 24,
        },
      ],
      parent: null,
      start: 0,
      end: 24,
    };

    rootNode.children[0].parent = rootNode;
    rootNode.children[1].parent = rootNode;
    rootNode.children[2].parent = rootNode;

    (rootNode.children[1] as ContainerNode).children[0].parent = rootNode.children[1] as ContainerNode;
    (rootNode.children[1] as ContainerNode).children[1].parent = rootNode.children[1] as ContainerNode;
    (rootNode.children[1] as ContainerNode).children[2].parent = rootNode.children[1] as ContainerNode;

    expect(parse('aaa<b>bbb{foo}ddd</b>eee')).toEqual(rootNode);
  });

  test('parses an argument nested in an element', () => {
    const rootNode: Node = {
      nodeType: NodeType.FRAGMENT,
      children: [
        {
          nodeType: NodeType.TEXT,
          value: 'aaa',
          parent: null,
          start: 0,
          end: 3,
        },
        {
          nodeType: NodeType.ELEMENT,
          tagName: 'b',
          attributes: [],
          children: [
            {
              nodeType: NodeType.ARGUMENT,
              name: 'foo',
              parent: null,
              start: 6,
              end: 11,
            },
          ],
          parent: null,
          start: 3,
          end: 15,
        },
        {
          nodeType: NodeType.TEXT,
          value: 'bbb',
          parent: null,
          start: 15,
          end: 18,
        },
      ],
      parent: null,
      start: 0,
      end: 18,
    };

    rootNode.children[0].parent = rootNode;
    rootNode.children[1].parent = rootNode;
    rootNode.children[2].parent = rootNode;

    (rootNode.children[1] as ContainerNode).children[0].parent = rootNode.children[1] as ContainerNode;

    const qqq = parse('aaa<b>{foo}</b>bbb');

    expect(qqq).toEqual(rootNode);
  });

  test('parses an argument surrounded by text nested in an attribute', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attributes: [
        {
          nodeType: NodeType.ATTRIBUTE,
          name: 'bar',
          children: [
            {
              nodeType: NodeType.TEXT,
              value: 'aaa',
              parent: null,
              start: 10,
              end: 13,
            },
            {
              nodeType: NodeType.ARGUMENT,
              name: 'baz',
              parent: null,
              start: 13,
              end: 18,
            },
            {
              nodeType: NodeType.TEXT,
              value: 'bbb',
              parent: null,
              start: 18,
              end: 21,
            },
          ],
          parent: null,
          start: 5,
          end: 22,
        },
      ],
      children: [],
      parent: null,
      start: 0,
      end: 29,
    };

    rootNode.attributes[0].parent = rootNode;

    rootNode.attributes[0].children[0].parent = rootNode.attributes[0];
    rootNode.attributes[0].children[1].parent = rootNode.attributes[0];
    rootNode.attributes[0].children[2].parent = rootNode.attributes[0];

    expect(parse('<foo bar="aaa{baz}bbb"></foo>')).toEqual(rootNode);
  });

  test('parses multiple arguments nested in an attribute', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attributes: [
        {
          nodeType: NodeType.ATTRIBUTE,
          name: 'bar',
          children: [
            {
              nodeType: NodeType.TEXT,
              value: 'aaa',
              parent: null,
              start: 10,
              end: 13,
            },
            {
              nodeType: NodeType.ARGUMENT,
              name: 'baz',
              parent: null,
              start: 13,
              end: 18,
            },
            {
              nodeType: NodeType.TEXT,
              value: 'bbb',
              parent: null,
              start: 18,
              end: 21,
            },
            {
              nodeType: NodeType.ARGUMENT,
              name: 'qux',
              parent: null,
              start: 21,
              end: 26,
            },
          ],
          parent: null,
          start: 5,
          end: 27,
        },
      ],
      children: [],
      parent: null,
      start: 0,
      end: 34,
    };

    rootNode.attributes[0].parent = rootNode;

    rootNode.attributes[0].children[0].parent = rootNode.attributes[0];
    rootNode.attributes[0].children[1].parent = rootNode.attributes[0];
    rootNode.attributes[0].children[2].parent = rootNode.attributes[0];
    rootNode.attributes[0].children[3].parent = rootNode.attributes[0];

    expect(parse('<foo bar="aaa{baz}bbb{qux}"></foo>')).toEqual(rootNode);
  });

  test('parses an argument nested in an attribute', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attributes: [
        {
          nodeType: NodeType.ATTRIBUTE,
          name: 'bar',
          children: [
            {
              nodeType: NodeType.ARGUMENT,
              name: 'baz',
              parent: null,
              start: 10,
              end: 15,
            },
          ],
          parent: null,
          start: 5,
          end: 16,
        },
      ],
      children: [],
      parent: null,
      start: 0,
      end: 23,
    };

    rootNode.attributes[0].parent = rootNode;

    rootNode.attributes[0].children[0].parent = rootNode.attributes[0];

    expect(parse('<foo bar="{baz}"></foo>')).toEqual(rootNode);
  });

  test('parses elements in an attribute as text', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attributes: [
        {
          nodeType: NodeType.ATTRIBUTE,
          name: 'bar',
          children: [
            {
              nodeType: NodeType.SELECT,
              argumentName: 'www',
              pluralOffset: undefined,
              children: [
                {
                  nodeType: NodeType.SELECT_CASE,
                  key: 'aaa',
                  children: [
                    {
                      nodeType: NodeType.TEXT,
                      value: '<bar></bar>',
                      parent: null,
                      start: 26,
                      end: 37,
                    },
                  ],
                  parent: null,
                  start: 22,
                  end: 38,
                },
              ],
              parent: null,
              start: 10,
              end: 39,
            },
          ],
          parent: null,
          start: 5,
          end: 40,
        },
      ],
      children: [],
      parent: null,
      start: 0,
      end: 47,
    };

    rootNode.attributes[0].parent = rootNode;

    rootNode.attributes[0].children[0].parent = rootNode.attributes[0];

    (rootNode.attributes[0].children[0] as ContainerNode).children[0].parent = rootNode.attributes[0].children[0] as ContainerNode;

    ((rootNode.attributes[0].children[0] as ContainerNode).children[0] as ContainerNode).children[0].parent = (rootNode.attributes[0].children[0] as ContainerNode).children[0] as ContainerNode;

    expect(parse('<foo bar="{www,select,aaa{<bar></bar>}}"></foo>')).toEqual(rootNode);
  });

  test('throws on unexpected argument in start tag', () => {
    expect(() => parse('<foo {baz}></foo>')).toThrow(new SyntaxError('Unexpected token at 5'));
  });

  test('throws on unexpected argument in end tag', () => {
    expect(() => parse('<foo></foo {baz}>')).toThrow(new SyntaxError('Unexpected token at 5'));
  });

  test('throws on unclosed argument', () => {
    expect(() => parse('{bar')).toThrow();
  });

  test('decodes text', () => {
    const parse = createMfmlParser({
      decodeText: (str) => str.replace('aaa', 'bbb'),
    });

    const node = parse('aaa');

    expect((node as ITextNode).value).toEqual('bbb');
  });

  test('decodes a literal attribute', () => {
    const parse = createMfmlParser({
      decodeAttribute: (str) => str.replace('aaa', 'bbb'),
    });

    const node = parse('<foo bar="aaa"></foo>');

    expect(((node as IElementNode).attributes[0].children[0] as ITextNode).value).toEqual('bbb');
  });

  test('decodes an attribute with argument', () => {
    const parse = createMfmlParser({
      decodeAttribute: (str) => str.replace('aaa', 'bbb'),
    });

    const node = parse('<foo bar="aaa{bar}aaa"></foo>');

    expect(((node as IElementNode).attributes[0].children[0] as ITextNode).value).toEqual('bbb');
    expect(((node as IElementNode).attributes[0].children[2] as ITextNode).value).toEqual('bbb');
  });

  test('renames arguments', () => {
    const parse = createMfmlParser({
      renameArgument: (str) => str.toUpperCase(),
    });

    const node = parse('{foo}{bar}');

    expect(((node as ContainerNode).children[0] as IAttributeNode).name).toBe('FOO');
    expect(((node as ContainerNode).children[1] as IAttributeNode).name).toBe('BAR');
  });

  test('renames function arguments', () => {
    const parse = createMfmlParser({
      renameArgument: (str) => str.toUpperCase(),
    });

    const node = parse('{foo,okay}');

    expect((node as IFunctionNode).argumentName).toBe('FOO');
  });

  test('renames select arguments', () => {
    const parse = createMfmlParser({
      renameArgument: (str) => str.toUpperCase(),
    });

    const node = parse('{foo,select,}');

    expect((node as ISelectNode).argumentName).toBe('FOO');
  });

  test('renames function', () => {
    const parse = createMfmlParser({
      renameFunction: (str) => str.toUpperCase(),
    });

    const node = parse('{foo,eee}');

    expect((node as IFunctionNode).name).toBe('EEE');
  });
});
