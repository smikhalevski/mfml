import {Node} from './node-types';
import {isContainerNode} from './node-utils';

/**
 * Traverse `nodes` and add them to `linearNodes` in the order of occurrence.
 */
export function linearizeNodes(nodes: Array<Node>, linearNodes: Array<Node>): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    linearNodes.push(node);

    if (isContainerNode(node)) {
      linearizeNodes(node.children, linearNodes);
    }
  }
}
