export type Child = ElementNode | ArgumentNode | SelectNode | string;

export interface MessageNode {
  nodeType: 'message';
  locale: string;
  children: Child[];
}

export interface ElementNode {
  nodeType: 'element';
  tagName: string;
  attributes: Record<string, Child[] | string>;
  children: Child[];
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
  cases: Record<string, Child[]>;
}

export function createMessageNode(locale: string, ...children: Child[]): MessageNode {
  return { nodeType: 'message', locale, children };
}

export function createElementNode(
  tagName: string,
  attributes: Record<string, Child[] | string> = {},
  ...children: Child[]
): ElementNode {
  return { nodeType: 'element', tagName, attributes, children };
}

export function createArgumentNode(name: string, type?: string, style?: string): ArgumentNode {
  return { nodeType: 'argument', name, type, style };
}

export function createSelectNode(argumentName: string, type: string, cases: Record<string, Child[]>): SelectNode {
  return { nodeType: 'select', argumentName, type, cases };
}
