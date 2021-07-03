import {ContainerNode, ITextNode, Node, NodeType} from './node-types';

export function isTextNode(node: Node | null | undefined): node is ITextNode {
  return node?.nodeType === NodeType.TEXT;
}

export function isContainerNode(node: Node | null | undefined): node is ContainerNode {
  const nodeType = node?.nodeType;

  return nodeType === NodeType.FRAGMENT
      || nodeType === NodeType.ELEMENT
      || nodeType === NodeType.ATTRIBUTE
      || nodeType === NodeType.FUNCTION
      || nodeType === NodeType.SELECT
      || nodeType === NodeType.SELECT_CASE;
}
