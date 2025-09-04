import { Tokenizer } from './createTokenizer.js';
import { ParserError, TokenCallback } from './tokenizeMessage.js';
import {
  createArgumentNode,
  createAttributeNode,
  createCategoryNode,
  createElementNode,
  createLiteralNode,
  createMessageNode,
  createOctothorpeNode,
  createOptionNode,
  createTextNode,
} from '../dsl.js';
import {
  AnyNode,
  ArgumentNode,
  AttributeNode,
  CategoryNode,
  ElementNode,
  MessageNode,
  OptionNode,
  ParentNode,
  SourceLocation,
} from '../types.js';

/**
 * Options of the {@link createParser}.
 *
 * @group Parser
 */
export interface ParserOptions {
  /**
   * Tokenizer that reads message as tokens.
   *
   * @see {@link createTokenizer}
   */
  tokenizer: Tokenizer;

  /**
   * Decode text content before it is pushed to an MFML AST node. Use this method to decode HTML entities.
   *
   * @param text Text to decode.
   */
  decodeText?: (text: string) => string;
}

/**
 * Parses text message to an AST.
 *
 * @group Parser
 */
export interface Parser {
  /**
   * Parses text message to an AST.
   *
   * @param locale The message locale.
   * @param text The message text to parse.
   * @returns The message node that describes the message contents.
   */
  parse(locale: string, text: string): MessageNode;
}

/**
 * Parses text message to an AST.
 *
 * @example
 * import { createParser, createTokenizer, htmlTokenizerOptions } from 'mfml/parser';
 *
 * const tokenizer = createTokenizer(htmlTokenizerOptions);
 *
 * const parser = createParser({ tokenizer });
 *
 * parser.parse('en-US', 'Hello, <b>{name}</b>!');
 *
 * @param options Parser options.
 * @group Parser
 */
export function createParser(options: ParserOptions): Parser {
  return {
    parse(locale, text) {
      return parseMessage(locale, text, options);
    },
  };
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
export function parseMessage(locale: string, text: string, options: ParserOptions): MessageNode {
  const { tokenizer, decodeText } = options;

  const messageNode = createMessageNode(locale);

  let parentNode: AnyNode = messageNode;

  const tokenCallback: TokenCallback = (token, startIndex, endIndex) => {
    switch (token) {
      case 'TEXT':
        let value = text.substring(startIndex, endIndex);

        if (decodeText !== undefined) {
          try {
            value = decodeText(value);
          } catch (error) {
            throw new ParserError('Cannot decode text: ' + error, text, startIndex, endIndex);
          }
        }

        (parentNode as ParentNode).childNodes = pushChild(
          parentNode,
          (parentNode as ParentNode).childNodes,
          setSourceLocation(createTextNode(value), startIndex, endIndex)
        );
        break;

      case 'START_TAG_NAME':
        (parentNode as ParentNode).childNodes = pushChild(
          parentNode,
          (parentNode as ParentNode).childNodes,
          (parentNode = setSourceLocation(
            createElementNode(text.substring(startIndex, endIndex)),
            startIndex,
            endIndex
          ))
        );
        break;

      case 'START_TAG_CLOSING':
        break;

      case 'START_TAG_SELF_CLOSING':
      case 'END_TAG_NAME':
      case 'ATTRIBUTE_CLOSING':
      case 'ARGUMENT_CLOSING':
      case 'CATEGORY_CLOSING':
        parentNode = (parentNode as ElementNode | AttributeNode | ArgumentNode | CategoryNode).parentNode!;
        break;

      case 'ATTRIBUTE_NAME':
        (parentNode as ElementNode).attributeNodes = pushChild(
          parentNode,
          (parentNode as ElementNode).attributeNodes,
          (parentNode = setSourceLocation(
            createAttributeNode(text.substring(startIndex, endIndex)),
            startIndex,
            endIndex
          ))
        );
        break;

      case 'ARGUMENT_NAME':
        (parentNode as ParentNode).childNodes = pushChild(
          parentNode,
          (parentNode as ParentNode).childNodes,
          (parentNode = setSourceLocation(
            createArgumentNode(text.substring(startIndex, endIndex)),
            startIndex,
            endIndex
          ))
        );
        break;

      case 'ARGUMENT_TYPE':
        ((parentNode as ArgumentNode).typeNode = setSourceLocation(
          createLiteralNode(text.substring(startIndex, endIndex)),
          startIndex,
          endIndex
        )).parentNode = parentNode as ArgumentNode;
        break;

      case 'ARGUMENT_STYLE':
        ((parentNode as ArgumentNode).styleNode = setSourceLocation(
          createLiteralNode(text.substring(startIndex, endIndex)),
          startIndex,
          endIndex
        )).parentNode = parentNode as ArgumentNode;
        break;

      case 'CATEGORY_NAME':
        (parentNode as ArgumentNode).categoryNodes = pushChild(
          parentNode,
          (parentNode as ArgumentNode).categoryNodes,
          (parentNode = setSourceLocation(
            createCategoryNode(text.substring(startIndex, endIndex)),
            startIndex,
            endIndex
          ))
        );
        break;

      case 'OPTION_NAME':
        (parentNode as ArgumentNode).optionNodes = pushChild(
          parentNode,
          (parentNode as ArgumentNode).optionNodes,
          (parentNode = setSourceLocation(createOptionNode(text.substring(startIndex, endIndex)), startIndex, endIndex))
        );
        break;

      case 'OPTION_VALUE':
        parentNode = (((parentNode as OptionNode).valueNode = setSourceLocation(
          createLiteralNode(text.substring(startIndex, endIndex)),
          startIndex,
          endIndex
        )).parentNode = parentNode as OptionNode).parentNode!;
        break;

      case 'OCTOTHORPE':
        (parentNode as ParentNode).childNodes = pushChild(
          parentNode,
          (parentNode as ParentNode).childNodes,
          setSourceLocation(createOctothorpeNode(), startIndex, endIndex)
        );
        break;
    }
  };

  tokenizer.tokenize(text, tokenCallback);

  return messageNode;
}

function pushChild<T extends AnyNode>(parentNode: AnyNode, childNodes: T[] | null, node: T): T[] {
  node.parentNode = parentNode as typeof node.parentNode;

  if (childNodes === null) {
    return [node];
  }

  childNodes.push(node);

  return childNodes;
}

function setSourceLocation<T extends SourceLocation>(node: T, startIndex: number, endIndex: number): T {
  node.startIndex = startIndex;
  node.endIndex = endIndex;

  return node;
}
