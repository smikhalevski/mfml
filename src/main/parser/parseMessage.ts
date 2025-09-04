import { TokenCallback, tokenizeMessage, ResolvedTokenizerOptions } from './tokenizeMessage.js';
import {
  Child,
  createArgumentNode,
  createElementNode,
  createMessageNode,
  createSelectNode,
  ElementNode,
  MessageNode,
  SelectNode,
} from '../ast.js';

/**
 * Options that describe how names and HTML entities are decoded in a parsed MFML markup.
 */
export interface DecodingOptions {
  /**
   * Renames an XML tag.
   *
   * @param tagName A tag to rename.
   * @returns The new tag name.
   */
  renameTag?: (tagName: string) => string;

  /**
   * Renames an XML attribute.
   *
   * @param attributeName An attribute to rename.
   * @param tagName An tag name that was processed with {@link renameTag}.
   * @returns The new attribute name.
   */
  renameAttribute?: (attributeName: string, tagName: string) => string;

  /**
   * Renames an ICU arguments.
   *
   * @param argumentName An argument to rename.
   * @returns The new argument name.
   */
  renameArgument?: (argumentName: string) => string;

  /**
   * Renames an ICU argument type.
   *
   * @param argumentType An argument type to rename ("number", "date", "time").
   * @param argumentName An argument name that was processed with {@link renameArgument}.
   * @returns The new argument type name.
   */
  renameArgumentType?: (argumentType: string, argumentName: string) => string;

  /**
   * Renames an ICU argument style.
   *
   * @param argumentStyle An argument style to rename.
   * @param argumentType An argument type that was processed with {@link renameArgumentType}.
   * @returns The new argument style name.
   */
  renameArgumentStyle?: (argumentStyle: string, argumentType: string) => string;

  /**
   * Renames an ICU select category.
   *
   * @param selectType The type of the select ("plural", "selectordinal", "select").
   * @param argumentName An argument name that was processed with {@link renameArgument}.
   * @returns The new select type name.
   */
  renameSelectType?: (selectType: string, argumentName: string) => string;

  /**
   * Renames an ICU select category.
   *
   * @param selectType A type of the select ("plural", "selectordinal") processed with {@link renameSelectType}.
   * @param selectCategory A category to rename ("one", "many", "other", "=5").
   * @returns The new select category name.
   */
  renameSelectCategory?: (selectType: string, selectCategory: string) => string;

  /**
   * Decode text content before it is pushed to a node. Use this method to decode HTML entities.
   *
   * @param text Text to rewrite.
   */
  decodeText?: (text: string) => string;
}

/**
 * Options of {@link parseMessage}.
 */
export interface ParserOptions extends DecodingOptions {
  /**
   * Tokenizer options prepared by {@link resolveTokenizerOptions}.
   *
   * @see {@link htmlTokenizerOptions}
   */
  tokenizerOptions?: ResolvedTokenizerOptions;
}

/**
 * Parses text message to an AST.
 *
 * @example
 * parseMessage('en-US', 'Hello, <b>{name}</b>!', {
 *   tokenizerOptions: resolveTokenizerOptions(htmlTokenizerOptions),
 * });
 *
 * @param locale The message locale.
 * @param text The message text to parse.
 * @param options Parser options.
 * @returns The message node that describes the message contents.
 */
export function parseMessage(locale: string, text: string, options: ParserOptions = {}): MessageNode<any> {
  const {
    tokenizerOptions,
    renameTag = noRename,
    renameAttribute = noRename,
    renameArgument = noRename,
    renameArgumentType = noRename,
    renameArgumentStyle = noRename,
    renameSelectType = noRename,
    renameSelectCategory = noRename,
    decodeText = noRename,
  } = options;

  let tagName: string;
  let argumentName: string | undefined;
  let rawArgumentType: string | undefined;
  let rawArgumentStyle: string | undefined;
  let stackCursor = 0;

  const messageNode = createMessageNode(locale);
  const stack: Array<MessageNode | ElementNode | SelectNode | string> = [messageNode];

  const tokenCallback: TokenCallback = (token, startIndex, endIndex) => {
    switch (token) {
      case 'TEXT':
        pushChild(stack, stackCursor, decodeText(text.substring(startIndex, endIndex)));
        break;

      case 'XML_OPENING_TAG_START':
        tagName = renameTag(text.substring(startIndex, endIndex));
        pushChild(stack, stackCursor, (stack[++stackCursor] = createElementNode(tagName)));
        break;

      case 'XML_OPENING_TAG_END':
        break;

      case 'XML_OPENING_TAG_SELF_CLOSE':
      case 'XML_CLOSING_TAG':
        --stackCursor;
        break;

      case 'XML_ATTRIBUTE_START':
        stack[++stackCursor] = renameAttribute(text.substring(startIndex, endIndex), tagName);
        pushChild(stack, stackCursor, '');
        break;

      case 'XML_ATTRIBUTE_END':
        --stackCursor;
        break;

      case 'ICU_ARGUMENT_START':
        argumentName = renameArgument(text.substring(startIndex, endIndex));
        rawArgumentType = undefined;
        rawArgumentStyle = undefined;
        break;

      case 'ICU_ARGUMENT_TYPE':
        rawArgumentType = text.substring(startIndex, endIndex);
        break;

      case 'ICU_ARGUMENT_STYLE':
        rawArgumentStyle = text.substring(startIndex, endIndex);
        break;

      case 'ICU_ARGUMENT_END':
        if (argumentName === undefined) {
          // No argument name means that a select node was already put on the stack
          --stackCursor;
          break;
        }

        const argumentType = rawArgumentType && renameArgumentType(rawArgumentType, argumentName);
        const argumentStyle = rawArgumentStyle && renameArgumentStyle(rawArgumentStyle, argumentType!);

        pushChild(stack, stackCursor, createArgumentNode(argumentName, argumentType, argumentStyle));
        break;

      case 'ICU_CATEGORY_START':
        const parent = stack[stackCursor];

        if (typeof parent === 'string' || parent.nodeType !== 'select') {
          const selectType = renameSelectType(rawArgumentType!, argumentName!);

          pushChild(stack, stackCursor, (stack[++stackCursor] = createSelectNode(argumentName!, selectType, {})));
          argumentName = undefined;
        }

        stack[++stackCursor] = renameSelectCategory(text.substring(startIndex, endIndex), (parent as SelectNode).type);
        pushChild(stack, stackCursor, '');
        break;

      case 'ICU_CATEGORY_END':
        --stackCursor;
        break;

      case 'ICU_OCTOTHORPE':
        for (let index = stackCursor; index > -1; --index) {
          const node = stack[index];

          if (typeof node === 'string' || node.nodeType !== 'select') {
            continue;
          }

          // Use argument of the enclosing select to replace an octothorpe
          pushChild(stack, stackCursor, createArgumentNode(node.argumentName));
          break;
        }
        break;
    }
  };

  tokenizeMessage(text, tokenCallback, tokenizerOptions);

  return messageNode;
}

function pushChild(
  stack: Array<MessageNode | ElementNode | SelectNode | string>,
  stackCursor: number,
  child: Child
): void {
  const node = stack[stackCursor];

  if (typeof node === 'string') {
    const parent = stack[stackCursor - 1] as ElementNode | SelectNode;

    if (parent.nodeType === 'select') {
      parent.categories[node] = concatChildren(parent.categories[node], child);
      return;
    }

    (parent.attributes ||= {})[node] = concatChildren(parent.attributes[node], child);
    return;
  }

  if (node.nodeType === 'message' || node.nodeType === 'element') {
    node.children = concatChildren(node.children, child);
  }
}

function concatChildren(children: Child[] | string | null, child: Child): Child[] | string {
  if (children === '' || children === null || children === undefined) {
    return typeof child === 'string' ? child : [child];
  }

  if (typeof children === 'string') {
    return typeof child === 'string' ? children + child : [children, child];
  }

  if (typeof child === 'string' && typeof children[children.length - 1] === 'string') {
    children[children.length - 1] += child;
    return children;
  }

  children.push(child);
  return children;
}

function noRename(value: string): string {
  return value;
}
