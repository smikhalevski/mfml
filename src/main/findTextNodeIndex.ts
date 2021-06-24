import {Node, NodeType} from './ast-types';

export function findTextNodeIndex(arr: Array<Node>, index: number, start: number, end: number): number {
  for (let i = index; i < arr.length; i++) {
    const node = arr[i];

    if (end <= node.start) {
      // No more matching nodes
      break;
    }
    if (node.nodeType === NodeType.TEXT && node.start <= start && end <= node.end) {
      return i;
    }
  }
  return -1;
}
