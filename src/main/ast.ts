export type Child = ElementNode | ArgumentNode | SelectNode | string;

export interface MessageNode {
  nodeType: 'message';
  locale: string;
  children: Child[] | string | null;
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

  // select selectordinal plural
  type: string;

  // zero
  // one (singular)
  // two (dual)
  // few (paucal)
  // many (also used for fractions if they have a separate class)
  // other (required—general plural form—also used if the language only has a single form)
  categories: Record<string, Child[] | string>;
}

export function createMessageNode(locale: string, ...children: Child[]): MessageNode;

export function createMessageNode(locale: string): MessageNode {
  const node: MessageNode = { nodeType: 'message', locale, children: null };

  if (arguments.length > 1) {
    const children = [];

    for (let i = 1; i < arguments.length; ++i) {
      children.push(arguments[i]);
    }
    node.children = children;
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

  if (arguments.length > 2) {
    const children = [];

    for (let i = 2; i < arguments.length; ++i) {
      children.push(arguments[i]);
    }
    node.children = children;
  }

  return node;
}

export function createArgumentNode(name: string, type?: string, style?: string): ArgumentNode {
  return { nodeType: 'argument', name, type, style };
}

export function createSelectNode(argumentName: string, type: string, categories: Record<string, Child[]>): SelectNode {
  return { nodeType: 'select', argumentName, type, categories };
}
