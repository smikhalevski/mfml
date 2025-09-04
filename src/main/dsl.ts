import {
  ArgumentNode,
  AttributeNode,
  CategoryNode,
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
