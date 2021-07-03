import {IElementNode, ISelectCaseNode, Node, NodeType} from '../main/ast-types';
import {parseIcuTagSoup} from '../main/parseIcuTagSoup';

describe('parseMarkup', () => {

  test('parses text', () => {
    expect(parseIcuTagSoup('aaa')).toEqual<Node>({
      nodeType: NodeType.TEXT,
      value: 'aaa',
      parent: null,
      start: 0,
      end: 3,
    });
  });

  test('parses an argument', () => {
    expect(parseIcuTagSoup('{foo}')).toEqual<Node>({
      nodeType: NodeType.ARGUMENT,
      arg: 'foo',
      parent: null,
      start: 0,
      end: 5,
    });
  });

  test('parses a function', () => {
    expect(parseIcuTagSoup('{foo,number}')).toEqual<Node>({
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
    expect(parseIcuTagSoup('{foo,date,YYYY-MM-DD}')).toEqual(rootNode);
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

    const yesNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'yes',
      children: [],
      parent: rootNode,
      start: 14,
      end: 19,
    };
    rootNode.children.push(yesNode);

    yesNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'Yep',
      parent: yesNode,
      start: 19,
      end: 22,
    });

    const noNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'no',
      children: [],
      parent: rootNode,
      start: 23,
      end: 28,
    };
    rootNode.children.push(noNode);

    noNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'Nope',
      parent: noNode,
      start: 28,
      end: 32,
    });

    expect(parseIcuTagSoup('{foo, select, yes {Yep} no {Nope} }')).toEqual(rootNode);
  });

  test('parses a plural node', () => {
    const rootNode: Node = {
      nodeType: NodeType.PLURAL,
      arg: 'flowerCount',
      pluralOffset: undefined,
      children: [],
      parent: null,
      start: 0,
      end: 22,
    };

    const oneNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'one',
      children: [],
      parent: rootNode,
      start: 22,
      end: 27,
    };
    rootNode.children.push(oneNode);

    oneNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'One flower',
      parent: oneNode,
      start: 27,
      end: 37,
    });

    const manyNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'many',
      children: [],
      parent: rootNode,
      start: 38,
      end: 45,
    };
    rootNode.children.push(manyNode);

    manyNode.children.push(
        {
          nodeType: NodeType.OCTOTHORPE,
          parent: manyNode,
          start: 45,
          end: 46,
        },
        {
          nodeType: NodeType.TEXT,
          value: ' flowers',
          parent: manyNode,
          start: 46,
          end: 54,
        },
    );

    expect(parseIcuTagSoup('{flowerCount, plural, one {One flower} many {# flowers} }')).toEqual(rootNode);
  });

  test('parses an element', () => {
    expect(parseIcuTagSoup('<foo></foo>')).toEqual<Node>({
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
    expect(parseIcuTagSoup('<foo/>', {selfClosingEnabled: true})).toEqual<Node>({
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: null,
      start: 0,
      end: 6,
    });
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
      value: 'baz',
      parent: attrNode,
      start: 10,
      end: 13,
    });

    expect(parseIcuTagSoup('<foo bar="baz"></foo>')).toEqual(rootNode);
  });

  test('parses nested elements', () => {
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

    expect(parseIcuTagSoup('<foo><bar></bar></foo>')).toEqual(rootNode);
  });

  test('parses an element that is nested in a select', () => {

    const rootNode: Node = {
      nodeType: NodeType.SELECT,
      arg: 'answer',
      pluralOffset: undefined,
      children: [],
      parent: null,
      start: 0,
      end: 17,
    };

    const yesNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'yes',
      children: [],
      parent: rootNode,
      start: 17,
      end: 22,
    };
    rootNode.children.push(yesNode);

    const fooNode: IElementNode = {
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: yesNode,
      start: 22,
      end: 36,
    };
    yesNode.children.push(fooNode);

    fooNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'Yep',
      parent: fooNode,
      start: 27,
      end: 30,
    });

    const noNode: ISelectCaseNode = {
      nodeType: NodeType.SELECT_CASE,
      key: 'no',
      children: [],
      parent: rootNode,
      start: 37,
      end: 42,
    };
    rootNode.children.push(noNode);

    const barNode: IElementNode = {
      nodeType: NodeType.ELEMENT,
      tagName: 'bar',
      attrs: [],
      children: [],
      parent: noNode,
      start: 42,
      end: 57,
    };
    noNode.children.push(barNode);

    barNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'Nope',
      parent: barNode,
      start: 47,
      end: 51,
    });

    expect(parseIcuTagSoup('{answer, select, yes {<foo>Yep</foo>} no {<bar>Nope</bar>} }')).toEqual(rootNode);
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

    expect(parseIcuTagSoup('aaa<b>bbb{foo}ddd</b>eee')).toEqual(rootNode);
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

    expect(parseIcuTagSoup('aaa<b>{foo}</b>bbb')).toEqual(rootNode);
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

    expect(parseIcuTagSoup('<foo bar="aaa{baz}bbb"></foo>')).toEqual(rootNode);
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

    expect(parseIcuTagSoup('<foo bar="aaa{baz}bbb{qux}"></foo>')).toEqual(rootNode);
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

    expect(parseIcuTagSoup('<foo bar="{baz}"></foo>')).toEqual(rootNode);
  });

});