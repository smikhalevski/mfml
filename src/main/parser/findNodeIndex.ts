import {Node} from './node-types';
import {isTextNode} from './node-utils';

/**
 * Returns the index of the node that contains a char range or -1 if node wasn't found.
 */
export function findNodeIndex(nodes: Array<Node>, index: number, start: number, end: number): number {
  for (let i = index; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeStart = node.start;
    const nodeEnd = node.end;

    if (end <= nodeStart) {
      break;
    }
    if (start === end && nodeStart === start || isTextNode(node) && nodeStart <= start && end <= nodeEnd) {
      return i;
    }
  }
  return -1;
}
