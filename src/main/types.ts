// /**
//  * The node that can be a child of a message.
//  *
//  * @group AST
//  */
// export type ChildNode = TextNode | ElementNode | ArgumentNode | SelectNode;
//
// /**
//  * The node that can be a parent for other nodes.
//  *
//  * @group AST
//  */
// export type ParentNode = MessageNode | ElementNode | AttributeNode | CategoryNode;
//
// /**
//  * @internal
//  */
// declare const MESSAGE_VALUES: unique symbol;
//
// /**
//  * The node that describes a parsed message and contains related metadata.
//  *
//  * @template Values ICU arguments type or `void` if message doesn't have any arguments.
//  * @group AST
//  */
// export interface MessageNode<Values extends object | void = void> {
//   /**
//    * The node type.
//    */
//   nodeType: 'message';
//
//   /**
//    * The message locale.
//    */
//   locale: string;
//
//   /**
//    * The child nodes.
//    */
//   children: ChildNode[];
//
//   /**
//    * Type-only property that holds types of the message arguments.
//    *
//    * @internal
//    */
//   [MESSAGE_VALUES]?: Values;
// }
//
// /**
//  * The node that describes a char sequence.
//  *
//  * @group AST
//  */
// export interface TextNode {
//   /**
//    * The node type.
//    */
//   nodeType: 'text';
//
//   /**
//    * The parent node.
//    */
//   parent: ParentNode | null;
//
//   /**
//    * The decoded text.
//    */
//   text: string;
//
//   /**
//    * The index at which {@link text} starts in the original message text.
//    */
//   startIndex?: number;
//
//   /**
//    * The index at which {@link text} ends in the original message text.
//    */
//   endIndex?: number;
// }
//
// /**
//  * The node that describes an element.
//  *
//  * @group AST
//  */
// export interface ElementNode {
//   /**
//    * The node type.
//    */
//   nodeType: 'element';
//
//   /**
//    * The parent node.
//    */
//   parent: ParentNode | null;
//
//   /**
//    * The name of the element tag.
//    *
//    * @see {@link mfml/parser!ParserOptions.renameTag ParserOptions.renameTag}
//    */
//   tagName: string;
//
//   /**
//    * The array of attributes nodes.
//    */
//   attributes: AttributeNode[];
//
//   /**
//    * The array of child nodes.
//    */
//   children: ChildNode[];
//
//   /**
//    * The index at which {@link tagName} of the opening tag starts in the original message text.
//    */
//   startIndex?: number;
//
//   /**
//    * The index at which {@link tagName} of the opening tag ends in the original message text.
//    */
//   endIndex?: number;
// }
//
// /**
//  * The node that describes an attribute of element.
//  *
//  * @group AST
//  */
// export interface AttributeNode {
//   /**
//    * The node type.
//    */
//   nodeType: 'attribute';
//
//   /**
//    * The parent node.
//    */
//   parent: ElementNode | null;
//
//   /**
//    * The name of the attribute.
//    *
//    * @see {@link mfml/parser!ParserOptions.renameAttribute ParserOptions.renameAttribute}
//    */
//   name: string;
//
//   /**
//    * The array of child nodes.
//    */
//   children: ChildNode[];
//
//   /**
//    * The index at which the attribute {@link name} starts in the original message text.
//    */
//   startIndex?: number;
//
//   /**
//    * The index at which the attribute {@link name} ends in the original message text.
//    */
//   endIndex?: number;
// }
//
// /**
//  * The node that describes an ICU argument.
//  *
//  * @group AST
//  */
// export interface ArgumentNode {
//   /**
//    * The node type.
//    */
//   nodeType: 'argument';
//
//   /**
//    * The parent node.
//    */
//   parent: ParentNode | null;
//
//   /**
//    * The name of the ICU argument.
//    *
//    * @see {@link mfml/parser!ParserOptions.renameArgument ParserOptions.renameArgument}
//    */
//   name: string;
//
//   /**
//    * The data type of the argument.
//    *
//    * @example 'number'
//    * @see {@link mfml/parser!ParserOptions.renameArgumentType ParserOptions.renameArgumentType}
//    */
//   type: string | null;
//
//   /**
//    * The style that should be used for argument formatting, varies depending on an argument {@link type}.
//    *
//    * @example 'decimal'
//    * @see {@link mfml/parser!ParserOptions.renameArgumentStyle ParserOptions.renameArgumentStyle}
//    */
//   style: string | null;
//
//   /**
//    * The index at which the argument {@link name} starts in the original message text.
//    */
//   startIndex?: number;
//
//   /**
//    * The index at which the argument {@link name} ends in the original message text.
//    */
//   endIndex?: number;
// }
//
// /**
//  * The node describes a category selection based on the value of an ICU argument.
//  *
//  * @group AST
//  */
// export interface SelectNode {
//   /**
//    * The node type.
//    */
//   nodeType: 'select';
//
//   /**
//    * The parent node.
//    */
//   parent: ParentNode | null;
//
//   /**
//    * The name of the ICU argument.
//    *
//    * @see {@link mfml/parser!ParserOptions.renameArgument ParserOptions.renameArgument}
//    */
//   argumentName: string;
//
//   /**
//    * The type of the select node.
//    *
//    * @example 'plural'
//    * @see {@link mfml/parser!ParserOptions.renameSelectType ParserOptions.renameSelectType}
//    */
//   type: string;
//
//   /**
//    * The array of category nodes.
//    */
//   categories: CategoryNode[];
//
//   /**
//    * The index at which the {@link argumentName} starts in the original message text.
//    */
//   startIndex?: number;
//
//   /**
//    * The index at which the {@link argumentName} ends in the original message text.
//    */
//   endIndex?: number;
// }
//
// /**
//  * The node describes a category selection based on the value of an ICU argument.
//  *
//  * @group AST
//  */
// export interface CategoryNode {
//   /**
//    * The node type.
//    */
//   nodeType: 'category';
//
//   /**
//    * The parent node.
//    */
//   parent: SelectNode | null;
//
//   /**
//    * @see {@link mfml/parser!ParserOptions.renameSelectCategory ParserOptions.renameSelectCategory}
//    */
//   name: string;
//
//   /**
//    * The array of child nodes.
//    */
//   children: ChildNode[];
//
//   /**
//    * The index at which the category {@link name} starts in the original message text.
//    */
//   startIndex?: number;
//
//   /**
//    * The index at which the category {@link name} ends in the original message text.
//    */
//   endIndex?: number;
// }
//
// /**
//  * Creates a new message node.
//  *
//  * @param locale The message locale.
//  * @param children The children of a message.
//  * @group AST
//  */
// export function createMessageNode(locale: string, ...children: Array<ChildNode | string>): MessageNode<any>;
//
// export function createMessageNode(locale: string): MessageNode {
//   const messageNode: MessageNode = { nodeType: 'message', locale, children: [] };
//
//   for (let i = 1; i < arguments.length; ++i) {
//     messageNode.children.push(adoptChild(arguments[i], messageNode));
//   }
//
//   return messageNode;
// }
//
// /**
//  * Creates a new text node.
//  *
//  * @param text The node text.
//  * @group AST
//  */
// export function createTextNode(text: string): TextNode {
//   return { nodeType: 'text', parent: null, text };
// }
//
// /**
//  * Creates a new element node.
//  *
//  * @param tagName The name of the element tag.
//  * @param attributes Mapping from an attribute name to children, or `null` if there are no attributes.
//  * @param children The children of an element.
//  * @group AST
//  */
// export function createElementNode(
//   tagName: string,
//   attributes?: Record<string, Array<ChildNode | string> | string> | null,
//   ...children: Array<ChildNode | string>
// ): ElementNode;
//
// export function createElementNode(
//   tagName: string,
//   attributes?: Record<string, Array<ChildNode | string> | string> | null
// ): ElementNode {
//   const elementNode: ElementNode = { nodeType: 'element', parent: null, tagName, attributes: [], children: [] };
//
//   if (attributes !== null && attributes !== undefined) {
//     for (const name in attributes) {
//       const attributeNode = createAttributeNode(name, elementNode);
//
//       adoptChildren(attributes[name], attributeNode, attributeNode.children);
//
//       elementNode.attributes.push(attributeNode);
//     }
//   }
//
//   for (let i = 2; i < arguments.length; ++i) {
//     elementNode.children.push(adoptChild(arguments[i], elementNode));
//   }
//
//   return elementNode;
// }
//
// /**
//  * Creates a new element attribute node.
//  *
//  * @param name The name of the ICU attribute.
//  * @param parentNode The parent element node.
//  * @group AST
//  */
// export function createAttributeNode(name: string, parentNode: ElementNode): AttributeNode {
//   return { nodeType: 'attribute', parent: parentNode, name, children: [] };
// }
//
// /**
//  * Creates a new argument node.
//  *
//  * @param name The name of the ICU attribute.
//  * @param type The data type of the argument.
//  * @param style The style that should be used for argument formatting, varies depending on an argument type.
//  * @group AST
//  */
// export function createArgumentNode(
//   name: string,
//   type: string | null = null,
//   style: string | null = null
// ): ArgumentNode {
//   return { nodeType: 'argument', parent: null, name, type, style };
// }
//
// /**
//  * Creates a new select node.
//  *
//  * @param argumentName The name of the ICU argument.
//  * @param type The type of the select node.
//  * @param categories Mapping from an argument value or a category name to children that should be rendered when
//  * the category is matched.
//  * @group AST
//  */
// export function createSelectNode(
//   argumentName: string,
//   type: string,
//   categories: Record<string, Array<ChildNode | string> | ChildNode | string>
// ): SelectNode {
//   const selectNode: SelectNode = { nodeType: 'select', parent: null, argumentName, type, categories: [] };
//
//   for (const name in categories) {
//     const categoryNode = createCategoryNode(name, selectNode);
//
//     adoptChildren(categories[name], categoryNode, categoryNode.children);
//
//     selectNode.categories.push(categoryNode);
//   }
//
//   return selectNode;
// }
//
// export function createCategoryNode(name: string, parent: SelectNode): CategoryNode {
//   return { nodeType: 'category', parent, name, children: [] };
// }
//
// function adoptChildren(
//   children: Array<ChildNode | string> | ChildNode | string,
//   parentNode: ParentNode,
//   childNodes: ChildNode[] = []
// ): ChildNode[] {
//   if (Array.isArray(children)) {
//     for (let i = 0; i < children.length; ++i) {
//       childNodes.push(adoptChild(children[i], parentNode));
//     }
//   } else {
//     childNodes.push(adoptChild(children, parentNode));
//   }
//
//   return childNodes;
// }
//
// function adoptChild(child: ChildNode | string, parentNode: ParentNode): ChildNode {
//   const childNode = typeof child === 'string' ? createTextNode(child) : child;
//
//   childNode.parent = parentNode;
//
//   return childNode;
// }
