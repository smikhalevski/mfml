import { TokenCallback, readTokens, ReadTokensOptions } from './readTokens.js';

const ISOLATED_BLOCK_MARKER = -1;

export interface TokenizeOptions extends ReadTokensOptions {
  voidTags: Set<number>;
  autoClosingTags: Map<number, Set<number>>;
  autoOpeningTags: Set<number>;
  getHashCode: (text: string, startIndex: number, endIndex: number) => number;
}

export function tokenize(text: string, callback: TokenCallback, options: TokenizeOptions) {
  const { voidTags, autoClosingTags, autoOpeningTags, getHashCode } = options;

  const tagStack = [0, 0, 0, 0, 0, 0, 0, 0];

  let tagStackCursor = -1;

  const readTokensCallback: TokenCallback = (tokenType, startIndex, endIndex) => {
    switch (tokenType) {
      case 'XML_OPENING_TAG_START':
        const openingTag = getHashCode(text, startIndex, endIndex);

        tagStackCursor = insertAutoClosingTags(
          autoClosingTags.get(openingTag),
          tagStack,
          tagStackCursor,
          callback,
          startIndex - 1
        );

        callback('XML_OPENING_TAG_START', startIndex, endIndex);
        tagStack[++tagStackCursor] = openingTag;
        break;

      case 'XML_OPENING_TAG_END':
        callback('XML_OPENING_TAG_END', startIndex, endIndex);

        if (voidTags.has(tagStack[tagStackCursor])) {
          callback('XML_CLOSING_TAG', endIndex, endIndex);
          --tagStackCursor;
        }
        break;

      case 'XML_OPENING_TAG_SELF_CLOSE':
        callback('XML_OPENING_TAG_SELF_CLOSE', startIndex, endIndex);
        --tagStackCursor;
        break;

      case 'XML_CLOSING_TAG':
        const closingTag = getHashCode(text, startIndex, endIndex);

        let index = tagStackCursor;

        while (index !== -1 && tagStack[index] !== ISOLATED_BLOCK_MARKER && tagStack[index] !== closingTag) {
          --index;
        }

        // Found an opening tag
        if (index !== -1) {
          // Insert unbalanced closing tags
          while (index < tagStackCursor) {
            callback('XML_CLOSING_TAG', startIndex - 2, startIndex - 2);
            --tagStackCursor;
          }

          callback('XML_CLOSING_TAG', startIndex, endIndex);
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

        callback('XML_OPENING_TAG_START', startIndex, endIndex);
        callback('XML_OPENING_TAG_SELF_CLOSE', endIndex, endIndex);
        break;

      case 'ICU_CASE_START':
        tagStack[++tagStackCursor] = ISOLATED_BLOCK_MARKER;
        break;

      case 'ICU_CASE_END':
        --tagStackCursor;
        break;

      default:
        callback(tokenType, startIndex, endIndex);
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
    callback('XML_CLOSING_TAG', insertionIndex, insertionIndex);
    --tagStackCursor;
  }

  return tagStackCursor;
}
