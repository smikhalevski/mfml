import {
  IArgumentNode,
  IAttributeNode,
  IElementNode,
  IFragmentNode,
  IFunctionNode,
  IOctothorpeNode,
  ISelectCaseNode,
  ISelectNode,
  ITextNode,
  Node,
  NodeType,
} from '../parser';

export interface INodeVisitor {
  fragment?(node: IFragmentNode, next: () => void): void;
  element?(node: IElementNode, nextAttributes: () => void, nextChildren: () => void): void;
  attribute?(node: IAttributeNode, next: () => void): void;
  text?(node: ITextNode): void;
  argument?(node: IArgumentNode): void;
  function?(node: IFunctionNode, next: () => void): void;
  plural?(node: ISelectNode, next: () => void): void;
  select?(node: ISelectNode, next: () => void): void;
  selectOrdinal?(node: ISelectNode, next: () => void): void;
  selectCase?(node: ISelectCaseNode, next: () => void): void;
  octothorpe?(node: IOctothorpeNode): void;
}

/**
 * Triggers callback for each node in the AST.
 *
 * @param node The node to traverse.
 * @param visitor Callbacks to invoke.
 */
export function visitNode(node: Node, visitor: INodeVisitor): void {
  switch (node.nodeType) {

    case NodeType.FRAGMENT:
      visitor.fragment?.(node, () => visitChildren(node.children, visitor));
      break;

    case NodeType.ELEMENT:
      visitor.element?.(node, () => visitChildren(node.attributes, visitor), () => visitChildren(node.children, visitor));
      break;

    case NodeType.ATTRIBUTE:
      visitor.attribute?.(node, () => visitChildren(node.children, visitor));
      break;

    case NodeType.TEXT:
      visitor.text?.(node);
      break;

    case NodeType.ARGUMENT:
      visitor.argument?.(node);
      break;

    case NodeType.FUNCTION:
      visitor.function?.(node, () => visitChildren(node.children, visitor));
      break;

    case NodeType.PLURAL:
      visitor.plural?.(node, () => visitChildren(node.children, visitor));
      break;

    case NodeType.SELECT:
      visitor.select?.(node, () => visitChildren(node.children, visitor));
      break;

    case NodeType.SELECT_ORDINAL:
      visitor.selectOrdinal?.(node, () => visitChildren(node.children, visitor));
      break;

    case NodeType.SELECT_CASE:
      visitor.selectCase?.(node, () => visitChildren(node.children, visitor));
      break;

    case NodeType.OCTOTHORPE:
      visitor.octothorpe?.(node);
      break;
  }
}

function visitChildren(children: Array<Node>, visitor: INodeVisitor): void {
  for (let i = 0; i < children.length; i++) {
    visitNode(children[i], visitor);
  }
}
