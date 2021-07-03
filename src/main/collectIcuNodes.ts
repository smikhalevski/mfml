import {Node, NodeType} from './ast-types';

/**
 * Collects all ICU nodes from an AST to an array in the order of occurrence.
 *
 * @param rootNodes Root nodes parsed by {@link parseIcuAst}.
 * @param allNodes An array to store all nodes in
 */
export function collectIcuNodes(rootNodes: Array<Node>, allNodes: Array<Node>): Array<Node> {
  for (let i = 0; i < rootNodes.length; i++) {
    const node = rootNodes[i];

    allNodes.push(node);

    switch (node.nodeType) {
      case NodeType.PLURAL:
      case NodeType.SELECT:
      case NodeType.SELECT_ORDINAL:
      case NodeType.SELECT_CASE:
      case NodeType.FUNCTION:
        collectIcuNodes(node.children, allNodes);
    }
  }
  return allNodes;
}
