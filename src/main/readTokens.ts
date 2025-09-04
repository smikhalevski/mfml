const SCOPE_TEXT = 0;
const SCOPE_XML_OPENING_TAG = 1;
const SCOPE_XML_ATTRIBUTE = 2;
const SCOPE_XML_UNQUOTED_ATTRIBUTE_VALUE = 3;
const SCOPE_JSX_CURLY_BRACES_ATTRIBUTE_VALUE = 4;
const SCOPE_ICU_ARGUMENT = 5;
const SCOPE_ICU_CASE = 6;

const ERROR_MESSAGE = 'Unexpected ICU syntax at ';

export type TokenType =
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

export interface ReadTokensOptions {
  escapeChar?: string;
  enableJSXAttributes?: boolean;
  enableSelfClosing?: boolean;
}

export type TokenCallback = (tokenType: TokenType, startIndex: number, endIndex: number) => void;

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
        callback('TEXT', textStartIndex, index);
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
        callback('TEXT', textStartIndex, index);
      }

      callback('XML_ATTRIBUTE_END', index, index);
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
          callback('TEXT', textStartIndex, index);
        }

        callback('XML_CLOSING_TAG', tagNameStartIndex, nextIndex);

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
        callback('TEXT', textStartIndex, index);
      }

      callback('XML_OPENING_TAG_START', tagNameStartIndex, nextIndex);

      scope = scopeStack[++scopeStackCursor] = SCOPE_XML_OPENING_TAG;

      nextIndex = skipSpaces(text, nextIndex);
      textStartIndex = nextIndex;
      continue;
    }

    // End of opening XML tag
    if (charCode === /* > */ 62 && scope === SCOPE_XML_OPENING_TAG) {
      ++nextIndex;

      callback('XML_OPENING_TAG_END', index, nextIndex);

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

      callback('XML_OPENING_TAG_SELF_CLOSE', index, nextIndex);

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
        callback('TEXT', textStartIndex, index);
      }

      ++nextIndex;

      callback('XML_ATTRIBUTE_END', index, nextIndex);

      scope = scopeStack[--scopeStackCursor];
      nextIndex = skipSpaces(text, nextIndex);
      continue;
    }

    // XML attribute
    if (scope === SCOPE_XML_OPENING_TAG && isXMLAttributeNameChar(charCode)) {
      nextIndex = readChars(text, index + 1, isXMLAttributeNameChar);

      callback('XML_ATTRIBUTE_START', index, nextIndex);

      scope = scopeStack[++scopeStackCursor] = SCOPE_XML_ATTRIBUTE;

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) !== /* = */ 61) {
        // No attribute value
        callback('XML_ATTRIBUTE_END', nextIndex, nextIndex);
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
          callback('TEXT', textStartIndex, nextIndex);
        }

        callback('XML_ATTRIBUTE_END', nextIndex, nextIndex + 1);

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
        callback('TEXT', textStartIndex, index);
      }

      nextIndex = skipSpaces(text, index + 1);

      const argumentNameStartIndex = nextIndex;

      nextIndex = readChars(text, nextIndex, isICUNameChar);

      if (argumentNameStartIndex === nextIndex) {
        throw new SyntaxError(ERROR_MESSAGE + nextIndex);
      }

      callback('ICU_ARGUMENT_START', argumentNameStartIndex, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback('ICU_ARGUMENT_END', nextIndex, ++nextIndex);
        textStartIndex = nextIndex;
        continue;
      }

      if (getCharCodeAt(text, nextIndex) !== /* , */ 44) {
        throw new SyntaxError(ERROR_MESSAGE + nextIndex);
      }

      // ICU argument type

      nextIndex = skipSpaces(text, nextIndex + 1);

      const argumentTypeStartIndex = nextIndex;

      nextIndex = readChars(text, argumentTypeStartIndex, isICUNameChar);

      if (argumentTypeStartIndex === nextIndex) {
        throw new SyntaxError(ERROR_MESSAGE + nextIndex);
      }

      callback('ICU_ARGUMENT_TYPE', argumentTypeStartIndex, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback('ICU_ARGUMENT_END', nextIndex, ++nextIndex);
        textStartIndex = nextIndex;
        continue;
      }

      if (getCharCodeAt(text, nextIndex) !== /* , */ 44) {
        throw new SyntaxError(ERROR_MESSAGE + nextIndex);
      }

      // ICU argument style or choice

      nextIndex = skipSpaces(text, nextIndex + 1);

      const argumentStyleStartIndex = nextIndex;

      nextIndex = readChars(text, nextIndex, isICUNameChar);

      if (argumentStyleStartIndex === nextIndex) {
        throw new SyntaxError(ERROR_MESSAGE + nextIndex);
      }

      const argumentStyleEndIndex = nextIndex;

      nextIndex = skipSpaces(text, nextIndex);

      // ICU argument style
      if (getCharCodeAt(text, nextIndex) === /* } */ 125) {
        callback('ICU_ARGUMENT_STYLE', argumentStyleStartIndex, argumentStyleEndIndex);
        callback('ICU_ARGUMENT_END', nextIndex, ++nextIndex);

        textStartIndex = nextIndex;
        continue;
      }

      // ICU choice
      if (getCharCodeAt(text, nextIndex) === /* { */ 123) {
        callback('ICU_CASE_START', argumentStyleStartIndex, argumentStyleEndIndex);

        scopeStack[++scopeStackCursor] = SCOPE_ICU_ARGUMENT;
        scope = scopeStack[++scopeStackCursor] = SCOPE_ICU_CASE;
        textStartIndex = ++nextIndex;
        continue;
      }

      throw new SyntaxError(ERROR_MESSAGE + nextIndex);
    }

    if (charCode === /* } */ 125) {
      // End of an ICU argument
      if (scope === SCOPE_ICU_ARGUMENT) {
        callback('ICU_ARGUMENT_END', nextIndex, ++nextIndex);
        scope = scopeStack[--scopeStackCursor];
        textStartIndex = nextIndex;
        continue;
      }

      // End of an ICU case
      if (scope === SCOPE_ICU_CASE) {
        if (textStartIndex !== index) {
          callback('TEXT', textStartIndex, index);
        }

        callback('ICU_CASE_END', nextIndex, ++nextIndex);
        scope = scopeStack[--scopeStackCursor];
        textStartIndex = nextIndex = skipSpaces(text, nextIndex);
        continue;
      }
    }

    // ICU octothorpe
    if (charCode === /* # */ 35 && scopeStack.indexOf(SCOPE_ICU_CASE) !== -1) {
      if (textStartIndex !== index) {
        callback('TEXT', textStartIndex, index);
      }

      textStartIndex = ++nextIndex;

      callback('ICU_OCTOTHORPE', index, nextIndex);
      continue;
    }

    // Start of an ICU case
    if (scope === SCOPE_ICU_ARGUMENT) {
      if (!isICUNameChar(charCode)) {
        throw new SyntaxError(ERROR_MESSAGE + index);
      }

      nextIndex = readChars(text, index + 1, isICUNameChar);

      callback('ICU_CASE_START', index, nextIndex);

      nextIndex = skipSpaces(text, nextIndex);

      if (getCharCodeAt(text, nextIndex) !== /* { */ 123) {
        throw new SyntaxError(ERROR_MESSAGE + nextIndex);
      }

      scope = scopeStack[++scopeStackCursor] = SCOPE_ICU_CASE;
      textStartIndex = ++nextIndex;
      continue;
    }

    // Plain text
    ++nextIndex;
  }

  if (textStartIndex !== text.length) {
    callback('TEXT', textStartIndex, text.length);
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
