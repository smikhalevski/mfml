import {
  AnyNode,
  ArgumentNode,
  AttributeNode,
  CategoryNode,
  ChildNode,
  ElementNode,
  LiteralNode,
  MessageNode,
  OctothorpeNode,
  OptionNode,
  TextNode,
} from './types.js';

export function createMessageNode(locale: string): MessageNode {
  return {
    nodeType: 'message',
    parentNode: null,
    locale,
    childNodes: [],
  };
}

export function createTextNode(value: string): TextNode {
  return {
    nodeType: 'text',
    parentNode: null,
    value,
  };
}

export function createElementNode(tagName: string): ElementNode {
  return {
    nodeType: 'element',
    parentNode: null,
    tagName,
    attributeNodes: null,
    childNodes: null,
  };
}

export function createAttributeNode(name: string): AttributeNode {
  return {
    nodeType: 'attribute',
    parentNode: null,
    name,
    childNodes: null,
  };
}

export function createArgumentNode(name: string): ArgumentNode {
  return {
    nodeType: 'argument',
    parentNode: null,
    name,
    typeNode: null,
    styleNode: null,
    optionNodes: null,
    categoryNodes: null,
  };
}

// R
export function createOctothorpeNode(): OctothorpeNode {
  return {
    nodeType: 'octothorpe',
    parentNode: null,
  };
}

export function createOptionNode(name: string): OptionNode {
  return {
    nodeType: 'option',
    parentNode: null,
    name,
    valueNode: null,
  };
}

export function createCategoryNode(name: string): CategoryNode {
  return {
    nodeType: 'category',
    parentNode: null,
    name,
    childNodes: [],
  };
}

export function createLiteralNode(value: string): LiteralNode {
  return {
    nodeType: 'literal',
    parentNode: null,
    value,
  };
}

export type Child = ChildNode | string;

// M
export function buildMessageNode(locale: string, ...children: Child[]): MessageNode;

export function buildMessageNode(locale: string): MessageNode {
  const messageNode = createMessageNode(locale);

  for (let i = 1; i < arguments.length; ++i) {
    messageNode.childNodes = pushChild(messageNode, messageNode.childNodes, arguments[i]);
  }

  return messageNode;
}

// E
export function buildElementNode(tagName: string, ...children: Array<AttributeNode | Child>): ElementNode;

export function buildElementNode(tagName: string): ElementNode {
  const elementNode = createElementNode(tagName);

  for (let i = 1; i < arguments.length; ++i) {
    if (typeof arguments[i] !== 'string' && arguments[i].nodeType === 'attribute') {
      elementNode.attributeNodes = pushChild(elementNode, elementNode.attributeNodes, arguments[i]);
    } else {
      elementNode.childNodes = pushChild(elementNode, elementNode.childNodes, arguments[i]);
    }
  }

  return elementNode;
}

// A
export function buildAttributeNode(name: string, ...children: Child[]): AttributeNode;

export function buildAttributeNode(name: string): AttributeNode {
  const attributeNode = createAttributeNode(name);

  for (let i = 1; i < arguments.length; ++i) {
    attributeNode.childNodes = pushChild(attributeNode, attributeNode.childNodes, arguments[i]);
  }

  return attributeNode;
}

// V
export function buildArgumentNode(name: string): ArgumentNode;

export function buildArgumentNode(name: string, type: string, style: string): ArgumentNode;

export function buildArgumentNode(
  name: string,
  type: string,
  ...children: Array<OptionNode | CategoryNode>
): ArgumentNode;

export function buildArgumentNode(name: string): ArgumentNode {
  const attributeNode = createArgumentNode(name);

  if (arguments.length === 1) {
    return attributeNode;
  }

  // Type
  (attributeNode.typeNode = createLiteralNode(arguments[1])).parentNode = attributeNode;

  if (arguments.length === 2) {
    return attributeNode;
  }

  // Style
  if (typeof arguments[2] === 'string') {
    (attributeNode.styleNode = createLiteralNode(arguments[2])).parentNode = attributeNode;
    return attributeNode;
  }

  // Options and categories
  for (let i = 2; i < arguments.length; ++i) {
    if (arguments[i].nodeType === 'option') {
      attributeNode.optionNodes = pushChild(attributeNode, attributeNode.optionNodes, arguments[i]);
    } else {
      attributeNode.categoryNodes = pushChild(attributeNode, attributeNode.categoryNodes, arguments[i]);
    }
  }

  return attributeNode;
}

// O
export function buildOptionNode(name: string, value: string): OptionNode {
  const optionNode = createOptionNode(name);

  // Value
  (optionNode.valueNode = createLiteralNode(value)).parentNode = optionNode;

  return optionNode;
}

// C
export function buildCategoryNode(name: string, ...children: Child[]): CategoryNode;

export function buildCategoryNode(name: string): CategoryNode {
  const categoryNode = createCategoryNode(name);

  for (let i = 1; i < arguments.length; ++i) {
    categoryNode.childNodes = pushChild(categoryNode, categoryNode.childNodes, arguments[i]);
  }

  return categoryNode;
}

function pushChild<T extends AnyNode>(parentNode: AnyNode, childNodes: T[] | null, child: any): T[] {
  const childNode = typeof child === 'string' ? createTextNode(child) : child;

  childNode.parentNode = parentNode;

  if (childNodes === null) {
    return [childNode];
  }

  childNodes.push(childNode);

  return childNodes;
}

export {
  createOctothorpeNode as R,
  buildMessageNode as M,
  buildElementNode as E,
  buildAttributeNode as A,
  buildArgumentNode as V,
  buildOptionNode as O,
  buildCategoryNode as C,
};
