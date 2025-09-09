/**
 * MFML AST nodes and factories.
 *
 * @module mfml/ast
 */

export type Child = ElementNode | ArgumentNode | SelectNode | string;

export interface MessageNode<Values extends object = {}> {
  nodeType: 'message';
  locale: string;
  children: Child[] | string;
  __values?: Values;
}

export interface ElementNode {
  nodeType: 'element';
  tagName: string;
  attributes: Record<string, Child[] | string> | null;
  children: Child[] | string | null;
}

export interface ArgumentNode {
  nodeType: 'argument';
  name: string;
  type: string | undefined;
  style: string | undefined;
}

export interface SelectNode {
  nodeType: 'select';
  argumentName: string;
  type: string;
  categories: Record<string, Child[] | string>;
}

export function createMessageNode(locale: string, ...children: Child[]): MessageNode;

export function createMessageNode(locale: string): MessageNode {
  const node: MessageNode = { nodeType: 'message', locale, children: '' };

  if (arguments.length <= 1) {
    return node;
  }

  if (arguments.length === 2 && typeof arguments[1] === 'string') {
    node.children = arguments[1];
    return node;
  }

  node.children = [];

  for (let index = 1; index < arguments.length; ++index) {
    node.children.push(arguments[index]);
  }

  return node;
}

export function createElementNode(
  tagName: string,
  attributes?: Record<string, Child[] | string> | null,
  ...children: Child[]
): ElementNode;

export function createElementNode(
  tagName: string,
  attributes: Record<string, Child[] | string> | null = null
): ElementNode {
  const node: ElementNode = { nodeType: 'element', tagName, attributes, children: null };

  if (arguments.length <= 2) {
    return node;
  }

  if (arguments.length === 3 && typeof arguments[2] === 'string') {
    node.children = arguments[2];
    return node;
  }

  node.children = [];

  for (let index = 2; index < arguments.length; ++index) {
    node.children.push(arguments[index]);
  }

  return node;
}

export function createArgumentNode(name: string, type?: string, style?: string): ArgumentNode {
  return { nodeType: 'argument', name, type, style };
}

export function createSelectNode(argumentName: string, type: string, categories: Record<string, Child[]>): SelectNode {
  return { nodeType: 'select', argumentName, type, categories };
}
