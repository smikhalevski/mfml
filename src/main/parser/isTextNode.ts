import {ITextNode, Node, NodeType} from './ast-types';

export function isTextNode(node: Node | null | undefined): node is ITextNode {
  return node?.nodeType === NodeType.TEXT;
}
