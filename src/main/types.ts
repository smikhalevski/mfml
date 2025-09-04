import { Formatter } from './formatter.js';
import { CategorySelector } from './selector.js';

/**
 * Renders elements and arguments.
 *
 * @template Element The rendered element.
 * @group Renderer
 */
export interface Renderer<Element> {
  /**
   * Renders an element.
   *
   * @see {@link mfml/react!createReactDOMElementRenderer createReactDOMElementRenderer}
   */
  renderElement: ElementRenderer<Element>;

  /**
   * Formats argument value as a string.
   *
   * @see {@link defaultFormatter}
   */
  formatArgument: Formatter;

  /**
   * Returns the selected category depending of an argument value.
   *
   * @see {@link defaultCategorySelector}
   */
  selectCategory: CategorySelector;
}

/**
 * Renders an element.
 *
 * @param tagName The element tag name.
 * @param attributes Attributes of an element.
 * @param children Children of an element.
 * @returns Rendering result, or `undefined` if an element should not be rendered.
 * @template Element The rendered element.
 * @group Renderer
 */
export type ElementRenderer<Element> = (
  tagName: string,
  attributes: Record<string, string>,
  children: Array<Element | string>
) => Element | string | undefined;

/**
 * The metadata exported from the compiled translations module.
 *
 * @group Other
 */
export interface Metadata {
  /**
   * The array of locales supported by compiled message functions.
   */
  supportedLocales: string[];
}

/**
 * The node that can be a child node of a {@link ParentNode parent node}.
 *
 * @group AST
 */
export type ChildNode = TextNode | ElementNode | ArgumentNode | OctothorpeNode;

/**
 * The node that can contain {@link ChildNode child nodes}.
 *
 * @group AST
 */
export type ParentNode = MessageNode | ElementNode | AttributeNode | CategoryNode;

/**
 * Any MFML AST node.
 *
 * @group AST
 */
export type AnyNode =
  | MessageNode
  | TextNode
  | ElementNode
  | AttributeNode
  | ArgumentNode
  | OctothorpeNode
  | OptionNode
  | CategoryNode
  | LiteralNode;

/**
 * The indices of a node position in a message text.
 *
 * @group AST
 */
export interface SourceLocation {
  /**
   * The index at which a node value starts (inclusive).
   */
  startIndex?: number;

  /**
   * The index at which a node value ends (exclusive).
   */
  endIndex?: number;
}

/**
 * @internal
 */
declare const MESSAGE_VALUES: unique symbol;

/**
 * The node that describes a parsed message and contains related metadata.
 *
 * @template Values Type of arguments or `void` if message doesn't require arguments.
 * @group AST
 */
export interface MessageNode<Values extends object | void = any> {
  /**
   * The node type.
   */
  nodeType: 'message';

  /**
   * The parent node.
   */
  parentNode: null;

  /**
   * The message locale.
   */
  locale: string;

  /**
   * The child nodes.
   */
  childNodes: ChildNode[];

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
  parentNode: ParentNode | null;

  /**
   * The decoded text.
   */
  value: string;
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
  parentNode: ParentNode | null;

  /**
   * The name of the element tag.
   */
  tagName: string;

  /**
   * The array of attributes nodes.
   */
  attributeNodes: AttributeNode[] | null;

  /**
   * The array of child nodes.
   */
  childNodes: ChildNode[] | null;
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
  parentNode: ElementNode | null;

  /**
   * The name of the attribute.
   */
  name: string;

  /**
   * The array of child nodes.
   */
  childNodes: ChildNode[] | null;
}

/**
 * The node that describes an argument.
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
  parentNode: ParentNode | null;

  /**
   * The name of the argument.
   *
   */
  name: string;

  /**
   * The type of the argument.
   */
  typeNode: LiteralNode<string> | null;

  /**
   * The style that should be used for argument formatting, varies depending on an argument {@link typeNode}.
   */
  styleNode: LiteralNode<string> | null;

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
 * The node that descries an argument reference in a category.
 *
 * @group AST
 */
export interface OctothorpeNode extends SourceLocation {
  /**
   * The node type.
   */
  nodeType: 'octothorpe';

  /**
   * The parent node.
   */
  parentNode: ParentNode | null;
}

/**
 * The node that describes an argument option.
 *
 * @group AST
 */
export interface OptionNode extends SourceLocation {
  /**
   * The node type.
   */
  nodeType: 'option';

  /**
   * The parent node.
   */
  parentNode: ArgumentNode | null;

  /**
   * The option name.
   */
  name: string;

  /**
   * The option value.
   */
  valueNode: LiteralNode | null;
}

/**
 * The node describes a category selection based on the value of an argument.
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
  parentNode: ArgumentNode | null;

  /**
   * The category name.
   */
  name: string;

  /**
   * The array of child nodes.
   */
  childNodes: ChildNode[];
}

/**
 * The node describes a literal value.
 *
 * @template Value The literal value.
 * @group AST
 */
export interface LiteralNode<Value = any> extends SourceLocation {
  /**
   * The node type.
   */
  nodeType: 'literal';

  /**
   * The parent node.
   */
  parentNode: ArgumentNode | OptionNode | null;

  /**
   * The node value.
   */
  value: Value;
}
