import {Node, NodeType, parseMarkup} from './main';

describe('parseMarkup', () => {

  test('', () => {
    const rootNode: Node = {
      nodeType: NodeType.FRAGMENT,
      children: [],
      parent: null,
      start: 0,
      end: 0,
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
      attributes: [],
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

    const nnn = parseMarkup('aaa<b>{bbb}</b>ccc');

    expect(nnn).toEqual(rootNode);
  });
});
