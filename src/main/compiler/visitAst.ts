import {
  IArgumentNode,
  IElementNode,
  IFragmentNode,
  IFunctionNode,
  IOctothorpeNode,
  ISelectNode,
  ITextNode,
  Node,
  NodeType,
} from '../parser/node-types';

export interface IVisitor {
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

export function visitAst(node: Node, visitor: IVisitor): void {
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

function visitChildren(children: Array<Node>, visitor: IVisitor): void {
  for (let i = 0; i < children.length; i++) {
    visitAst(children[i], visitor);
  }
}
