import {Node} from './node-types';
import {isContainerNode} from './node-utils';

/**
 * Adds all ICU nodes (including nested) from `nodes` to an array `ordinalNodes` in the order of occurrence.
 */
export function collectOrdinalNodes(nodes: Array<Node>, ordinalNodes: Array<Node>): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    ordinalNodes.push(node);

    if (isContainerNode(node)) {
      collectOrdinalNodes(node.children, ordinalNodes);
    }
  }
}
