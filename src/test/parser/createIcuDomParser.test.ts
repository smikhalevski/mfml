import {createForgivingSaxParser} from 'tag-soup';
import {IElementNode, ISelectCaseNode, Node, NodeType} from '../../main/parser/ast-types';
import {createIcuDomParser} from '../../main/parser/createIcuDomParser';

describe('createIcuDomParser', () => {

  const parse = createIcuDomParser();

  test('parses text', () => {
    expect(parse('aaa')).toEqual<Node>({
      nodeType: NodeType.TEXT,
      value: 'aaa',
      parent: null,
      start: 0,
      end: 3,
    });
  });

  test('parses an argument', () => {
    expect(parse('{foo}')).toEqual<Node>({
      nodeType: NodeType.ARGUMENT,
      arg: 'foo',
      parent: null,
      start: 0,
      end: 5,
    });
  });

  test('parses a function', () => {
    expect(parse('{foo,number}')).toEqual<Node>({
      nodeType: NodeType.FUNCTION,
      name: 'number',
      arg: 'foo',
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
      arg: 'foo',
      children: [],
      parent: null,
      start: 0,
      end: 10,
    };

    rootNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'YYYY-MM-DD',
      parent: rootNode,
      start: 10,
      end: 20,
    });
    expect(parse('{foo,date,YYYY-MM-DD}')).toEqual(rootNode);
  });

  test('parses a select node', () => {
    const rootNode: Node = {
      nodeType: NodeType.SELECT,
      arg: 'foo',
      pluralOffset: undefined,
      children: [],
      parent: null,
      start: 0,
      end: 14,
    };

    const aaaNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'aaa',
      children: [],
      parent: rootNode,
      start: 14,
      end: 19,
    };
    rootNode.children.push(aaaNode);

    aaaNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'AAA',
      parent: aaaNode,
      start: 19,
      end: 22,
    });

    const bbbNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'bbb',
      children: [],
      parent: rootNode,
      start: 23,
      end: 29,
    };
    rootNode.children.push(bbbNode);

    bbbNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'BBB',
      parent: bbbNode,
      start: 29,
      end: 32,
    });

    expect(parse('{foo, select, aaa {AAA} bbb {BBB} }')).toEqual(rootNode);
  });

  test('parses a plural node', () => {
    const rootNode: Node = {
      nodeType: NodeType.PLURAL,
      arg: 'foo',
      pluralOffset: undefined,
      children: [],
      parent: null,
      start: 0,
      end: 14,
    };

    const oneNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'one',
      children: [],
      parent: rootNode,
      start: 14,
      end: 19,
    };
    rootNode.children.push(oneNode);

    oneNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'aaa',
      parent: oneNode,
      start: 19,
      end: 22,
    });

    const manyNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'many',
      children: [],
      parent: rootNode,
      start: 23,
      end: 30,
    };
    rootNode.children.push(manyNode);

    manyNode.children.push(
        {
          nodeType: NodeType.OCTOTHORPE,
          parent: manyNode,
          start: 30,
          end: 31,
        },
        {
          nodeType: NodeType.TEXT,
          value: ' bbb',
          parent: manyNode,
          start: 31,
          end: 35,
        },
    );

    expect(parse('{foo, plural, one {aaa} many {# bbb} }')).toEqual(rootNode);
  });

  test('parses a container element', () => {
    expect(parse('<foo></foo>')).toEqual<Node>({
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: null,
      start: 0,
      end: 11,
    });
  });

  test('parses a self-closing element', () => {
    const parse = createIcuDomParser({
      saxParserFactory: (options) => createForgivingSaxParser({
        ...options,
        selfClosingEnabled: true,
      }),
    });

    expect(parse('<foo/>')).toEqual<Node>({
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: null,
      start: 0,
      end: 6,
    });
  });

  test('parses non-closed tag', () => {
    expect(parse('<foo>')).toEqual<Node>({
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
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
      attrs: [],
      children: [],
      parent: null,
      start: 0,
      end: 10,
    };

    rootNode.children.push({
      nodeType: NodeType.ELEMENT,
      tagName: 'bar',
      attrs: [],
      children: [],
      parent: rootNode,
      start: 5,
      end: 10,
    });

    expect(parse('<foo><bar>')).toEqual(rootNode);
  });

  test('parses implicitly closed tags', () => {
    const parse = createIcuDomParser({
      saxParserFactory: (options) => createForgivingSaxParser({
        ...options,

        isImplicitEnd(containerToken, token) {
          return containerToken.name === 'p' && token.name === 'p';
        },
      }),
    });

    const rootNode: Node = {
      nodeType: NodeType.FRAGMENT,
      children: [],
      parent: null,
      start: 0,
      end: 12,
    };

    const pNode1: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'p',
      attrs: [],
      children: [],
      parent: rootNode,
      start: 0,
      end: 6,
    };
    rootNode.children.push(pNode1);

    pNode1.children.push({
      nodeType: NodeType.TEXT,
      value: 'aaa',
      parent: pNode1,
      start: 3,
      end: 6,
    });

    const pNode2: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'p',
      attrs: [],
      children: [],
      parent: rootNode,
      start: 6,
      end: 12,
    };
    rootNode.children.push(pNode2);

    pNode2.children.push({
      nodeType: NodeType.TEXT,
      value: 'bbb',
      parent: pNode2,
      start: 9,
      end: 12,
    });

    expect(parse('<p>aaa<p>bbb')).toEqual(rootNode);
  });

  test('parses an element with an attribute', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: null,
      start: 0,
      end: 21,
    };

    const attrNode: Node = {
      nodeType: NodeType.ATTRIBUTE,
      name: 'bar',
      children: [],
      parent: rootNode,
      start: 5,
      end: 14,
    };
    rootNode.attrs.push(attrNode);
    attrNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'aaa',
      parent: attrNode,
      start: 10,
      end: 13,
    });

    expect(parse('<foo bar="aaa"></foo>')).toEqual(rootNode);
  });

  test('parses nested container elements', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: null,
      start: 0,
      end: 22,
    };
    const elementNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'bar',
      attrs: [],
      children: [],
      parent: rootNode,
      start: 5,
      end: 16,
    };
    rootNode.children.push(elementNode);

    expect(parse('<foo><bar></bar></foo>')).toEqual(rootNode);
  });

  test('parses an element that is nested in a select', () => {

    const rootNode: Node = {
      nodeType: NodeType.SELECT,
      arg: 'www',
      pluralOffset: undefined,
      children: [],
      parent: null,
      start: 0,
      end: 14,
    };

    const aaaNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'aaa',
      children: [],
      parent: rootNode,
      start: 14,
      end: 19,
    };
    rootNode.children.push(aaaNode);

    const fooNode: IElementNode = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: aaaNode,
      start: 19,
      end: 33,
    };
    aaaNode.children.push(fooNode);

    fooNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'AAA',
      parent: fooNode,
      start: 24,
      end: 27,
    });

    const bbbNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'bbb',
      children: [],
      parent: rootNode,
      start: 34,
      end: 40,
    };
    rootNode.children.push(bbbNode);

    const barNode: IElementNode = {
      nodeType: NodeType.ELEMENT,
      tagName: 'bar',
      attrs: [],
      children: [],
      parent: bbbNode,
      start: 40,
      end: 54,
    };
    bbbNode.children.push(barNode);

    barNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'BBB',
      parent: barNode,
      start: 45,
      end: 48,
    });

    expect(parse('{www, select, aaa {<foo>AAA</foo>} bbb {<bar>BBB</bar>} }')).toEqual(rootNode);
  });

  test('parses an argument surrounded by text and nested in an element', () => {
    const rootNode: Node = {
      nodeType: NodeType.FRAGMENT,
      children: [],
      parent: null,
      start: 0,
      end: 24,
    };

    rootNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'aaa',
      parent: rootNode,
      start: 0,
      end: 3,
    });

    const elementNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'b',
      attrs: [],
      children: [],
      parent: rootNode,
      start: 3,
      end: 21,
    };

    elementNode.children.push(
        {
          nodeType: NodeType.TEXT,
          value: 'bbb',
          parent: elementNode,
          start: 6,
          end: 9,
        },
        {
          nodeType: NodeType.ARGUMENT,
          arg: 'foo',
          parent: elementNode,
          start: 9,
          end: 14,
        },
        {
          nodeType: NodeType.TEXT,
          value: 'ddd',
          parent: elementNode,
          start: 14,
          end: 17,
        },
    );

    rootNode.children.push(
        elementNode,
        {
          nodeType: NodeType.TEXT,
          value: 'eee',
          parent: rootNode,
          start: 21,
          end: 24,
        },
    );

    expect(parse('aaa<b>bbb{foo}ddd</b>eee')).toEqual(rootNode);
  });

  test('parses an argument nested in an element', () => {
    const rootNode: Node = {
      nodeType: NodeType.FRAGMENT,
      children: [],
      parent: null,
      start: 0,
      end: 18,
    };

    rootNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'aaa',
      parent: rootNode,
      start: 0,
      end: 3,
    });

    const elementNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'b',
      attrs: [],
      children: [],
      parent: rootNode,
      start: 3,
      end: 15,
    };

    elementNode.children.push(
        {
          nodeType: NodeType.ARGUMENT,
          arg: 'foo',
          parent: elementNode,
          start: 6,
          end: 11,
        },
    );

    rootNode.children.push(
        elementNode,
        {
          nodeType: NodeType.TEXT,
          value: 'bbb',
          parent: rootNode,
          start: 15,
          end: 18,
        },
    );

    expect(parse('aaa<b>{foo}</b>bbb')).toEqual(rootNode);
  });

  test('parses an argument surrounded by text nested in an attribute', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: null,
      start: 0,
      end: 29,
    };

    const attrNode: Node = {
      nodeType: NodeType.ATTRIBUTE,
      name: 'bar',
      children: [],
      parent: rootNode,
      start: 5,
      end: 22,
    };
    rootNode.attrs.push(attrNode);
    attrNode.children.push(
        {
          nodeType: NodeType.TEXT,
          value: 'aaa',
          parent: attrNode,
          start: 10,
          end: 13,
        },
        {
          nodeType: NodeType.ARGUMENT,
          arg: 'baz',
          parent: attrNode,
          start: 13,
          end: 18,
        },
        {
          nodeType: NodeType.TEXT,
          value: 'bbb',
          parent: attrNode,
          start: 18,
          end: 21,
        },
    );

    expect(parse('<foo bar="aaa{baz}bbb"></foo>')).toEqual(rootNode);
  });

  test('parses multiple arguments nested in an attribute', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: null,
      start: 0,
      end: 34,
    };

    const attrNode: Node = {
      nodeType: NodeType.ATTRIBUTE,
      name: 'bar',
      children: [],
      parent: rootNode,
      start: 5,
      end: 27,
    };
    rootNode.attrs.push(attrNode);
    attrNode.children.push(
        {
          nodeType: NodeType.TEXT,
          value: 'aaa',
          parent: attrNode,
          start: 10,
          end: 13,
        },
        {
          nodeType: NodeType.ARGUMENT,
          arg: 'baz',
          parent: attrNode,
          start: 13,
          end: 18,
        },
        {
          nodeType: NodeType.TEXT,
          value: 'bbb',
          parent: attrNode,
          start: 18,
          end: 21,
        },
        {
          nodeType: NodeType.ARGUMENT,
          arg: 'qux',
          parent: attrNode,
          start: 21,
          end: 26,
        },
    );

    expect(parse('<foo bar="aaa{baz}bbb{qux}"></foo>')).toEqual(rootNode);
  });

  test('parses an argument nested in an attribute', () => {
    const rootNode: Node = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: null,
      start: 0,
      end: 23,
    };

    const attrNode: Node = {
      nodeType: NodeType.ATTRIBUTE,
      name: 'bar',
      children: [],
      parent: rootNode,
      start: 5,
      end: 16,
    };
    rootNode.attrs.push(attrNode);
    attrNode.children.push({
      nodeType: NodeType.ARGUMENT,
      arg: 'baz',
      parent: attrNode,
      start: 10,
      end: 15,
    });

    expect(parse('<foo bar="{baz}"></foo>')).toEqual(rootNode);
  });
});
