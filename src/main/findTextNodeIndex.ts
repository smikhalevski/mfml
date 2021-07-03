import {Node, NodeType} from './ast-types';

/**
 * Returns the index of the text node that contains a char range.
 *
 * @param nodes Nodes to that are searched.
 * @param index An index from which the search should start.
 * @param start The start char index.
 * @param end The end char index (exclusive).
 *
 * @returns The text node index or -1 if node wasn't found.
 */
export function findTextNodeIndex(nodes: Array<Node>, index: number, start: number, end: number): number {
  for (let i = index; i < nodes.length; i++) {
    const node = nodes[i];

    if (end <= node.start) {
      break;
    }
    if (node.nodeType === NodeType.TEXT && node.start <= start && end <= node.end) {
      return i;
    }
  }
  return -1;
}
