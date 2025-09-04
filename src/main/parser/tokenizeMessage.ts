/**
 * The error thrown by a parser if a {@link text} substring is malformed.
 */
export class ParserError extends SyntaxError {
  constructor(
    message: string,

    /**
     * The text where an error was detected.
     */
    public text: string,

    /**
     * The index of the first char in {@link text} where an error was detected, inclusive.
     */
    public startIndex = -1,

    /**
     * The index of the last char in {@link text} where an error was detected, exclusive.
     */
    public endIndex = -1
  ) {
    super(message);
  }
}

/**
 * @internal
 */
ParserError.prototype.name = 'ParserError';

/**
 * A token that can be read from a text.
 *
 * @group Tokenizer
 */
export type Token =
  | 'TEXT'
  | 'XML_OPENING_TAG_NAME'
  | 'XML_OPENING_TAG_END'
  | 'XML_OPENING_TAG_SELF_CLOSE'
  | 'XML_CLOSING_TAG_NAME'
  | 'XML_ATTRIBUTE_NAME'
  | 'XML_ATTRIBUTE_END'
  | 'ICU_ARGUMENT_NAME'
  | 'ICU_ARGUMENT_END'
  | 'ICU_ARGUMENT_TYPE'
  | 'ICU_ARGUMENT_STYLE'
  | 'ICU_CATEGORY_NAME'
  | 'ICU_CATEGORY_END'
  | 'ICU_OPTION_NAME'
  | 'ICU_OPTION_VALUE'
  | 'ICU_OCTOTHORPE';

/**
 * A callback that is invoked when a token is read from a text.
 *
 * @param token The token that was read.
 * @param startIndex The start index of the first meaningful token char, inclusive.
 * @param endIndex The end index of the last meaningful token char, exclusive.
 * @group Tokenizer
 */
export type TokenCallback = (token: Token, startIndex: number, endIndex: number) => void;

/**
 * Options of {@link tokenizeMessage}.
 */
export interface ResolvedTokenizerOptions {
  /**
   * Reads a tag name as a unique hash code.
   *
   * By default, tags are read in a case-sensitive way.
   *
   * @param text The string containing a tag.
   * @param startIndex The tag name start index.
   * @param endIndex The tag name end index.
   */
  readTag?: (text: string, startIndex: number, endIndex: number) => number;

  /**
   * The list of tags that can't have any contents (since there's no end tag, no content can be put between the start
   * tag and the end tag).
   *
   * @example
   * ['link', 'meta']
   * @see [HTML5 Void Elements](https://www.w3.org/TR/2010/WD-html5-20101019/syntax.html#void-elements)
   */
  voidTags?: Set<number>;

  /**
   * The list of tags which content is interpreted as plain text.
   *
   * @example
   * ['script', 'style']
   * @see [HTML5 Raw Text Elements](https://www.w3.org/TR/2010/WD-html5-20101019/syntax.html#raw-text-elements)
   */
  rawTextTags?: Set<number>;

  /**
   * The map from a tag (A) to a list of tags that must be closed if tag (A) is opened.
   *
   * For example, in HTML `p`, `table`, and many other tags follow this semantics:
   * ```html
   * <p>foo<h1>bar → <p>foo</p><h1>bar</h1>
   * ```
   *
   * To achieve this behavior, set this option to:
   * ```ts
   * { h1: ['p'] }
   * ```
   */
  implicitlyClosedTags?: Map<number, Set<number>>;

  /**
   * The list of tags for which an opening tag is inserted if an orphan closing tag is met. Otherwise,
   * a {@link ParserError} is thrown.
   *
   * You can ignore orphan closing tags with {@link isOrphanClosingTagsIgnored}.
   *
   * For example, in HTML `p` and `br` tags follow this semantics:
   * ```html
   * </p>  → <p></p>
   * </br> → <br/>
   * ```
   *
   * @see {@link isOrphanClosingTagsIgnored}
   */
  implicitlyOpenedTags?: Set<number>;

  /**
   * If `true` then self-closing tags are recognized, otherwise they are treated as opening tags.
   *
   * @default false
   */
  isSelfClosingTagsRecognized?: boolean;

  /**
   * If `true` then unbalanced opening tags are forcefully closed. Otherwise, a {@link ParserError} is thrown.
   *
   * Use in conjunctions with {@link isOrphanClosingTagsIgnored}.
   *
   * ```html
   * <a><b></a></b> → <a><b></b></a></b>
   * ```
   *
   * @default false
   */
  isUnbalancedTagsImplicitlyClosed?: boolean;

  /**
   * If `true` then closing tags that dont have a corresponding closing tag are ignored. Otherwise,
   * a {@link ParserError} is thrown.
   *
   * Use in conjunctions with {@link isUnbalancedTagsImplicitlyClosed}.
   *
   * ```html
   * <a></b></a> → <a></a>
   * ```
   *
   * @default false
   */
  isOrphanClosingTagsIgnored?: boolean;

  /**
   * If `true` then arguments are parsed inside {@link rawTextTags}.
   *
   * @default false
   */
  isRawTextInterpolated?: boolean;
}

/**
 * Reads tokens from text and returns them by invoking a callback.
 *
 * Tokens are _guaranteed_ to be returned in correct order. Missing tokens are inserted to restore the correct order if
 * needed.
 *
 * @example
 * tokenizeMessage(
 *   'Hello, <b>{name}</b>!',
 *   (token, startIndex, endIndex) => {
 *     // Handle token here
 *   },
 *   resolveTokenizerOptions(htmlTokenizerOptions)
 * );
 *
 * @param text The text string to read tokens from.
 * @param callback The callback that is invoked when a token is read.
 * @param options Tokenizer options prepared by {@link resolveTokenizerOptions}.
 */
export function tokenizeMessage(text: string, callback: TokenCallback, options: ResolvedTokenizerOptions = {}): void {
  const {
    readTag = getCaseSensitiveHashCode,
    voidTags,
    implicitlyClosedTags,
    implicitlyOpenedTags,
    isUnbalancedTagsImplicitlyClosed = false,
    isOrphanClosingTagsIgnored = false,
  } = options;

  const tagStack = [0, 0, 0, 0, 0, 0, 0, 0];

  let tagStackCursor = -1;
  let canEOF = true;

  const tokenCallback: TokenCallback = (token, startIndex, endIndex) => {
    canEOF = false;

    switch (token) {
      case TOKEN_XML_OPENING_TAG_NAME:
        const openingTag = readTag(text, startIndex, endIndex);

        if (implicitlyClosedTags !== undefined) {
          tagStackCursor = insertClosingTags(
            implicitlyClosedTags.get(openingTag),
            tagStack,
            tagStackCursor,
            callback,
            startIndex - 1
          );
        }

        callback(TOKEN_XML_OPENING_TAG_NAME, startIndex, endIndex);
        tagStack[++tagStackCursor] = openingTag;
        break;

      case TOKEN_XML_OPENING_TAG_END:
        canEOF = true;

        callback(TOKEN_XML_OPENING_TAG_END, startIndex, endIndex);

        if (voidTags !== undefined && voidTags.has(tagStack[tagStackCursor])) {
          callback(TOKEN_XML_CLOSING_TAG_NAME, endIndex, endIndex);
          --tagStackCursor;
        }
        break;

      case TOKEN_XML_OPENING_TAG_SELF_CLOSE:
        callback(TOKEN_XML_OPENING_TAG_SELF_CLOSE, startIndex, endIndex);
        --tagStackCursor;
        break;

      case TOKEN_XML_CLOSING_TAG_NAME:
        canEOF = true;

        const closingTag = readTag(text, startIndex, endIndex);

        if (tagStackCursor !== -1 && tagStack[tagStackCursor] === closingTag) {
          callback(TOKEN_XML_CLOSING_TAG_NAME, startIndex, endIndex);
          --tagStackCursor;
          break;
        }

        const closingTagStartIndex = startIndex - 2;

        let index = tagStackCursor;

        while (index !== -1 && tagStack[index] !== ISOLATED_BLOCK_MARKER && tagStack[index] !== closingTag) {
          --index;
        }

        // Found an opening tag
        if (index !== -1) {
          if (!isUnbalancedTagsImplicitlyClosed && index !== tagStackCursor) {
            throw new ParserError('Missing closing tag.', text, closingTagStartIndex);
          }
          // Insert unbalanced closing tags
          while (index < tagStackCursor) {
            callback(TOKEN_XML_CLOSING_TAG_NAME, closingTagStartIndex, closingTagStartIndex);
            --tagStackCursor;
          }

          callback(TOKEN_XML_CLOSING_TAG_NAME, startIndex, endIndex);
          --tagStackCursor;
          break;
        }

        if (implicitlyOpenedTags === undefined || !implicitlyOpenedTags.has(closingTag)) {
          if (!isOrphanClosingTagsIgnored) {
            throw new ParserError('Orphan closing tag.', text, startIndex, endIndex);
          }
          break;
        }

        if (implicitlyClosedTags !== undefined) {
          tagStackCursor = insertClosingTags(
            implicitlyClosedTags.get(closingTag),
            tagStack,
            tagStackCursor,
            callback,
            closingTagStartIndex
          );
        }

        callback(TOKEN_XML_OPENING_TAG_NAME, startIndex, endIndex);
        callback(TOKEN_XML_OPENING_TAG_END, endIndex, endIndex + 1);
        callback(TOKEN_XML_CLOSING_TAG_NAME, startIndex, endIndex);
        break;

      case TOKEN_ICU_CATEGORY_NAME:
        callback(token, startIndex, endIndex);
        tagStack[++tagStackCursor] = ISOLATED_BLOCK_MARKER;
        break;

      case TOKEN_ICU_CATEGORY_END:
        callback(token, startIndex, endIndex);
        --tagStackCursor;
        break;

      case TOKEN_TEXT:
      case TOKEN_ICU_ARGUMENT_END:
        canEOF = true;

        callback(token, startIndex, endIndex);
        break;

      default:
        callback(token, startIndex, endIndex);
        break;
    }
  };

  readTokens(text, tokenCallback, options);

  if (tagStackCursor === -1) {
    return;
  }

  if (!canEOF) {
    throw new ParserError('Unexpected end of message.', text, text.length);
  }

  if (!isUnbalancedTagsImplicitlyClosed) {
    throw new ParserError('Missing closing tag.', text, text.length);
  }

  while (tagStackCursor !== -1) {
    callback(TOKEN_XML_CLOSING_TAG_NAME, text.length, text.length);

    --tagStackCursor;
  }
}

function insertClosingTags(
  tagsToClose: Set<number> | undefined,
  tagStack: number[],
  tagStackCursor: number,
  callback: TokenCallback,
  insertionIndex: number
): number {
  if (tagsToClose === undefined) {
    return tagStackCursor;
  }

  let index = tagStack.lastIndexOf(ISOLATED_BLOCK_MARKER);

  if (index === -1) {
    index = 0;
  }

  while (index <= tagStackCursor && !tagsToClose.has(tagStack[index])) {
    ++index;
  }

  while (index <= tagStackCursor) {
    callback(TOKEN_XML_CLOSING_TAG_NAME, insertionIndex, insertionIndex);
    --tagStackCursor;
  }

  return tagStackCursor;
}

const ISOLATED_BLOCK_MARKER = -1;

const SCOPE_TEXT = 0;
const SCOPE_XML_OPENING_TAG = 1;
const SCOPE_XML_ATTRIBUTE = 2;
const SCOPE_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE = 3;
const SCOPE_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE = 4;
const SCOPE_XML_UNQUOTED_ATTRIBUTE_VALUE = 5;
const SCOPE_ICU_ARGUMENT = 6;
const SCOPE_ICU_CATEGORY = 7;

const TOKEN_TEXT = 'TEXT';
const TOKEN_XML_OPENING_TAG_NAME = 'XML_OPENING_TAG_NAME';
const TOKEN_XML_OPENING_TAG_END = 'XML_OPENING_TAG_END';
const TOKEN_XML_OPENING_TAG_SELF_CLOSE = 'XML_OPENING_TAG_SELF_CLOSE';
const TOKEN_XML_CLOSING_TAG_NAME = 'XML_CLOSING_TAG_NAME';
const TOKEN_XML_ATTRIBUTE_NAME = 'XML_ATTRIBUTE_NAME';
const TOKEN_XML_ATTRIBUTE_END = 'XML_ATTRIBUTE_END';
const TOKEN_ICU_ARGUMENT_NAME = 'ICU_ARGUMENT_NAME';
const TOKEN_ICU_ARGUMENT_END = 'ICU_ARGUMENT_END';
const TOKEN_ICU_ARGUMENT_TYPE = 'ICU_ARGUMENT_TYPE';
const TOKEN_ICU_ARGUMENT_STYLE = 'ICU_ARGUMENT_STYLE';
const TOKEN_ICU_CATEGORY_NAME = 'ICU_CATEGORY_NAME';
const TOKEN_ICU_CATEGORY_END = 'ICU_CATEGORY_END';
const TOKEN_ICU_OPTION_NAME = 'ICU_OPTION_NAME';
const TOKEN_ICU_OPTION_VALUE = 'ICU_OPTION_VALUE';
const TOKEN_ICU_OCTOTHORPE = 'ICU_OCTOTHORPE';

export interface TokenReaderOptions {
  readTag?: (text: string, startIndex: number, endIndex: number) => number;
  rawTextTags?: Set<number>;
  isSelfClosingTagsRecognized?: boolean;
  isRawTextInterpolated?: boolean;
}

/**
 * Reads tokens from the text and returns tokens by invoking a callback.
 *
 * Tokens returned in the same order they are listed in text.
 */
export function readTokens(text: string, callback: TokenCallback, options: TokenReaderOptions): void {
  const {
    readTag = getCaseSensitiveHashCode,
    rawTextTags,
    isSelfClosingTagsRecognized = false,
    isRawTextInterpolated = false,
  } = options;

  let scope = SCOPE_TEXT;
  let openedRawTextTag = 0;
  let latestRawTextTag = 0;
  let textStartIndex = 0;
  let scopeStackCursor = 0;

  const scopeStack = [scope, 0, 0, 0, 0, 0, 0, 0];

  for (let index = 0, nextIndex = 0; nextIndex < text.length; index = nextIndex) {
    const charCode = text.charCodeAt(nextIndex);

    // End of a quoted attribute value
    if (
      (charCode === /* " */ 34 && scopeStack.lastIndexOf(SCOPE_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE) !== -1) ||
      (charCode === /* ' */ 39 && scopeStack.lastIndexOf(SCOPE_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE) !== -1)
    ) {
      if (scopeStack.lastIndexOf(SCOPE_ICU_ARGUMENT) !== -1) {
        throw new ParserError('Unterminated argument.', text, index);
      }

      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      ++nextIndex;

      callback(TOKEN_XML_ATTRIBUTE_END, index, nextIndex);

      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      nextIndex = skipSpaces(text, nextIndex);
      continue;
    }

    // End of an unquoted attribute value
    if (
      scope === SCOPE_XML_UNQUOTED_ATTRIBUTE_VALUE &&
      (charCode === /* / */ 47 || charCode === /* > */ 62 || isSpaceChar(charCode))
    ) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      callback(TOKEN_XML_ATTRIBUTE_END, index, index);

      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];

      // Fallthrough: the non-attribute character should be processed
    }

    // XML markup
    if (
      charCode === /* < */ 60 &&
      (scope === SCOPE_TEXT ||
        (scope === SCOPE_ICU_CATEGORY &&
          // Tags are ignored inside attributes
          scopeStack.lastIndexOf(SCOPE_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE) === -1 &&
          scopeStack.lastIndexOf(SCOPE_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE) === -1))
    ) {
      // Skip "<"
      let tagNameStartIndex = ++nextIndex;

      const nextCharCode = getCharCodeAt(text, nextIndex);

      // Skip XML comments, XML processing instructions, DTD and CDATA sections
      if (latestRawTextTag === 0 && (nextCharCode === /* ! */ 33 || nextCharCode === /* ? */ 63)) {
        if (textStartIndex !== index) {
          callback(TOKEN_TEXT, textStartIndex, index);
        }

        // XML comment
        if (
          nextCharCode === /* ! */ 33 &&
          getCharCodeAt(text, nextIndex + 1) === /* - */ 45 &&
          getCharCodeAt(text, nextIndex + 2) === /* - */ 45
        ) {
          // Skip "!--"
          nextIndex = text.indexOf('-->', nextIndex + 3);

          textStartIndex = nextIndex = nextIndex === -1 ? text.length : nextIndex + 3;
          continue;
        }

        // Processing instruction or DTD (browsers treat them as comments in document fragments)
        // Skip "!"
        nextIndex = text.indexOf('>', nextIndex + 1);

        textStartIndex = nextIndex = nextIndex === -1 ? text.length : nextIndex + 1;
        continue;
      }

      // Closing tag
      if (nextCharCode === /* / */ 47) {
        // Skip "/"
        tagNameStartIndex = ++nextIndex;

        nextIndex = readXMLName(text, tagNameStartIndex);

        if (
          // Not a tag
          tagNameStartIndex === nextIndex ||
          // Doesn't match the current raw text tag
          (latestRawTextTag !== 0 && latestRawTextTag !== readTag(text, tagNameStartIndex, nextIndex))
        ) {
          continue;
        }

        latestRawTextTag = 0;

        if (textStartIndex !== index) {
          callback(TOKEN_TEXT, textStartIndex, index);
        }

        callback(TOKEN_XML_CLOSING_TAG_NAME, tagNameStartIndex, nextIndex);

        // Skip unparsable characters after the tag name
        nextIndex = text.indexOf('>', nextIndex);

        if (nextIndex === -1) {
          // Unterminated closing tag
          textStartIndex = nextIndex = text.length;
          continue;
        }

        // Skip ">"
        textStartIndex = ++nextIndex;
        continue;
      }

      // Start of an opening tag

      if (latestRawTextTag !== 0) {
        // Opening tags are ignored inside raw text tags
        ++nextIndex;
        continue;
      }

      nextIndex = readXMLName(text, nextIndex);

      if (tagNameStartIndex === nextIndex) {
        // No opening tag name, ignore "<"
        continue;
      }

      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      callback(TOKEN_XML_OPENING_TAG_NAME, tagNameStartIndex, nextIndex);

      if (
        rawTextTags === undefined ||
        !rawTextTags.has((openedRawTextTag = readTag(text, tagNameStartIndex, nextIndex)))
      ) {
        openedRawTextTag = 0;
      }

      scope = scopeStack[++scopeStackCursor] = SCOPE_XML_OPENING_TAG;
      nextIndex = skipSpaces(text, nextIndex);
      textStartIndex = nextIndex;
      continue;
    }

    // End of an opening XML tag
    if (charCode === /* > */ 62 && scope === SCOPE_XML_OPENING_TAG) {
      ++nextIndex;

      callback(TOKEN_XML_OPENING_TAG_END, index, nextIndex);

      // Start of a raw text tag content
      latestRawTextTag = openedRawTextTag;

      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex;
      continue;
    }

    // Self-closing XML tag
    if (
      isSelfClosingTagsRecognized &&
      charCode === /* / */ 47 &&
      scope === SCOPE_XML_OPENING_TAG &&
      getCharCodeAt(text, index + 1) === /* > */ 62
    ) {
      nextIndex += 2;

      callback(TOKEN_XML_OPENING_TAG_SELF_CLOSE, index, nextIndex);

      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex;
      continue;
    }

    // Treat "/" as space in XML opening tag
    if (charCode === /* / */ 47 && scope === SCOPE_XML_OPENING_TAG) {
      ++nextIndex;
      continue;
    }

    // Start of an attribute
    if (scope === SCOPE_XML_OPENING_TAG && isXMLAttributeNameChar(charCode)) {
      nextIndex = readChars(text, index + 1, isXMLAttributeNameChar);

      callback(TOKEN_XML_ATTRIBUTE_NAME, index, nextIndex);

      scope = scopeStack[++scopeStackCursor] = SCOPE_XML_ATTRIBUTE;

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) !== /* = */ 61) {
        // No attribute value
        callback(TOKEN_XML_ATTRIBUTE_END, nextIndex, nextIndex);
        scopeStack[scopeStackCursor] = 0;
        scope = scopeStack[--scopeStackCursor];
        continue;
      }

      nextIndex = skipSpaces(text, ++nextIndex);

      const quoteCharCode = getCharCodeAt(text, nextIndex);

      if (quoteCharCode === /* " */ 34) {
        // Double-quoted value
        scope = scopeStack[scopeStackCursor] = SCOPE_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE;
        textStartIndex = ++nextIndex;
        continue;
      }

      if (quoteCharCode === /* ' */ 39) {
        // Single-quoted value
        scope = scopeStack[scopeStackCursor] = SCOPE_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE;
        textStartIndex = ++nextIndex;
        continue;
      }

      // Unquoted value
      scope = scopeStack[scopeStackCursor] = SCOPE_XML_UNQUOTED_ATTRIBUTE_VALUE;
      textStartIndex = nextIndex;
      continue;
    }

    // Disable arguments parsing in raw text tags
    if (latestRawTextTag !== 0 && !isRawTextInterpolated) {
      ++nextIndex;
      continue;
    }

    // Start of an argument
    if (
      charCode === /* { */ 123 &&
      (scope === SCOPE_TEXT ||
        scope === SCOPE_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE ||
        scope === SCOPE_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE ||
        scope === SCOPE_ICU_CATEGORY)
    ) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      nextIndex = skipSpaces(text, index + 1);

      const argumentNameStartIndex = nextIndex;

      nextIndex = readChars(text, nextIndex, isICUNameChar);

      if (argumentNameStartIndex === nextIndex) {
        throw new ParserError('An argument name cannot be empty.', text, nextIndex);
      }

      callback(TOKEN_ICU_ARGUMENT_NAME, argumentNameStartIndex, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      // End of an argument
      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);
        textStartIndex = nextIndex;
        continue;
      }

      if (getCharCodeAt(text, nextIndex) !== /* , */ 44) {
        throw new ParserError(
          'Expected an argument type separated by a comma (",") or the end of the argument ("}").',
          text,
          nextIndex
        );
      }

      // Start of an argument type

      nextIndex = skipSpaces(text, nextIndex + 1);

      const argumentTypeStartIndex = nextIndex;

      nextIndex = readChars(text, argumentTypeStartIndex, isICUNameChar);

      if (argumentTypeStartIndex === nextIndex) {
        // An argument type is empty

        if (getCharCodeAt(text, nextIndex) !== /* } */ 125) {
          throw new ParserError('An argument type cannot be empty.', text, nextIndex);
        }

        // End of an argument
        callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);
        textStartIndex = nextIndex;
        continue;
      }

      callback(TOKEN_ICU_ARGUMENT_TYPE, argumentTypeStartIndex, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      // End of an argument and type
      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);
        textStartIndex = nextIndex;
        continue;
      }

      if (getCharCodeAt(text, nextIndex) !== /* , */ 44) {
        throw new ParserError(
          'Expected an argument style, category name, or option name separated by a comma (",") or the end of the argument ("}").',
          text,
          nextIndex
        );
      }

      // Start of an argument style

      nextIndex = skipSpaces(text, nextIndex + 1);

      const argumentStyleStartIndex = nextIndex;

      nextIndex = readChars(text, nextIndex, isICUNameChar);

      if (argumentStyleStartIndex === nextIndex) {
        // An argument style is empty

        if (getCharCodeAt(text, nextIndex) !== /* } */ 125) {
          throw new ParserError('Expected an argument style, category name or option name.', text, nextIndex);
        }

        // End of an argument and type
        callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);
        textStartIndex = nextIndex;
        continue;
      }

      const argumentStyleEndIndex = nextIndex;

      nextIndex = skipSpaces(text, nextIndex);

      // End of an argument, type, and style
      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback(TOKEN_ICU_ARGUMENT_STYLE, argumentStyleStartIndex, argumentStyleEndIndex);
        callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);

        textStartIndex = nextIndex;
        continue;
      }

      // Revert to reading category name and option name in a loop
      scope = scopeStack[++scopeStackCursor] = SCOPE_ICU_ARGUMENT;

      textStartIndex = nextIndex = argumentStyleStartIndex;
      continue;
    }

    // End of an argument
    if (charCode === /* } */ 125 && scope === SCOPE_ICU_ARGUMENT) {
      callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);
      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex;
      continue;
    }

    // End of an category
    if (charCode === /* } */ 125 && scope === SCOPE_ICU_CATEGORY) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      callback(TOKEN_ICU_CATEGORY_END, nextIndex, ++nextIndex);

      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex = skipSpaces(text, nextIndex);
      continue;
    }

    // An octothorpe
    if (charCode === /* # */ 35 && scopeStack.lastIndexOf(SCOPE_ICU_CATEGORY) !== -1) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      textStartIndex = ++nextIndex;

      callback(TOKEN_ICU_OCTOTHORPE, index, nextIndex);
      continue;
    }

    // An category name or option
    if (scope === SCOPE_ICU_ARGUMENT) {
      if (!isICUNameChar(charCode)) {
        throw new ParserError('Expected an category name or option name.', text, nextIndex);
      }

      nextIndex = readChars(text, index + 1, isICUNameChar);

      const optionNameEndIndex = nextIndex;

      nextIndex = skipSpaces(text, nextIndex);

      // Start of an category
      if (getCharCodeAt(text, nextIndex) === /* { */ 123) {
        callback(TOKEN_ICU_CATEGORY_NAME, index, optionNameEndIndex);

        scope = scopeStack[++scopeStackCursor] = SCOPE_ICU_CATEGORY;
        textStartIndex = ++nextIndex;
        continue;
      }

      if (getCharCodeAt(text, nextIndex) !== /* = */ 61) {
        throw new ParserError(
          'Expected an argument category start ("{") or an option value start ("=").',
          text,
          nextIndex
        );
      }

      // An option
      callback(TOKEN_ICU_OPTION_NAME, index, optionNameEndIndex);

      // Skip spaces after "="
      nextIndex = skipSpaces(text, nextIndex + 1);

      let optionValueStartIndex = nextIndex;
      let optionValueEndIndex = -1;

      const quoteCharCode = getCharCodeAt(text, optionValueStartIndex);

      if (quoteCharCode !== /* " */ 34 && quoteCharCode !== /* ' */ 39) {
        // Unquoted option value
        optionValueEndIndex = readChars(text, optionValueStartIndex, isICUNameChar);
        nextIndex = optionValueEndIndex;
      } else if (
        (quoteCharCode !== /* " */ 34 || scopeStack.lastIndexOf(SCOPE_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE) === -1) &&
        (quoteCharCode !== /* ' */ 39 || scopeStack.lastIndexOf(SCOPE_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE) === -1)
      ) {
        // Double or single quoted option value
        optionValueEndIndex = text.indexOf(String.fromCharCode(quoteCharCode), ++optionValueStartIndex);
        nextIndex = optionValueEndIndex + 1;
      }

      if (optionValueEndIndex === -1) {
        throw new ParserError('Unterminated argument.', text, optionValueStartIndex);
      }

      callback(TOKEN_ICU_OPTION_VALUE, optionValueStartIndex, optionValueEndIndex);

      // Skip spaces after option value
      textStartIndex = nextIndex = skipSpaces(text, nextIndex);
      continue;
    }

    // Plain text
    ++nextIndex;
  }

  if (textStartIndex !== text.length) {
    callback(TOKEN_TEXT, textStartIndex, text.length);
  }
}

export function getCaseInsensitiveHashCode(text: string, startIndex: number, endIndex: number): number {
  let hashCode = 0;

  for (let i = startIndex; i < endIndex; ++i) {
    const charCode = text.charCodeAt(i);
    hashCode = (hashCode << 5) - hashCode + (charCode < 65 || charCode > 90 ? charCode : charCode + 32);
  }

  return hashCode;
}

/**
 * Returns case-sensitive djb2 hash of a substring.
 */
export function getCaseSensitiveHashCode(text: string, startIndex: number, endIndex: number): number {
  let hashCode = 0;

  for (let i = startIndex; i < endIndex; ++i) {
    hashCode = (hashCode << 5) - hashCode + text.charCodeAt(i);
  }

  return hashCode;
}

// https://www.w3.org/TR/xml/#NT-Name
function readXMLName(text: string, index: number): number {
  return isXMLNameStartChar(getCharCodeAt(text, index)) ? readChars(text, index + 1, isXMLNameChar) : index;
}

// https://www.w3.org/TR/xml/#NT-NameStartChar
function isXMLNameStartChar(charCode: number): boolean {
  return (
    (charCode >= /* a */ 97 && charCode <= /* z */ 122) ||
    (charCode >= /* A */ 65 && charCode <= /* Z */ 90) ||
    charCode === /* _ */ 95 ||
    charCode === /* : */ 58 ||
    (charCode >= 0x000c0 && charCode <= 0x000d6) ||
    (charCode >= 0x000d8 && charCode <= 0x000f6) ||
    (charCode >= 0x000f8 && charCode <= 0x002ff) ||
    (charCode >= 0x00370 && charCode <= 0x0037d) ||
    (charCode >= 0x0037f && charCode <= 0x01fff) ||
    (charCode >= 0x0200c && charCode <= 0x0200d) ||
    (charCode >= 0x02070 && charCode <= 0x0218f) ||
    (charCode >= 0x02c00 && charCode <= 0x02fef) ||
    (charCode >= 0x03001 && charCode <= 0x0d7ff) ||
    (charCode >= 0x0f900 && charCode <= 0x0fdcf) ||
    (charCode >= 0x0fdf0 && charCode <= 0x0fffd) ||
    (charCode >= 0x10000 && charCode <= 0xeffff)
  );
}

// https://www.w3.org/TR/xml/#NT-NameChar
function isXMLNameChar(charCode: number): boolean {
  return !(charCode === /* / */ 47 || charCode === /* > */ 62 || isSpaceChar(charCode));
}

function readChars(text: string, index: number, predicate: (charCode: number) => boolean): number {
  while (index < text.length && predicate(text.charCodeAt(index))) {
    ++index;
  }
  return index;
}

function skipSpaces(text: string, index: number): number {
  return readChars(text, index, isSpaceChar);
}

function getCharCodeAt(text: string, index: number): number {
  return index < text.length ? text.charCodeAt(index) : -1;
}

// https://www.w3.org/TR/xml/#NT-S
function isSpaceChar(charCode: number): boolean {
  return charCode == /* \s */ 32 || charCode === /* \n */ 10 || charCode === /* \t */ 9 || charCode === /* \r */ 13;
}

function isXMLAttributeNameChar(charCode: number): boolean {
  return !(charCode === /* > */ 62 || charCode === /* = */ 61 || isSpaceChar(charCode));
}

function isICUNameChar(charCode: number): boolean {
  return !(
    charCode === /* , */ 44 ||
    charCode === /* { */ 123 ||
    charCode === /* } */ 125 ||
    charCode === /* = */ 61 ||
    charCode === /* " */ 34 ||
    charCode === /* ' */ 39 ||
    isSpaceChar(charCode)
  );
}
