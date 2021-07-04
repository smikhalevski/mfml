import {
  IArgumentNode,
  IAttributeNode,
  IElementNode,
  IFragmentNode,
  IFunctionNode,
  IOctothorpeNode,
  ISelectNode,
  ITextNode,
  Node,
  NodeType,
} from '../parser';

export interface INodeVisitor {
  onFragment?: (node: IFragmentNode, next: () => void) => void;
  onElement?: (node: IElementNode, next: () => void) => void;
  onText?: (node: ITextNode) => void;
  onArgument?: (node: IArgumentNode) => void;
  onFunction?: (node: IFunctionNode, next: () => void) => void;
  onPlural?: (node: ISelectNode) => void;
  onSelect?: (node: ISelectNode) => void;
  onSelectOrdinal?: (node: ISelectNode) => void;
  onOctothorpe?: (node: IOctothorpeNode) => void;
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
      visitor.onFragment?.(node, () => visitChildren(node.children, visitor));
      break;
    case NodeType.ELEMENT:
      visitor.onElement?.(node, () => visitChildren(node.children, visitor));
      break;
    case NodeType.TEXT:
      visitor.onText?.(node);
      break;
    case NodeType.ARGUMENT:
      visitor.onArgument?.(node);
      break;
    case NodeType.FUNCTION:
      visitor.onFunction?.(node, () => visitChildren(node.children, visitor));
      break;
    case NodeType.PLURAL:
      visitor.onPlural?.(node);
      break;
    case NodeType.SELECT:
      visitor.onSelect?.(node);
      break;
    case NodeType.SELECT_ORDINAL:
      visitor.onSelectOrdinal?.(node);
      break;
    case NodeType.OCTOTHORPE:
      visitor.onOctothorpe?.(node);
      break;
  }
}

function visitChildren(children: Array<Node>, visitor: INodeVisitor): void {
  for (let i = 0; i < children.length; i++) {
    visitNode(children[i], visitor);
  }
}
