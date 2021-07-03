import {Node, NodeType} from './ast-types';

/**
 * Adds all ICU nodes (including nested) from `nodes` to an array `ordinalNodes` in the order of occurrence.
 */
export function collectOrdinalNodes(nodes: Array<Node>, ordinalNodes: Array<Node>): Array<Node> {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    ordinalNodes.push(node);

    switch (node.nodeType) {
      case NodeType.PLURAL:
      case NodeType.SELECT:
      case NodeType.SELECT_ORDINAL:
      case NodeType.SELECT_CASE:
      case NodeType.FUNCTION:
        collectOrdinalNodes(node.children, ordinalNodes);
    }
  }
  return ordinalNodes;
}
