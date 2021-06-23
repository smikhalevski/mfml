import {Node, NodeType} from './ast-types';

/**
 * Collects all nodes from an AST to an array in the order of occurrence.
 */
export function collectNodes(nodes: Array<Node>, arr: Array<Node>): Array<Node> {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    arr.push(node);

    switch (node.nodeType) {

      case NodeType.ELEMENT:
        collectNodes(node.attrs, arr);

      case NodeType.FRAGMENT:
      case NodeType.ATTRIBUTE:
      case NodeType.PLURAL:
      case NodeType.SELECT:
      case NodeType.SELECT_ORDINAL:
      case NodeType.SELECT_CASE:
      case NodeType.FUNCTION:
        collectNodes(node.children, arr);
    }
  }
  return arr;
}
