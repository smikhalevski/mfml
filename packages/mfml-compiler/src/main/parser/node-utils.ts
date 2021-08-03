import {ContainerNode, ISelectNode, ITextNode, Node, NodeType} from './parser-types';

export function isTextNode(node: Node | null | undefined): node is ITextNode {
  return node?.nodeType === NodeType.TEXT;
}

export function isSelectNode(node: Node | null | undefined): node is ISelectNode {
  const nodeType = node?.nodeType;

  return nodeType === NodeType.PLURAL
      || nodeType === NodeType.SELECT
      || nodeType === NodeType.SELECT_ORDINAL;
}

export function isContainerNode(node: Node | null | undefined): node is ContainerNode {
  const nodeType = node?.nodeType;

  return isSelectNode(node)
      || nodeType === NodeType.FRAGMENT
      || nodeType === NodeType.ELEMENT
      || nodeType === NodeType.ATTRIBUTE
      || nodeType === NodeType.FUNCTION
      || nodeType === NodeType.SELECT_CASE;
}

export function isBlankNode(node: Node | null | undefined): boolean {
  return !node
      || (isSelectNode(node) || node?.nodeType === NodeType.SELECT_CASE || node?.nodeType === NodeType.FRAGMENT) && node.children.every(isBlankNode)
      || isTextNode(node) && node.value === '';
}

export function getSignificantSize(nodes: Array<Node>): 0 | 1 | 2 {
  let size = 0;
  for (const node of nodes) {
    if (!isBlankNode(node) && ++size === 2) {
      break;
    }
  }
  return size as 0 | 1 | 2;
}
