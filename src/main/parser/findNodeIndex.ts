import {Node, NodeType} from './ast-types';
import {isTextNode} from './isTextNode';

/**
 * Returns the index of the node that contains a char range or -1 if node wasn't found.
 */
export function findNodeIndex(nodes: Array<Node>, index: number, start: number, end: number): number {
  for (let i = index; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeStart = node.start;

    if (end <= nodeStart) {
      break;
    }
    if (start === end && nodeStart === start || isTextNode(node) && nodeStart <= start && end <= node.end) {
      return i;
    }
  }
  return -1;
}
