import {Rewriter} from 'tag-soup';
import {Node} from './node-types';
import {isContainerNode, isTextNode} from './node-utils';

export function decodeTextNodes(nodes: Array<Node>, decoder: Rewriter): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (isTextNode(node)) {
      node.value = decoder(node.value);
      continue;
    }
    if (isContainerNode(node)) {
      decodeTextNodes(node.children, decoder);
    }
  }
}
