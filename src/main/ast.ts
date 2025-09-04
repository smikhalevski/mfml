/**
 * The child of a message node.
 *
 * @group AST
 */
export type Child = ElementNode | ArgumentNode | SelectNode | string;

/**
 * The root message node.
 *
 * @template Values ICU arguments type or `void` if message doesn't have any arguments.
 * @group AST
 */
export interface MessageNode<Values extends object | void = void> {
  nodeType: 'message';

  /**
   * The message locale.
   */
  locale: string;

  /**
   * The child nodes.
   */
  children: Child[] | string;

  /**
   * Type-only property that holds types of the message arguments.
   *
   * @internal
   */
  __valuesType?: Values;
}

/**
 * The node that describes an element.
 *
 * @group AST
 */
export interface ElementNode {
  nodeType: 'element';

  /**
   * The name of the element tag.
   *
   * @see {@link mfml/parser!ParserOptions.renameTag ParserOptions.renameTag}
   */
  tagName: string;

  /**
   * Mapping from an attribute name to children, or `null` if there are no attributes.
   *
   * @see {@link mfml/parser!ParserOptions.renameAttribute ParserOptions.renameAttribute}
   */
  attributes: Record<string, Child[] | string> | null;

  /**
   * The child nodes, or `null` if there are no children.
   */
  children: Child[] | string | null;
}

/**
 * The ICU attribute node.
 *
 * @group AST
 */
export interface ArgumentNode {
  nodeType: 'argument';

  /**
   * The name of the ICU attribute.
   *
   * @see {@link mfml/parser!ParserOptions.renameArgument ParserOptions.renameArgument}
   */
  name: string;

  /**
   * The data type of the argument.
   *
   * @example 'number'
   * @see {@link mfml/parser!ParserOptions.renameArgumentType ParserOptions.renameArgumentType}
   */
  type: string | undefined;

  /**
   * The style that should be used for argument formatting, varies depending on an argument {@link type}.
   *
   * @see {@link mfml/parser!ParserOptions.renameArgumentStyle ParserOptions.renameArgumentStyle}
   */
  style: string | undefined;
}

/**
 * The node that describes a choice based on an ICU argument value.
 *
 * @group AST
 */
export interface SelectNode {
  nodeType: 'select';

  /**
   * The name of the ICU argument.
   *
   * @see {@link mfml/parser!ParserOptions.renameArgument ParserOptions.renameArgument}
   */
  argumentName: string;

  /**
   * The type of the select node.
   *
   * @example 'plural'
   */
  type: string;

  /**
   * Mapping from an argument value or a category name to children that should be rendered when the category is matched.
   *
   * @see {@link mfml/parser!ParserOptions.renameSelectCategory ParserOptions.renameSelectCategory}
   */
  categories: Record<string, Child[] | string>;
}

/**
 * Creates a new message node.
 *
 * @param locale The message locale.
 * @param children The child nodes.
 * @group AST
 */
export function createMessageNode(locale: string, ...children: Child[]): MessageNode<any>;

export function createMessageNode(locale: string): MessageNode {
  let children;

  if (arguments.length < 2) {
    children = '';
  } else if (arguments.length === 2 && typeof arguments[1] === 'string') {
    children = arguments[1];
  } else {
    children = [];

    for (let i = 1; i < arguments.length; ++i) {
      children.push(arguments[i]);
    }
  }

  return { nodeType: 'message', locale, children };
}

/**
 * Creates a new element node.
 *
 * @param tagName The name of the element tag.
 * @param attributes Mapping from an attribute name to children, or `null` if there are no attributes.
 * @param children The child nodes, or `null` if there are no children.
 * @group AST
 */
export function createElementNode(
  tagName: string,
  attributes?: Record<string, Child[] | string> | null,
  ...children: Child[]
): ElementNode;

export function createElementNode(
  tagName: string,
  attributes: Record<string, Child[] | string> | null = null
): ElementNode {
  let children;

  if (arguments.length < 3) {
    children = null;
  } else if (arguments.length === 3 && typeof arguments[2] === 'string') {
    children = arguments[2];
  } else {
    children = [];

    for (let i = 1; i < arguments.length; ++i) {
      children.push(arguments[i]);
    }
  }

  return { nodeType: 'element', tagName, attributes, children };
}

/**
 * Creates a new argument node.
 *
 * @param name The name of the ICU attribute.
 * @param type The data type of the argument.
 * @param style The style that should be used for argument formatting, varies depending on an argument type.
 * @group AST
 */
export function createArgumentNode(name: string, type?: string, style?: string): ArgumentNode {
  return { nodeType: 'argument', name, type, style };
}

/**
 * Creates a new select node.
 *
 * @param argumentName The name of the ICU argument.
 * @param type The type of the select node.
 * @param categories Mapping from an argument value or a category name to children that should be rendered when
 * the category is matched.
 * @group AST
 */
export function createSelectNode(
  argumentName: string,
  type: string,
  categories: Record<string, Child[] | string>
): SelectNode {
  return { nodeType: 'select', argumentName, type, categories };
}
