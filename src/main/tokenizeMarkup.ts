/**
 * A token that can be read from a text.
 */
export type Token =
  | 'TEXT'
  | 'XML_OPENING_TAG_START'
  | 'XML_OPENING_TAG_END'
  | 'XML_OPENING_TAG_SELF_CLOSE'
  | 'XML_CLOSING_TAG'
  | 'XML_ATTRIBUTE_START'
  | 'XML_ATTRIBUTE_END'
  | 'ICU_ARGUMENT_START'
  | 'ICU_ARGUMENT_END'
  | 'ICU_ARGUMENT_TYPE'
  | 'ICU_ARGUMENT_STYLE'
  | 'ICU_CATEGORY_START'
  | 'ICU_CATEGORY_END'
  | 'ICU_OCTOTHORPE';

/**
 * A callback that is invoked when a token is read from a text.
 *
 * @param token The token that was read.
 * @param startIndex The start index of the first meaningful token char (inclusive).
 * @param endIndex The end index of the last meaningful token char (exclusive).
 */
export type TokenCallback = (token: Token, startIndex: number, endIndex: number) => void;

/**
 * Options of {@link tokenizeMarkup}.
 */
export interface TokenizeMarkupOptions {
  /**
   * Reads a tag name as a unique hash code.
   *
   * @param text The string containing a tag.
   * @param startIndex The tag name start index.
   * @param endIndex The tag name end index.
   */
  readTag?: (text: string, startIndex: number, endIndex: number) => number;

  /**
   * The list of tags that cannot have any content and are always closed after being opening tag.
   */
  voidTags?: Set<number>;

  /**
   * The list CDATA tags. The content of these tags is interpreted as plain text. Ex. `script`, `style`, etc.
   */
  cdataTags?: Set<number>;

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
   * a {@link SyntaxError} is thrown.
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
   * If `true` then unbalanced opening tags are forcefully closed. Otherwise, a {@link SyntaxError} is thrown.
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
   * a {@link SyntaxError} is thrown.
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

  isICUInCDATARecognized?: boolean;
}

/**
 * Reads tokens from text and returns the by invoking a callback.
 *
 * Tokens are guaranteed to be returned in correct order. Missing tokens are inserted and `startIndex === endIndex`
 * for such tokens.
 *
 * This method doesn't guarantee that contents of returned tokens is consistent. For example, ICU argument type may not
 * properly reflect the consequent ICU category tokens.
 *
 * @param text The text string to read tokens from.
 * @param callback The callback that is invoked when a token is read.
 * @param options Tokenization options.
 */
export function tokenizeMarkup(text: string, callback: TokenCallback, options: TokenizeMarkupOptions = {}): void {
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
      case TOKEN_XML_OPENING_TAG_START:
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

        callback(TOKEN_XML_OPENING_TAG_START, startIndex, endIndex);
        tagStack[++tagStackCursor] = openingTag;
        break;

      case TOKEN_XML_OPENING_TAG_END:
        canEOF = true;

        callback(TOKEN_XML_OPENING_TAG_END, startIndex, endIndex);

        if (voidTags !== undefined && voidTags.has(tagStack[tagStackCursor])) {
          callback(TOKEN_XML_CLOSING_TAG, endIndex, endIndex);
          --tagStackCursor;
        }
        break;

      case TOKEN_XML_OPENING_TAG_SELF_CLOSE:
        callback(TOKEN_XML_OPENING_TAG_SELF_CLOSE, startIndex, endIndex);
        --tagStackCursor;
        break;

      case TOKEN_XML_CLOSING_TAG:
        canEOF = true;

        const closingTag = readTag(text, startIndex, endIndex);

        if (tagStackCursor !== -1 && tagStack[tagStackCursor] === closingTag) {
          callback(TOKEN_XML_CLOSING_TAG, startIndex, endIndex);
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
            throw new SyntaxError('Missing closing tag at ' + closingTagStartIndex);
          }
          // Insert unbalanced closing tags
          while (index < tagStackCursor) {
            callback(TOKEN_XML_CLOSING_TAG, closingTagStartIndex, closingTagStartIndex);
            --tagStackCursor;
          }

          callback(TOKEN_XML_CLOSING_TAG, startIndex, endIndex);
          --tagStackCursor;
          break;
        }

        if (implicitlyOpenedTags === undefined || !implicitlyOpenedTags.has(closingTag)) {
          if (!isOrphanClosingTagsIgnored) {
            throw new SyntaxError('Orphan closing tag at ' + closingTagStartIndex);
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

        callback(TOKEN_XML_OPENING_TAG_START, closingTagStartIndex, closingTagStartIndex);
        callback(TOKEN_XML_OPENING_TAG_END, closingTagStartIndex, closingTagStartIndex);
        callback(TOKEN_XML_CLOSING_TAG, startIndex, endIndex);
        break;

      case TOKEN_ICU_CATEGORY_START:
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
    throw new SyntaxError('Unexpected EOF');
  }

  if (!isUnbalancedTagsImplicitlyClosed) {
    throw new SyntaxError('Missing closing tag at ' + text.length);
  }

  while (tagStackCursor !== -1) {
    callback(TOKEN_XML_CLOSING_TAG, text.length, text.length);

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
    callback(TOKEN_XML_CLOSING_TAG, insertionIndex, insertionIndex);
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

const REGION_ROOT = 0;
const REGION_ATTRIBUTE = 1;
const REGION_CDATA_TAG = 2;

const TOKEN_TEXT = 'TEXT';
const TOKEN_XML_OPENING_TAG_START = 'XML_OPENING_TAG_START';
const TOKEN_XML_OPENING_TAG_END = 'XML_OPENING_TAG_END';
const TOKEN_XML_OPENING_TAG_SELF_CLOSE = 'XML_OPENING_TAG_SELF_CLOSE';
const TOKEN_XML_CLOSING_TAG = 'XML_CLOSING_TAG';
const TOKEN_XML_ATTRIBUTE_START = 'XML_ATTRIBUTE_START';
const TOKEN_XML_ATTRIBUTE_END = 'XML_ATTRIBUTE_END';
const TOKEN_ICU_ARGUMENT_START = 'ICU_ARGUMENT_START';
const TOKEN_ICU_ARGUMENT_END = 'ICU_ARGUMENT_END';
const TOKEN_ICU_ARGUMENT_TYPE = 'ICU_ARGUMENT_TYPE';
const TOKEN_ICU_ARGUMENT_STYLE = 'ICU_ARGUMENT_STYLE';
const TOKEN_ICU_CATEGORY_START = 'ICU_CATEGORY_START';
const TOKEN_ICU_CATEGORY_END = 'ICU_CATEGORY_END';
const TOKEN_ICU_OCTOTHORPE = 'ICU_OCTOTHORPE';

const ICU_ERROR_MESSAGE = 'Unexpected ICU syntax at ';

export interface ReadTokensOptions {
  readTag?: (text: string, startIndex: number, endIndex: number) => number;
  cdataTags?: Set<number>;
  isSelfClosingTagsRecognized?: boolean;
  isICUInCDATARecognized?: boolean;
}

/**
 * Reads tokens from the text and returns tokens by invoking a callback.
 *
 * Tokens returned in the same order they are listed in text.
 */
export function readTokens(text: string, callback: TokenCallback, options: ReadTokensOptions): void {
  const {
    readTag = getCaseSensitiveHashCode,
    cdataTags,
    isSelfClosingTagsRecognized = false,
    isICUInCDATARecognized = false,
  } = options;

  let region = REGION_ROOT;
  let scope = SCOPE_TEXT;
  let cdataTag = 0;
  let textStartIndex = 0;
  let scopeStackCursor = 0;

  const scopeStack = [scope, 0, 0, 0, 0, 0, 0, 0];

  for (let index = 0, nextIndex = 0; nextIndex < text.length; index = nextIndex) {
    const charCode = text.charCodeAt(nextIndex);

    // End of a quoted XML attribute value
    if (
      (charCode === /* " */ 34 && scope === SCOPE_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE) ||
      (charCode === /* ' */ 39 && scope === SCOPE_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE)
    ) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      ++nextIndex;

      callback(TOKEN_XML_ATTRIBUTE_END, index, nextIndex);

      region = REGION_ROOT;
      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      nextIndex = skipSpaces(text, nextIndex);
      continue;
    }

    // End of an unquoted XML attribute value
    if (
      scope === SCOPE_XML_UNQUOTED_ATTRIBUTE_VALUE &&
      (charCode === /* / */ 47 || charCode === /* > */ 62 || isSpaceChar(charCode))
    ) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      callback(TOKEN_XML_ATTRIBUTE_END, index, index);

      region = REGION_ROOT;
      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];

      // Fallthrough: the non-attribute character should be processed
    }

    // XML tags
    if (
      charCode === /* < */ 60 &&
      (((region === REGION_ROOT || region === REGION_CDATA_TAG) && scope === SCOPE_TEXT) ||
        (region === REGION_ROOT && scope === SCOPE_ICU_CATEGORY))
    ) {
      // Skip "<"
      let tagNameStartIndex = ++nextIndex;

      const nextCharCode = getCharCodeAt(text, nextIndex);

      // Skip XML comments, XML processing instructions and DTD
      if (region === REGION_ROOT && (nextCharCode === /* ! */ 33 || nextCharCode === /* ? */ 63)) {
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

        nextIndex = readXMLTagName(text, tagNameStartIndex);

        if (
          // Not a tag
          tagNameStartIndex === nextIndex ||
          // Doesn't match the current CDATA tag
          (region === REGION_CDATA_TAG && (cdataTag === 0 || cdataTag !== readTag(text, tagNameStartIndex, nextIndex)))
        ) {
          continue;
        }

        cdataTag = 0;
        region = REGION_ROOT;

        if (textStartIndex !== index) {
          callback(TOKEN_TEXT, textStartIndex, index);
        }

        callback(TOKEN_XML_CLOSING_TAG, tagNameStartIndex, nextIndex);

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

      if (region !== REGION_ROOT) {
        ++nextIndex;
        continue;
      }

      nextIndex = readXMLTagName(text, nextIndex);

      if (tagNameStartIndex === nextIndex) {
        // No opening tag name, ignore "<"
        continue;
      }

      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      callback(TOKEN_XML_OPENING_TAG_START, tagNameStartIndex, nextIndex);

      if (cdataTags === undefined || !cdataTags.has((cdataTag = readTag(text, tagNameStartIndex, nextIndex)))) {
        cdataTag = 0;
      }

      scope = scopeStack[++scopeStackCursor] = SCOPE_XML_OPENING_TAG;
      nextIndex = skipSpaces(text, nextIndex);
      textStartIndex = nextIndex;
      continue;
    }

    // End of opening XML tag
    if (charCode === /* > */ 62 && scope === SCOPE_XML_OPENING_TAG) {
      ++nextIndex;

      callback(TOKEN_XML_OPENING_TAG_END, index, nextIndex);

      // Start of a CDATA tag
      if (cdataTag !== 0) {
        region = REGION_CDATA_TAG;
      }

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

    // Start of an XML attribute
    if (scope === SCOPE_XML_OPENING_TAG && isXMLAttributeNameChar(charCode)) {
      nextIndex = readChars(text, index + 1, isXMLAttributeNameChar);

      callback(TOKEN_XML_ATTRIBUTE_START, index, nextIndex);

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
        region = REGION_ATTRIBUTE;
        scope = scopeStack[scopeStackCursor] = SCOPE_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE;
        textStartIndex = ++nextIndex;
        continue;
      }

      if (quoteCharCode === /* ' */ 39) {
        // Single-quoted value
        region = REGION_ATTRIBUTE;
        scope = scopeStack[scopeStackCursor] = SCOPE_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE;
        textStartIndex = ++nextIndex;
        continue;
      }

      // Unquoted value
      region = REGION_ATTRIBUTE;
      scope = scopeStack[scopeStackCursor] = SCOPE_XML_UNQUOTED_ATTRIBUTE_VALUE;
      textStartIndex = nextIndex;
      continue;
    }

    // ICU is plain text in CDATA sections
    if (!isICUInCDATARecognized && region === REGION_CDATA_TAG) {
      ++nextIndex;
      continue;
    }

    // Start of an ICU argument
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
        throw new SyntaxError(ICU_ERROR_MESSAGE + nextIndex);
      }

      callback(TOKEN_ICU_ARGUMENT_START, argumentNameStartIndex, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);
        textStartIndex = nextIndex;
        continue;
      }

      if (getCharCodeAt(text, nextIndex) !== /* , */ 44) {
        throw new SyntaxError(ICU_ERROR_MESSAGE + nextIndex);
      }

      // ICU argument type

      nextIndex = skipSpaces(text, nextIndex + 1);

      const argumentTypeStartIndex = nextIndex;

      nextIndex = readChars(text, argumentTypeStartIndex, isICUNameChar);

      if (argumentTypeStartIndex === nextIndex) {
        throw new SyntaxError(ICU_ERROR_MESSAGE + nextIndex);
      }

      callback(TOKEN_ICU_ARGUMENT_TYPE, argumentTypeStartIndex, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);
        textStartIndex = nextIndex;
        continue;
      }

      if (getCharCodeAt(text, nextIndex) !== /* , */ 44) {
        throw new SyntaxError(ICU_ERROR_MESSAGE + nextIndex);
      }

      // ICU argument style or select

      nextIndex = skipSpaces(text, nextIndex + 1);

      const argumentStyleStartIndex = nextIndex;

      nextIndex = readChars(text, nextIndex, isICUNameChar);

      if (argumentStyleStartIndex === nextIndex) {
        throw new SyntaxError(ICU_ERROR_MESSAGE + nextIndex);
      }

      const argumentStyleEndIndex = nextIndex;

      nextIndex = skipSpaces(text, nextIndex);

      // ICU argument style
      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback(TOKEN_ICU_ARGUMENT_STYLE, argumentStyleStartIndex, argumentStyleEndIndex);
        callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);

        textStartIndex = nextIndex;
        continue;
      }

      // ICU select
      if (getCharCodeAt(text, nextIndex) === /* { */ 123) {
        callback(TOKEN_ICU_CATEGORY_START, argumentStyleStartIndex, argumentStyleEndIndex);

        scopeStack[++scopeStackCursor] = SCOPE_ICU_ARGUMENT;
        scope = scopeStack[++scopeStackCursor] = SCOPE_ICU_CATEGORY;
        textStartIndex = ++nextIndex;
        continue;
      }

      throw new SyntaxError(ICU_ERROR_MESSAGE + nextIndex);
    }

    // End of an ICU argument
    if (charCode === /* } */ 125 && scope === SCOPE_ICU_ARGUMENT) {
      callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);
      scopeStack[scopeStackCursor] = 0;
      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex;
      continue;
    }

    // End of an ICU category
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

    // ICU octothorpe
    if (charCode === /* # */ 35 && scopeStack.indexOf(SCOPE_ICU_CATEGORY) !== -1) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      textStartIndex = ++nextIndex;

      callback(TOKEN_ICU_OCTOTHORPE, index, nextIndex);
      continue;
    }

    // Start of an ICU category
    if (scope === SCOPE_ICU_ARGUMENT) {
      if (!isICUNameChar(charCode)) {
        throw new SyntaxError(ICU_ERROR_MESSAGE + index);
      }

      nextIndex = readChars(text, index + 1, isICUNameChar);

      callback(TOKEN_ICU_CATEGORY_START, index, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) !== /* { */ 123) {
        throw new SyntaxError(ICU_ERROR_MESSAGE + nextIndex);
      }

      scope = scopeStack[++scopeStackCursor] = SCOPE_ICU_CATEGORY;
      textStartIndex = ++nextIndex;
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

export function getCaseSensitiveHashCode(text: string, startIndex: number, endIndex: number): number {
  let hashCode = 0;

  for (let i = startIndex; i < endIndex; ++i) {
    hashCode = (hashCode << 5) - hashCode + text.charCodeAt(i);
  }

  return hashCode;
}

function readXMLTagName(text: string, index: number): number {
  return isXMLTagNameStartChar(getCharCodeAt(text, index)) ? readChars(text, index + 1, isXMLTagNameChar) : index;
}

// https://www.w3.org/TR/xml/#NT-NameStartChar
function isXMLTagNameStartChar(charCode: number): boolean {
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

function isXMLTagNameChar(charCode: number): boolean {
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
  return !(charCode === /* , */ 44 || charCode === /* { */ 123 || charCode === /* } */ 125 || isSpaceChar(charCode));
}
