/**
 * The node that can be a child of a message.
 *
 * @group AST
 */
export type ChildNode = TextNode | ElementNode | ArgumentNode;

/**
 * The node that can be a parent for other nodes.
 *
 * @group AST
 */
export type ParentNode = MessageNode | ElementNode | AttributeNode | CategoryNode;

/**
 * The indices of a node position in a message text
 *
 * @group AST
 */
export interface SourceLocation {
  startIndex?: number;
  endIndex?: number;
}

/**
 * @internal
 */
declare const MESSAGE_VALUES: unique symbol;

/**
 * The node that describes a parsed message and contains related metadata.
 *
 * @template Values ICU arguments type or `void` if message doesn't have any arguments.
 * @group AST
 */
export interface MessageNode<Values extends object | void = void> {
  /**
   * The node type.
   */
  nodeType: 'message';

  /**
   * The message locale.
   */
  locale: string;

  /**
   * The child nodes.
   */
  children: ChildNode[];

  /**
   * Type-only property that holds types of the message arguments.
   *
   * @internal
   */
  [MESSAGE_VALUES]?: Values;
}

/**
 * The node that describes a char sequence.
 *
 * @group AST
 */
export interface TextNode extends SourceLocation {
  /**
   * The node type.
   */
  nodeType: 'text';

  /**
   * The parent node.
   */
  parent: ParentNode | null;

  /**
   * The decoded text.
   */
  text: string;
}

/**
 * The node that describes an element.
 *
 * @group AST
 */
export interface ElementNode extends SourceLocation {
  /**
   * The node type.
   */
  nodeType: 'element';

  /**
   * The parent node.
   */
  parent: ParentNode | null;

  /**
   * The name of the element tag.
   */
  tagName: string;

  /**
   * The array of attributes nodes.
   */
  attributes: AttributeNode[] | null;

  /**
   * The array of child nodes.
   */
  children: ChildNode[] | null;
}

/**
 * The node that describes an attribute of element.
 *
 * @group AST
 */
export interface AttributeNode extends SourceLocation {
  /**
   * The node type.
   */
  nodeType: 'attribute';

  /**
   * The parent node.
   */
  parent: ElementNode | null;

  /**
   * The name of the attribute.
   */
  name: string;

  /**
   * The array of child nodes.
   */
  children: ChildNode[] | null;
}

/**
 * The node that describes an ICU argument.
 *
 * @group AST
 */
export interface ArgumentNode extends SourceLocation {
  /**
   * The node type.
   */
  nodeType: 'argument';

  /**
   * The parent node.
   */
  parent: ParentNode | null;

  /**
   * The name of the ICU argument.
   *
   */
  name: string;

  /**
   * The type of the argument.
   */
  typeNode: LiteralNode | null;

  /**
   * The style that should be used for argument formatting, varies depending on an argument {@link typeNode}.
   */
  styleNode: LiteralNode | null;

  /**
   * The array of options that were provided to an argument.
   */
  optionNodes: OptionNode[] | null;

  /**
   * The array of categories that were provided to an argument.
   */
  categoryNodes: CategoryNode[] | null;
}

/**
 * The node that describes an ICU argument option.
 *
 * @group AST
 */
export interface OptionNode extends SourceLocation {
  /**
   * The node type.
   */
  nodeType: 'option';

  /**
   * The option name.
   */
  name: string;

  /**
   * The option value.
   */
  value: LiteralNode;
}

/**
 * The node describes a category selection based on the value of an ICU argument.
 *
 * @group AST
 */
export interface CategoryNode extends SourceLocation {
  /**
   * The node type.
   */
  nodeType: 'category';

  /**
   * The parent node.
   */
  parent: ArgumentNode | null;

  /**
   * The category name.
   */
  name: string;

  /**
   * The array of child nodes.
   */
  children: ChildNode[];
}

/**
 * The node describes a literal value.
 *
 * @group AST
 */
export interface LiteralNode extends SourceLocation {
  /**
   * The node type.
   */
  nodeType: 'literal';

  /**
   * The node value.
   */
  value: string;
}
