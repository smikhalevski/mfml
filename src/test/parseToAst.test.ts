import {ISelectCaseNode, Node, NodeType} from '../main/ast-types';
import {parseToAst} from '../main/parseToAst';

describe('parseMarkup', () => {

  test('parses text', () => {
    expect(parseToAst('aaa')).toEqual<Node>({
      nodeType: NodeType.TEXT,
      value: 'aaa',
      parent: null,
      start: 0,
      end: 3,
    });
  });

  test('parses an argument', () => {
    expect(parseToAst('{foo}')).toEqual<Node>({
      nodeType: NodeType.ARGUMENT,
      arg: 'foo',
      parent: null,
      start: 0,
      end: 5,
    });
  });

  test('parses a function', () => {
    expect(parseToAst('{foo,number}')).toEqual<Node>({
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
    expect(parseToAst('{foo,date,YYYY-MM-DD}')).toEqual(rootNode);
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
      end: 28,
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
      end: 37,
    };
    rootNode.children.push(noNode);

    noNode.children.push({
      nodeType: NodeType.TEXT,
      value: 'Nope',
      parent: noNode,
      start: 28,
      end: 32,
    });

    expect(parseToAst('{foo, select, yes {Yep} no {Nope} }')).toEqual(rootNode);
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
      end: 44,
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
      end: 60,
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

    expect(parseToAst('{flowerCount, plural, one {One flower} many {# flowers} }')).toEqual(rootNode);
  });

  test('parses an element', () => {
    expect(parseToAst('<foo></foo>')).toEqual<Node>({
      nodeType: NodeType.ELEMENT,
      tagName: 'foo',
      attrs: [],
      children: [],
      parent: null,
      start: 0,
      end: 6,
    });
  });

  test('parses argument in tag', () => {
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

    elementNode.children.push({
      nodeType: NodeType.ARGUMENT,
      arg: 'bbb',
      parent: elementNode,
      start: 6,
      end: 11,
    });

    rootNode.children.push(
        elementNode,
        {
          nodeType: NodeType.TEXT,
          value: 'ccc',
          parent: rootNode,
          start: 15,
          end: 18,
        },
    );

    const nnn = parseToAst('aaa<b>{bbb}</b>ccc');

    expect(nnn).toEqual(rootNode);
  });
});
