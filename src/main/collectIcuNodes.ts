import {Node, NodeType} from './ast-types';

/**
 * Collects all ICU nodes from an AST to an array in the order of occurrence.
 */
export function collectIcuNodes(nodes: Array<Node>, arr: Array<Node>): Array<Node> {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    arr.push(node);

    switch (node.nodeType) {
      case NodeType.PLURAL:
      case NodeType.SELECT:
      case NodeType.SELECT_ORDINAL:
      case NodeType.SELECT_CASE:
      case NodeType.FUNCTION:
        collectIcuNodes(node.children, arr);
    }
  }
  return arr;
}
