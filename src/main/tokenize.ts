const TOKEN_XML_TEXT = 0;
const TOKEN_XML_OPENING_TAG = 1;
const TOKEN_XML_ATTRIBUTE = 2;
const TOKEN_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE = 3;
const TOKEN_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE = 4;
const TOKEN_XML_UNQUOTED_ATTRIBUTE_VALUE = 5;

export type TokenType =
  | 'TEXT'
  | 'OPENING_TAG_START'
  | 'OPENING_TAG_END'
  | 'SELF_CLOSING_TAG'
  | 'CLOSING_TAG'
  | 'ATTRIBUTE_START'
  | 'ATTRIBUTE_END';

export function tokenize(text: string, callback: (tokenType: TokenType, startIndex: number, endIndex: number) => void) {
  const tokenTypeStack = [TOKEN_XML_TEXT];

  let tokenTypeStackCursor = 0;

  let textStartIndex = 0;

  for (let index = 0, nextIndex = 0; nextIndex < text.length; index = nextIndex) {
    const charCode = text.charCodeAt(nextIndex);

    // Unquoted attribute value
    if (
      tokenTypeStack[tokenTypeStackCursor] === TOKEN_XML_UNQUOTED_ATTRIBUTE_VALUE &&
      (isSpaceChar(charCode) || charCode === /* / */ 47 || charCode === /* > */ 62)
    ) {
      --tokenTypeStackCursor;

      if (textStartIndex !== index) {
        callback('TEXT', textStartIndex, index);
      }

      callback('ATTRIBUTE_END', index, index);
    }

    if (charCode === /* \ */ 92) {
      if (textStartIndex !== index) {
        callback('TEXT', textStartIndex, index);
      }

      // Ignore escape char
      textStartIndex = ++nextIndex;

      // Skip next char
      ++nextIndex;
      continue;
    }

    if (charCode === /* < */ 60 && tokenTypeStack[tokenTypeStackCursor] !== TOKEN_XML_OPENING_TAG) {
      let tagNameStartIndex = ++nextIndex;

      // Closing tag

      if (getCharCodeAt(text, nextIndex) === /* / */ 47) {
        // Skip "/"
        tagNameStartIndex = ++nextIndex;

        // Read the tag name
        nextIndex = skipTagName(text, tagNameStartIndex);

        if (tagNameStartIndex === nextIndex) {
          continue;
        }

        if (textStartIndex !== index) {
          callback('TEXT', textStartIndex, index);
        }

        callback('CLOSING_TAG', tagNameStartIndex, nextIndex);

        // Skip spaces after the tag name
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

      // Read the tag name
      nextIndex = skipTagName(text, nextIndex);

      if (tagNameStartIndex === nextIndex) {
        // No opening tag name, ignore "<"
        continue;
      }

      if (textStartIndex !== index) {
        callback('TEXT', textStartIndex, index);
      }

      callback('OPENING_TAG_START', tagNameStartIndex, nextIndex);

      tokenTypeStack[++tokenTypeStackCursor] = TOKEN_XML_OPENING_TAG;

      // Skip spaces after the tag name
      nextIndex = skipChars(text, nextIndex, isSpaceChar);
      textStartIndex = nextIndex;
      continue;
    }

    if (charCode === /* > */ 62) {
      if (tokenTypeStack[tokenTypeStackCursor] === TOKEN_XML_OPENING_TAG) {
        ++nextIndex;

        callback('OPENING_TAG_END', index, nextIndex);

        --tokenTypeStackCursor;
        textStartIndex = nextIndex;
        continue;
      }

      ++nextIndex;
      continue;
    }

    if (charCode === /* / */ 47) {
      // "/>"
      if (
        tokenTypeStack[tokenTypeStackCursor] === TOKEN_XML_OPENING_TAG &&
        getCharCodeAt(text, index + 1) === /* > */ 62
      ) {
        nextIndex += 2;

        callback('SELF_CLOSING_TAG', index, nextIndex);

        --tokenTypeStackCursor;
        textStartIndex = nextIndex;
        continue;
      }

      ++nextIndex;
      continue;
    }

    if (charCode === /* " */ 34 || charCode === /* ' */ 39) {
      if (
        (charCode === /* " */ 34 && tokenTypeStack[tokenTypeStackCursor] === TOKEN_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE) ||
        (charCode === /* ' */ 39 && tokenTypeStack[tokenTypeStackCursor] === TOKEN_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE)
      ) {
        if (textStartIndex !== index) {
          callback('TEXT', textStartIndex, index);
        }

        ++nextIndex;

        callback('ATTRIBUTE_END', index, nextIndex);

        --tokenTypeStackCursor;
        nextIndex = skipChars(text, nextIndex, isSpaceChar);
        continue;
      }

      ++nextIndex;
      continue;
    }

    // Non-control characters

    // Attribute
    if (tokenTypeStack[tokenTypeStackCursor] === TOKEN_XML_OPENING_TAG && isAttributeNameChar(charCode)) {
      nextIndex = skipChars(text, index + 1, isAttributeNameChar);

      tokenTypeStack[++tokenTypeStackCursor] = TOKEN_XML_ATTRIBUTE;

      callback('ATTRIBUTE_START', index, nextIndex);

      // Skip spaces after the attribute name
      nextIndex = skipChars(text, nextIndex, isSpaceChar);

      if (getCharCodeAt(text, nextIndex) !== /* = */ 61) {
        // No attribute value
        --tokenTypeStackCursor;
        callback('ATTRIBUTE_END', nextIndex, nextIndex);
        continue;
      }

      // Skip spaces after the equality char
      nextIndex = skipChars(text, ++nextIndex, isSpaceChar);

      const quoteCharCode = getCharCodeAt(text, nextIndex);

      if (quoteCharCode === /* " */ 34) {
        // Double-quoted value
        tokenTypeStack[tokenTypeStackCursor] = TOKEN_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE;
        textStartIndex = ++nextIndex;
        continue;
      }

      if (quoteCharCode === /* ' */ 39) {
        // Single-quoted value
        tokenTypeStack[tokenTypeStackCursor] = TOKEN_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE;
        textStartIndex = ++nextIndex;
        continue;
      }

      tokenTypeStack[tokenTypeStackCursor] = TOKEN_XML_UNQUOTED_ATTRIBUTE_VALUE;
      textStartIndex = nextIndex;
      continue;
    }

    // Plain text
    ++nextIndex;
  }

  if (textStartIndex !== text.length) {
    callback('TEXT', textStartIndex, text.length);
  }
}

function skipTagName(text: string, index: number): number {
  return isTagNameStartChar(getCharCodeAt(text, index)) ? skipChars(text, index + 1, isTagNameChar) : index;
}

/**
 * https://www.w3.org/TR/xml/#NT-NameStartChar
 */
function isTagNameStartChar(charCode: number): boolean {
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

function isTagNameChar(charCode: number): boolean {
  return !(isSpaceChar(charCode) || charCode === /* / */ 47 || charCode === /* > */ 62);
}

/**
 * Reads chars until predicate returns `true`.
 */
function skipChars(text: string, index: number, predicate: (charCode: number) => boolean): number {
  while (index < text.length && predicate(text.charCodeAt(index))) {
    ++index;
  }
  return index;
}

function getCharCodeAt(text: string, index: number): number {
  return index < text.length ? text.charCodeAt(index) : -1;
}

// https://www.w3.org/TR/xml/#NT-S
function isSpaceChar(charCode: number): boolean {
  return charCode == /* \s */ 32 || charCode === /* \t */ 9 || charCode === /* \r */ 13 || charCode === /* \n */ 10;
}

function isAttributeNameChar(charCode: number): boolean {
  return !(isSpaceChar(charCode) || charCode === /* > */ 62 || charCode === /* = */ 61);
}
