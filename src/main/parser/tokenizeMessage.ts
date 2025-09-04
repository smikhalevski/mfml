/**
 * The error thrown by a parser if a text substring is malformed.
 *
 * @group Parser
 */
export class ParserError extends SyntaxError {
  constructor(
    message: string,
    /**
     * The text where an error was detected.
     */
    public text: string,
    /**
     * The index of the first char in text where an error was detected, inclusive.
     */
    public startIndex = -1,
    /**
     * The index of the last char in text where an error was detected, exclusive.
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
  | 'START_TAG_NAME'
  | 'START_TAG_CLOSING'
  | 'START_TAG_SELF_CLOSING'
  | 'END_TAG_NAME'
  | 'ATTRIBUTE_NAME'
  | 'ATTRIBUTE_CLOSING'
  | 'ARGUMENT_NAME'
  | 'ARGUMENT_CLOSING'
  | 'ARGUMENT_TYPE'
  | 'ARGUMENT_STYLE'
  | 'CATEGORY_NAME'
  | 'CATEGORY_CLOSING'
  | 'OPTION_NAME'
  | 'OPTION_VALUE'
  | 'OCTOTHORPE';

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
export interface ResolvedTokenizerOptions extends ReadTokensOptions {
  voidTags?: Set<number>;
  implicitlyClosedTags?: Map<number, Set<number>>;
  implicitlyOpenedTags?: Set<number>;
  isUnbalancedStartTagsImplicitlyClosed?: boolean;
  isUnbalancedEndTagsIgnored?: boolean;
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
    isUnbalancedStartTagsImplicitlyClosed = false,
    isUnbalancedEndTagsIgnored = false,
  } = options;

  const tagStack = [0, 0, 0, 0, 0, 0, 0, 0];

  let tagStackCursor = -1;

  const tokenCallback: TokenCallback = (token, startIndex, endIndex) => {
    switch (token) {
      case TOKEN_START_TAG_NAME:
        const startTag = readTag(text, startIndex, endIndex);

        if (implicitlyClosedTags !== undefined) {
          tagStackCursor = insertEndTags(
            implicitlyClosedTags.get(startTag),
            tagStack,
            tagStackCursor,
            callback,
            startIndex - 1
          );
        }

        callback(TOKEN_START_TAG_NAME, startIndex, endIndex);
        tagStack[++tagStackCursor] = startTag;
        break;

      case TOKEN_START_TAG_CLOSING:
        callback(TOKEN_START_TAG_CLOSING, startIndex, endIndex);

        if (voidTags !== undefined && voidTags.has(tagStack[tagStackCursor])) {
          callback(TOKEN_END_TAG_NAME, endIndex, endIndex);
          --tagStackCursor;
        }
        break;

      case TOKEN_START_TAG_SELF_CLOSING:
        callback(TOKEN_START_TAG_SELF_CLOSING, startIndex, endIndex);
        --tagStackCursor;
        break;

      case TOKEN_END_TAG_NAME:
        const endTag = readTag(text, startIndex, endIndex);

        if (tagStackCursor !== -1 && tagStack[tagStackCursor] === endTag) {
          callback(TOKEN_END_TAG_NAME, startIndex, endIndex);
          --tagStackCursor;
          break;
        }

        const endTagStartIndex = startIndex - 2;

        let index = tagStackCursor;

        while (index !== -1 && tagStack[index] !== CATEGORY_TAG && tagStack[index] !== endTag) {
          --index;
        }

        // Found a start tag
        if (index !== -1) {
          if (!isUnbalancedStartTagsImplicitlyClosed && index !== tagStackCursor) {
            throw new ParserError('Missing end tag.', text, endTagStartIndex);
          }

          // Insert unbalanced end tags before the opened start tag
          while (index < tagStackCursor) {
            callback(TOKEN_END_TAG_NAME, endTagStartIndex, endTagStartIndex);
            --tagStackCursor;
          }

          callback(TOKEN_END_TAG_NAME, startIndex, endIndex);
          --tagStackCursor;
          break;
        }

        if (implicitlyOpenedTags === undefined || !implicitlyOpenedTags.has(endTag)) {
          if (!isUnbalancedEndTagsIgnored) {
            throw new ParserError('Orphan end tag.', text, startIndex, endIndex);
          }
          break;
        }

        if (implicitlyClosedTags !== undefined) {
          tagStackCursor = insertEndTags(
            implicitlyClosedTags.get(endTag),
            tagStack,
            tagStackCursor,
            callback,
            endTagStartIndex
          );
        }

        callback(TOKEN_START_TAG_NAME, startIndex, endIndex);
        callback(TOKEN_START_TAG_CLOSING, endIndex, endIndex + 1);
        callback(TOKEN_END_TAG_NAME, startIndex, endIndex);
        break;

      case TOKEN_CATEGORY_NAME:
        callback(token, startIndex, endIndex);
        tagStack[++tagStackCursor] = CATEGORY_TAG;
        break;

      case TOKEN_CATEGORY_CLOSING:
        if (!isUnbalancedStartTagsImplicitlyClosed && tagStack[tagStackCursor] !== CATEGORY_TAG) {
          throw new ParserError('Missing end tag.', text, startIndex);
        }

        // Insert unbalanced end tags before the category closing
        while (tagStack[tagStackCursor--] !== CATEGORY_TAG) {
          callback(TOKEN_END_TAG_NAME, startIndex, startIndex);
        }

        callback(token, startIndex, endIndex);
        break;

      case TOKEN_TEXT:
      case TOKEN_ARGUMENT_CLOSING:
        callback(token, startIndex, endIndex);
        break;

      default:
        callback(token, startIndex, endIndex);
        break;
    }
  };

  readTokens(text, tokenCallback, options);

  while (tagStackCursor !== -1) {
    if (tagStack[tagStackCursor] === CATEGORY_TAG) {
      throw new ParserError('Unterminated argument.', text, text.length);
    }
    if (!isUnbalancedStartTagsImplicitlyClosed) {
      throw new ParserError('Missing end tag.', text, text.length);
    }

    callback(TOKEN_END_TAG_NAME, text.length, text.length);

    --tagStackCursor;
  }
}

function insertEndTags(
  tagsToClose: Set<number> | undefined,
  tagStack: number[],
  tagStackCursor: number,
  callback: TokenCallback,
  insertionIndex: number
): number {
  if (tagsToClose === undefined) {
    return tagStackCursor;
  }

  let index = tagStack.lastIndexOf(CATEGORY_TAG);

  if (index === -1) {
    index = 0;
  }

  while (index <= tagStackCursor && !tagsToClose.has(tagStack[index])) {
    ++index;
  }

  while (index <= tagStackCursor) {
    callback(TOKEN_END_TAG_NAME, insertionIndex, insertionIndex);
    --tagStackCursor;
  }

  return tagStackCursor;
}

const CATEGORY_TAG = -1;

const SCOPE_TEXT = 0;
const SCOPE_START_TAG = 1;
const SCOPE_ATTRIBUTE = 2;
const SCOPE_DOUBLE_QUOTED_ATTRIBUTE_VALUE = 3;
const SCOPE_SINGLE_QUOTED_ATTRIBUTE_VALUE = 4;
const SCOPE_UNQUOTED_ATTRIBUTE_VALUE = 5;
const SCOPE_ARGUMENT = 6;
const SCOPE_CATEGORY = 7;

const TOKEN_TEXT = 'TEXT';
const TOKEN_START_TAG_NAME = 'START_TAG_NAME';
const TOKEN_START_TAG_CLOSING = 'START_TAG_CLOSING';
const TOKEN_START_TAG_SELF_CLOSING = 'START_TAG_SELF_CLOSING';
const TOKEN_END_TAG_NAME = 'END_TAG_NAME';
const TOKEN_ATTRIBUTE_NAME = 'ATTRIBUTE_NAME';
const TOKEN_ATTRIBUTE_CLOSING = 'ATTRIBUTE_CLOSING';
const TOKEN_ARGUMENT_NAME = 'ARGUMENT_NAME';
const TOKEN_ARGUMENT_CLOSING = 'ARGUMENT_CLOSING';
const TOKEN_ARGUMENT_TYPE = 'ARGUMENT_TYPE';
const TOKEN_ARGUMENT_STYLE = 'ARGUMENT_STYLE';
const TOKEN_CATEGORY_NAME = 'CATEGORY_NAME';
const TOKEN_CATEGORY_CLOSING = 'CATEGORY_CLOSING';
const TOKEN_OPTION_NAME = 'OPTION_NAME';
const TOKEN_OPTION_VALUE = 'OPTION_VALUE';
const TOKEN_OCTOTHORPE = 'OCTOTHORPE';

export interface ReadTokensOptions {
  readTag?: (text: string, startIndex: number, endIndex: number) => number;
  rawTextTags?: Set<number>;
  isSelfClosingTagsRecognized?: boolean;
  isRawTextInterpolated?: boolean;
  isOctothorpeRecognized?: boolean;
}

/**
 * Reads tokens from the text and returns tokens by invoking a callback.
 *
 * Tokens returned in the same order they are listed in text.
 */
export function readTokens(text: string, callback: TokenCallback, options: ReadTokensOptions): void {
  const {
    readTag = getCaseSensitiveHashCode,
    rawTextTags,
    isSelfClosingTagsRecognized = false,
    isRawTextInterpolated = false,
    isOctothorpeRecognized = false,
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
      (charCode === /* " */ 34 && scopeStack.lastIndexOf(SCOPE_DOUBLE_QUOTED_ATTRIBUTE_VALUE) !== -1) ||
      (charCode === /* ' */ 39 && scopeStack.lastIndexOf(SCOPE_SINGLE_QUOTED_ATTRIBUTE_VALUE) !== -1)
    ) {
      if (scope === SCOPE_ARGUMENT || scope === SCOPE_CATEGORY) {
        throw new ParserError('Unterminated argument.', text, index);
      }

      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      ++nextIndex;

      callback(TOKEN_ATTRIBUTE_CLOSING, index, nextIndex);

      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      nextIndex = skipSpaces(text, nextIndex);
      continue;
    }

    // End of an unquoted attribute value
    if (
      scope === SCOPE_UNQUOTED_ATTRIBUTE_VALUE &&
      (charCode === /* / */ 47 || charCode === /* > */ 62 || isSpaceChar(charCode))
    ) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      callback(TOKEN_ATTRIBUTE_CLOSING, index, index);

      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];

      // Fallthrough: the non-attribute character should be processed
    }

    // XML markup
    if (
      charCode === /* < */ 60 &&
      (scope === SCOPE_TEXT ||
        (scope === SCOPE_CATEGORY &&
          // Tags are ignored inside attributes
          scopeStack.lastIndexOf(SCOPE_DOUBLE_QUOTED_ATTRIBUTE_VALUE) === -1 &&
          scopeStack.lastIndexOf(SCOPE_SINGLE_QUOTED_ATTRIBUTE_VALUE) === -1))
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

      // End tag
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

        callback(TOKEN_END_TAG_NAME, tagNameStartIndex, nextIndex);

        // Skip unparsable characters after the tag name
        nextIndex = text.indexOf('>', nextIndex);

        if (nextIndex === -1) {
          // Unterminated end tag
          textStartIndex = nextIndex = text.length;
          continue;
        }

        // Skip ">"
        textStartIndex = ++nextIndex;
        continue;
      }

      // Start tag

      if (latestRawTextTag !== 0) {
        // Start tags are ignored inside raw text tags
        ++nextIndex;
        continue;
      }

      nextIndex = readXMLName(text, nextIndex);

      if (tagNameStartIndex === nextIndex) {
        // No start tag name, ignore "<"
        continue;
      }

      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      callback(TOKEN_START_TAG_NAME, tagNameStartIndex, nextIndex);

      if (
        rawTextTags === undefined ||
        !rawTextTags.has((openedRawTextTag = readTag(text, tagNameStartIndex, nextIndex)))
      ) {
        openedRawTextTag = 0;
      }

      scope = scopeStack[++scopeStackCursor] = SCOPE_START_TAG;
      nextIndex = skipSpaces(text, nextIndex);
      textStartIndex = nextIndex;
      continue;
    }

    // End of a start tag
    if (charCode === /* > */ 62 && scope === SCOPE_START_TAG) {
      ++nextIndex;

      callback(TOKEN_START_TAG_CLOSING, index, nextIndex);

      // Start of a raw text tag content
      latestRawTextTag = openedRawTextTag;

      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex;
      continue;
    }

    // Self-closing tag
    if (
      isSelfClosingTagsRecognized &&
      charCode === /* / */ 47 &&
      scope === SCOPE_START_TAG &&
      getCharCodeAt(text, index + 1) === /* > */ 62
    ) {
      nextIndex += 2;

      callback(TOKEN_START_TAG_SELF_CLOSING, index, nextIndex);

      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex;
      continue;
    }

    // Treat "/" as space in start tag
    if (charCode === /* / */ 47 && scope === SCOPE_START_TAG) {
      ++nextIndex;
      continue;
    }

    // Start of an attribute
    if (scope === SCOPE_START_TAG && isXMLAttributeNameChar(charCode)) {
      nextIndex = readChars(text, index + 1, isXMLAttributeNameChar);

      callback(TOKEN_ATTRIBUTE_NAME, index, nextIndex);

      scope = scopeStack[++scopeStackCursor] = SCOPE_ATTRIBUTE;

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) !== /* = */ 61) {
        // No attribute value
        callback(TOKEN_ATTRIBUTE_CLOSING, nextIndex, nextIndex);
        scopeStack[scopeStackCursor] = 0;
        scope = scopeStack[--scopeStackCursor];
        continue;
      }

      nextIndex = skipSpaces(text, ++nextIndex);

      const quoteCharCode = getCharCodeAt(text, nextIndex);

      if (quoteCharCode === /* " */ 34) {
        // Double-quoted value
        scope = scopeStack[scopeStackCursor] = SCOPE_DOUBLE_QUOTED_ATTRIBUTE_VALUE;
        textStartIndex = ++nextIndex;
        continue;
      }

      if (quoteCharCode === /* ' */ 39) {
        // Single-quoted value
        scope = scopeStack[scopeStackCursor] = SCOPE_SINGLE_QUOTED_ATTRIBUTE_VALUE;
        textStartIndex = ++nextIndex;
        continue;
      }

      // Unquoted value
      scope = scopeStack[scopeStackCursor] = SCOPE_UNQUOTED_ATTRIBUTE_VALUE;
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
        scope === SCOPE_DOUBLE_QUOTED_ATTRIBUTE_VALUE ||
        scope === SCOPE_SINGLE_QUOTED_ATTRIBUTE_VALUE ||
        scope === SCOPE_CATEGORY)
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

      callback(TOKEN_ARGUMENT_NAME, argumentNameStartIndex, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      // End of an argument
      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback(TOKEN_ARGUMENT_CLOSING, nextIndex, ++nextIndex);
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
        callback(TOKEN_ARGUMENT_CLOSING, nextIndex, ++nextIndex);
        textStartIndex = nextIndex;
        continue;
      }

      callback(TOKEN_ARGUMENT_TYPE, argumentTypeStartIndex, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      // End of an argument and type
      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback(TOKEN_ARGUMENT_CLOSING, nextIndex, ++nextIndex);
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
        callback(TOKEN_ARGUMENT_CLOSING, nextIndex, ++nextIndex);
        textStartIndex = nextIndex;
        continue;
      }

      const argumentStyleEndIndex = nextIndex;

      nextIndex = skipSpaces(text, nextIndex);

      // End of an argument, type, and style
      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback(TOKEN_ARGUMENT_STYLE, argumentStyleStartIndex, argumentStyleEndIndex);
        callback(TOKEN_ARGUMENT_CLOSING, nextIndex, ++nextIndex);

        textStartIndex = nextIndex;
        continue;
      }

      // Revert to reading category name and option name in a loop
      scope = scopeStack[++scopeStackCursor] = SCOPE_ARGUMENT;

      textStartIndex = nextIndex = argumentStyleStartIndex;
      continue;
    }

    // End of an argument
    if (charCode === /* } */ 125 && scope === SCOPE_ARGUMENT) {
      callback(TOKEN_ARGUMENT_CLOSING, nextIndex, ++nextIndex);
      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex;
      continue;
    }

    // End of a category
    if (charCode === /* } */ 125 && scope === SCOPE_CATEGORY) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      callback(TOKEN_CATEGORY_CLOSING, nextIndex, ++nextIndex);

      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex = skipSpaces(text, nextIndex);
      continue;
    }

    // An octothorpe
    if (isOctothorpeRecognized && charCode === /* # */ 35 && scopeStack.lastIndexOf(SCOPE_CATEGORY) !== -1) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      textStartIndex = ++nextIndex;

      callback(TOKEN_OCTOTHORPE, index, nextIndex);
      continue;
    }

    // A category name or option
    if (scope === SCOPE_ARGUMENT) {
      if (!isICUNameChar(charCode)) {
        throw new ParserError('Expected a category name or an option name.', text, nextIndex);
      }

      nextIndex = readChars(text, index + 1, isICUNameChar);

      const optionNameEndIndex = nextIndex;

      nextIndex = skipSpaces(text, nextIndex);

      // Start of a category
      if (getCharCodeAt(text, nextIndex) === /* { */ 123) {
        callback(TOKEN_CATEGORY_NAME, index, optionNameEndIndex);

        scope = scopeStack[++scopeStackCursor] = SCOPE_CATEGORY;
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
      callback(TOKEN_OPTION_NAME, index, optionNameEndIndex);

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
        (quoteCharCode !== /* " */ 34 || scopeStack.lastIndexOf(SCOPE_DOUBLE_QUOTED_ATTRIBUTE_VALUE) === -1) &&
        (quoteCharCode !== /* ' */ 39 || scopeStack.lastIndexOf(SCOPE_SINGLE_QUOTED_ATTRIBUTE_VALUE) === -1)
      ) {
        // Double or single quoted option value
        optionValueEndIndex = text.indexOf(String.fromCharCode(quoteCharCode), ++optionValueStartIndex);
        nextIndex = optionValueEndIndex + 1;
      }

      if (optionValueEndIndex === -1) {
        throw new ParserError('Unterminated argument.', text, optionValueStartIndex);
      }

      callback(TOKEN_OPTION_VALUE, optionValueStartIndex, optionValueEndIndex);

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
