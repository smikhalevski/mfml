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
  | 'ICU_CASE_START'
  | 'ICU_CASE_END'
  | 'ICU_OCTOTHORPE';

export type TokenCallback = (token: Token, startIndex: number, endIndex: number) => void;

export interface TokenizeOptions extends ReadTokensOptions {
  getHashCode: (text: string, startIndex: number, endIndex: number) => number;
  voidTags: Set<number>;
  autoClosingTags: Map<number, Set<number>>;
  autoOpeningTags: Set<number>;
}

export function tokenize(text: string, callback: TokenCallback, options: TokenizeOptions): void {
  const { getHashCode, voidTags, autoClosingTags, autoOpeningTags } = options;

  const tagStack = [0, 0, 0, 0, 0, 0, 0, 0];

  let tagStackCursor = -1;

  const readTokensCallback: TokenCallback = (token, startIndex, endIndex) => {
    switch (token) {
      case TOKEN_XML_OPENING_TAG_START:
        const openingTag = getHashCode(text, startIndex, endIndex);

        tagStackCursor = insertAutoClosingTags(
          autoClosingTags.get(openingTag),
          tagStack,
          tagStackCursor,
          callback,
          startIndex - 1
        );

        callback(TOKEN_XML_OPENING_TAG_START, startIndex, endIndex);
        tagStack[++tagStackCursor] = openingTag;
        break;

      case TOKEN_XML_OPENING_TAG_END:
        callback(TOKEN_XML_OPENING_TAG_END, startIndex, endIndex);

        if (voidTags.has(tagStack[tagStackCursor])) {
          callback(TOKEN_XML_CLOSING_TAG, endIndex, endIndex);
          --tagStackCursor;
        }
        break;

      case TOKEN_XML_OPENING_TAG_SELF_CLOSE:
        callback(TOKEN_XML_OPENING_TAG_SELF_CLOSE, startIndex, endIndex);
        --tagStackCursor;
        break;

      case TOKEN_XML_CLOSING_TAG:
        const closingTag = getHashCode(text, startIndex, endIndex);

        let index = tagStackCursor;

        while (index !== -1 && tagStack[index] !== ISOLATED_BLOCK_MARKER && tagStack[index] !== closingTag) {
          --index;
        }

        // Found an opening tag
        if (index !== -1) {
          // Insert unbalanced closing tags
          while (index < tagStackCursor) {
            callback(TOKEN_XML_CLOSING_TAG, startIndex - 2, startIndex - 2);
            --tagStackCursor;
          }

          callback(TOKEN_XML_CLOSING_TAG, startIndex, endIndex);
          --tagStackCursor;
          break;
        }

        if (!autoOpeningTags.has(closingTag)) {
          // Ignore orphan closing tag
          break;
        }

        tagStackCursor = insertAutoClosingTags(
          autoClosingTags.get(closingTag),
          tagStack,
          tagStackCursor,
          callback,
          startIndex - 2
        );

        callback(TOKEN_XML_OPENING_TAG_START, startIndex, endIndex);
        callback(TOKEN_XML_OPENING_TAG_SELF_CLOSE, endIndex, endIndex);
        break;

      case TOKEN_ICU_CASE_START:
        tagStack[++tagStackCursor] = ISOLATED_BLOCK_MARKER;
        break;

      case TOKEN_ICU_CASE_END:
        --tagStackCursor;
        break;

      default:
        callback(token, startIndex, endIndex);
        break;
    }
  };

  readTokens(text, readTokensCallback, options);
}

function insertAutoClosingTags(
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
const SCOPE_XML_UNQUOTED_ATTRIBUTE_VALUE = 3;
const SCOPE_JSX_CURLY_BRACES_ATTRIBUTE_VALUE = 4;
const SCOPE_ICU_ARGUMENT = 5;
const SCOPE_ICU_CASE = 6;

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
const TOKEN_ICU_CASE_START = 'ICU_CASE_START';
const TOKEN_ICU_CASE_END = 'ICU_CASE_END';
const TOKEN_ICU_OCTOTHORPE = 'ICU_OCTOTHORPE';

const ICU_ERROR_MESSAGE = 'Unexpected ICU syntax at ';

export interface ReadTokensOptions {
  escapeChar?: string;
  enableJSXAttributes?: boolean;
  enableSelfClosing?: boolean;
}

export function readTokens(text: string, callback: TokenCallback, options: ReadTokensOptions): void {
  const { escapeChar = '\\', enableJSXAttributes = false, enableSelfClosing = false } = options;

  const escapeCharCode = getCharCodeAt(escapeChar, 0);

  let scope = SCOPE_TEXT;

  const scopeStack = [scope, 0, 0, 0, 0, 0, 0, 0];

  let scopeStackCursor = 0;

  let textStartIndex = 0;

  for (let index = 0, nextIndex = 0; nextIndex < text.length; index = nextIndex) {
    const charCode = text.charCodeAt(nextIndex);

    // Escape char
    if (
      charCode === escapeCharCode &&
      (scope === SCOPE_TEXT || scope === SCOPE_ICU_CASE || scope === SCOPE_JSX_CURLY_BRACES_ATTRIBUTE_VALUE)
    ) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      // Ignore escape char
      textStartIndex = ++nextIndex;

      // Skip next char
      ++nextIndex;
      continue;
    }

    // End of unquoted XML attribute value
    if (
      scope === SCOPE_XML_UNQUOTED_ATTRIBUTE_VALUE &&
      (charCode === /* / */ 47 || charCode === /* > */ 62 || isSpaceChar(charCode))
    ) {
      scope = scopeStack[--scopeStackCursor];

      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      callback(TOKEN_XML_ATTRIBUTE_END, index, index);
    }

    // XML tags
    if (charCode === /* < */ 60 && scope !== SCOPE_XML_OPENING_TAG && scope !== SCOPE_XML_UNQUOTED_ATTRIBUTE_VALUE) {
      let tagNameStartIndex = ++nextIndex;

      // Closing tag

      if (getCharCodeAt(text, nextIndex) === /* / */ 47) {
        // Skip "/"
        tagNameStartIndex = ++nextIndex;

        nextIndex = readXMLTagName(text, tagNameStartIndex);

        if (tagNameStartIndex === nextIndex) {
          continue;
        }

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

      // Opening tag

      nextIndex = readXMLTagName(text, nextIndex);

      if (tagNameStartIndex === nextIndex) {
        // No opening tag name, ignore "<"
        continue;
      }

      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      callback(TOKEN_XML_OPENING_TAG_START, tagNameStartIndex, nextIndex);

      scope = scopeStack[++scopeStackCursor] = SCOPE_XML_OPENING_TAG;

      nextIndex = skipSpaces(text, nextIndex);
      textStartIndex = nextIndex;
      continue;
    }

    // End of opening XML tag
    if (charCode === /* > */ 62 && scope === SCOPE_XML_OPENING_TAG) {
      ++nextIndex;

      callback(TOKEN_XML_OPENING_TAG_END, index, nextIndex);

      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex;
      continue;
    }

    // Self-closing XML tags
    if (
      enableSelfClosing &&
      charCode === /* / */ 47 &&
      scope === SCOPE_XML_OPENING_TAG &&
      getCharCodeAt(text, index + 1) === /* > */ 62
    ) {
      nextIndex += 2;

      callback(TOKEN_XML_OPENING_TAG_SELF_CLOSE, index, nextIndex);

      scope = scopeStack[--scopeStackCursor];
      textStartIndex = nextIndex;
      continue;
    }

    // Treat "/" as space in XML opening tag
    if (charCode === /* / */ 47 && scope === SCOPE_XML_OPENING_TAG) {
      ++nextIndex;
      continue;
    }

    // JSX attributes
    if (enableJSXAttributes && charCode === /* } */ 125 && scope === SCOPE_JSX_CURLY_BRACES_ATTRIBUTE_VALUE) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      ++nextIndex;

      callback(TOKEN_XML_ATTRIBUTE_END, index, nextIndex);

      scope = scopeStack[--scopeStackCursor];
      nextIndex = skipSpaces(text, nextIndex);
      continue;
    }

    // XML attribute
    if (scope === SCOPE_XML_OPENING_TAG && isXMLAttributeNameChar(charCode)) {
      nextIndex = readChars(text, index + 1, isXMLAttributeNameChar);

      callback(TOKEN_XML_ATTRIBUTE_START, index, nextIndex);

      scope = scopeStack[++scopeStackCursor] = SCOPE_XML_ATTRIBUTE;

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) !== /* = */ 61) {
        // No attribute value
        callback(TOKEN_XML_ATTRIBUTE_END, nextIndex, nextIndex);
        scope = scopeStack[--scopeStackCursor];
        continue;
      }

      nextIndex = skipSpaces(text, ++nextIndex);

      const quoteCharCode = getCharCodeAt(text, nextIndex);

      // Quoted attribute value
      if (quoteCharCode === /* " */ 34 || quoteCharCode === /* ' */ 39) {
        // Skip opening quote
        textStartIndex = ++nextIndex;

        // Lookup closing quote
        nextIndex = text.indexOf(quoteCharCode === /* " */ 34 ? '"' : "'", nextIndex);

        if (nextIndex === -1) {
          // No closing quote
          nextIndex = text.length;
          continue;
        }

        if (textStartIndex !== nextIndex) {
          callback(TOKEN_TEXT, textStartIndex, nextIndex);
        }

        callback(TOKEN_XML_ATTRIBUTE_END, nextIndex, nextIndex + 1);

        scope = scopeStack[--scopeStackCursor];

        textStartIndex = nextIndex = skipSpaces(text, nextIndex + 1);
        continue;
      }

      // JSX attribute
      if (enableJSXAttributes && quoteCharCode === /* { */ 123) {
        scope = scopeStack[scopeStackCursor] = SCOPE_JSX_CURLY_BRACES_ATTRIBUTE_VALUE;
        textStartIndex = ++nextIndex;
        continue;
      }

      // Unquoted attribute
      scope = scopeStack[scopeStackCursor] = SCOPE_XML_UNQUOTED_ATTRIBUTE_VALUE;
      textStartIndex = nextIndex;
      continue;
    }

    // ICU argument
    if (
      charCode === /* { */ 123 &&
      (scope === SCOPE_TEXT || scope === SCOPE_JSX_CURLY_BRACES_ATTRIBUTE_VALUE || scope === SCOPE_ICU_CASE)
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

      // ICU argument style or choice

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

      // ICU choice
      if (getCharCodeAt(text, nextIndex) === /* { */ 123) {
        callback(TOKEN_ICU_CASE_START, argumentStyleStartIndex, argumentStyleEndIndex);

        scopeStack[++scopeStackCursor] = SCOPE_ICU_ARGUMENT;
        scope = scopeStack[++scopeStackCursor] = SCOPE_ICU_CASE;
        textStartIndex = ++nextIndex;
        continue;
      }

      throw new SyntaxError(ICU_ERROR_MESSAGE + nextIndex);
    }

    if (charCode === /* } */ 125) {
      // End of an ICU argument
      if (scope === SCOPE_ICU_ARGUMENT) {
        callback(TOKEN_ICU_ARGUMENT_END, nextIndex, ++nextIndex);
        scope = scopeStack[--scopeStackCursor];
        textStartIndex = nextIndex;
        continue;
      }

      // End of an ICU case
      if (scope === SCOPE_ICU_CASE) {
        if (textStartIndex !== index) {
          callback(TOKEN_TEXT, textStartIndex, index);
        }

        callback(TOKEN_ICU_CASE_END, nextIndex, ++nextIndex);
        scope = scopeStack[--scopeStackCursor];
        textStartIndex = nextIndex = skipSpaces(text, nextIndex);
        continue;
      }
    }

    // ICU octothorpe
    if (charCode === /* # */ 35 && scopeStack.indexOf(SCOPE_ICU_CASE) !== -1) {
      if (textStartIndex !== index) {
        callback(TOKEN_TEXT, textStartIndex, index);
      }

      textStartIndex = ++nextIndex;

      callback(TOKEN_ICU_OCTOTHORPE, index, nextIndex);
      continue;
    }

    // Start of an ICU case
    if (scope === SCOPE_ICU_ARGUMENT) {
      if (!isICUNameChar(charCode)) {
        throw new SyntaxError(ICU_ERROR_MESSAGE + index);
      }

      nextIndex = readChars(text, index + 1, isICUNameChar);

      callback(TOKEN_ICU_CASE_START, index, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) !== /* { */ 123) {
        throw new SyntaxError(ICU_ERROR_MESSAGE + nextIndex);
      }

      scope = scopeStack[++scopeStackCursor] = SCOPE_ICU_CASE;
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
