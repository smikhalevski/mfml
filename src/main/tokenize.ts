import { getCharCodeAt, isAttributeNameChar, isSpaceChar, skipChars, skipTagName } from './utils.js';

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
  const tokenStack = [TOKEN_XML_TEXT];

  let tokenCursor = 0;

  let textStartIndex = 0;

  for (let index = 0, nextIndex = 0; nextIndex < text.length; index = nextIndex) {
    const charCode = text.charCodeAt(nextIndex);

    // Unquoted attribute value
    if (
      tokenStack[tokenCursor] === TOKEN_XML_UNQUOTED_ATTRIBUTE_VALUE &&
      (isSpaceChar(charCode) || charCode === /* / */ 47 || charCode === /* > */ 62)
    ) {
      --tokenCursor;

      if (textStartIndex !== index) {
        callback('TEXT', textStartIndex, index);
      }

      callback('ATTRIBUTE_END', index, index);
    }

    switch (charCode) {
      case /* \ */ 92:
        if (textStartIndex !== index) {
          callback('TEXT', textStartIndex, index);
        }

        // Ignore escape char
        textStartIndex = ++nextIndex;

        // Skip next char
        ++nextIndex;
        break;

      case /* < */ 60:
        let tagNameStartIndex = ++nextIndex;

        // Closing tag
        if (getCharCodeAt(text, nextIndex) === /* / */ 47) {
          // Skip "/"
          tagNameStartIndex = ++nextIndex;

          // Read the tag name
          nextIndex = skipTagName(text, tagNameStartIndex);

          if (tagNameStartIndex === nextIndex) {
            break;
          }

          if (textStartIndex !== index) {
            callback('TEXT', textStartIndex, index);
          }

          callback('CLOSING_TAG', tagNameStartIndex, nextIndex);

          // Skip spaces after the tag name
          nextIndex = skipChars(text, nextIndex, isSpaceChar);

          if (getCharCodeAt(text, nextIndex) !== /* > */ 62) {
            throw new SyntaxError('Expected ">" at ' + nextIndex);
          }

          // Skip ">"
          textStartIndex = ++nextIndex;
          break;
        }

        // Opening tag

        // Read the tag name
        nextIndex = skipTagName(text, nextIndex);

        if (tagNameStartIndex === nextIndex) {
          // No opening tag name, ignore "<"
          break;
        }

        if (textStartIndex !== index) {
          callback('TEXT', textStartIndex, index);
        }

        callback('OPENING_TAG_START', tagNameStartIndex, nextIndex);

        tokenStack[++tokenCursor] = TOKEN_XML_OPENING_TAG;

        // Skip spaces after the tag name
        nextIndex = skipChars(text, nextIndex, isSpaceChar);
        break;

      case /* > */ 62:
        if (tokenStack[tokenCursor] === TOKEN_XML_OPENING_TAG) {
          ++nextIndex;

          callback('OPENING_TAG_END', index, nextIndex);

          --tokenCursor;
          textStartIndex = nextIndex;
          break;
        }

        ++nextIndex;
        break;

      case /* / */ 47:
        // "/>"
        if (tokenStack[tokenCursor] === TOKEN_XML_OPENING_TAG && getCharCodeAt(text, index + 1) === /* > */ 62) {
          nextIndex += 2;

          callback('SELF_CLOSING_TAG', index, nextIndex);

          --tokenCursor;
          textStartIndex = nextIndex;
          break;
        }

        ++nextIndex;
        break;

      case /* " */ 34:
      case /* ' */ 39:
        if (
          (charCode === /* " */ 34 && tokenStack[tokenCursor] === TOKEN_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE) ||
          (charCode === /* ' */ 39 && tokenStack[tokenCursor] === TOKEN_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE)
        ) {
          if (textStartIndex !== index) {
            callback('TEXT', textStartIndex, index);
          }

          ++nextIndex;

          callback('ATTRIBUTE_END', index, nextIndex);

          --tokenCursor;
          nextIndex = skipChars(text, nextIndex, isSpaceChar);
          break;
        }

        ++nextIndex;
        break;

      // Non-control character
      default:
        // Attribute
        if (tokenStack[tokenCursor] === TOKEN_XML_OPENING_TAG && isAttributeNameChar(charCode)) {
          nextIndex = skipChars(text, index + 1, isAttributeNameChar);

          tokenStack[++tokenCursor] = TOKEN_XML_ATTRIBUTE;

          callback('ATTRIBUTE_START', index, nextIndex);

          // Skip spaces after the attribute name
          nextIndex = skipChars(text, nextIndex, isSpaceChar);

          if (getCharCodeAt(text, nextIndex) !== /* = */ 61) {
            // No attribute value
            --tokenCursor;
            callback('ATTRIBUTE_END', nextIndex, nextIndex);
            break;
          }

          // Skip spaces after the equality char
          nextIndex = skipChars(text, ++nextIndex, isSpaceChar);

          const quoteCharCode = getCharCodeAt(text, nextIndex);

          if (quoteCharCode === /* " */ 34) {
            // Double-quoted value
            tokenStack[tokenCursor] = TOKEN_XML_DOUBLE_QUOTED_ATTRIBUTE_VALUE;
            textStartIndex = ++nextIndex;
            break;
          }

          if (quoteCharCode === /* ' */ 39) {
            // Single-quoted value
            tokenStack[tokenCursor] = TOKEN_XML_SINGLE_QUOTED_ATTRIBUTE_VALUE;
            textStartIndex = ++nextIndex;
            break;
          }

          tokenStack[tokenCursor] = TOKEN_XML_UNQUOTED_ATTRIBUTE_VALUE;
          textStartIndex = nextIndex;
          break;
        }

        ++nextIndex;
        break;
    }
  }

  if (tokenCursor !== 0) {
    throw new Error('Unexpected end');
  }

  if (textStartIndex !== text.length) {
    callback('TEXT', textStartIndex, text.length);
  }
}
