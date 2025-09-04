import { TokenCallback, readTokens, ReadTokensOptions } from './readTokens.js';

export interface TokenizeOptions extends ReadTokensOptions {
  voidTags: Set<number>;
  autoClosingTags: Map<number, Set<number>>;
  autoOpeningTags: Set<number>;

  getHash(text: string, startIndex: number, endIndex: number): number;
}

export function tokenize(text: string, callback: TokenCallback, options: TokenizeOptions) {
  const { getHash, voidTags, autoClosingTags, autoOpeningTags } = options;

  const tagStack: number[] = [];

  let tagStackCursor = -1;

  readTokens(
    text,
    (tokenType, startIndex, endIndex) => {
      switch (tokenType) {
        case 'OPENING_TAG_START': {
          const openingTag = getHash(text, startIndex, endIndex);

          tagStackCursor = autoCloseTags(
            autoClosingTags.get(openingTag),
            tagStack,
            tagStackCursor,
            callback,
            startIndex - 1
          );

          tagStack[++tagStackCursor] = openingTag;
          callback('OPENING_TAG_START', startIndex, endIndex);
          break;
        }

        case 'OPENING_TAG_END': {
          if (voidTags.has(tagStack[tagStackCursor])) {
            callback('OPENING_TAG_SELF_CLOSE', startIndex, endIndex);
            break;
          }

          callback('OPENING_TAG_END', startIndex, endIndex);
          break;
        }

        case 'OPENING_TAG_SELF_CLOSE': {
          callback('OPENING_TAG_SELF_CLOSE', startIndex, endIndex);
          break;
        }

        case 'CLOSING_TAG': {
          const closingTag = getHash(text, startIndex, endIndex);

          // Lookup closed tag
          let index = tagStackCursor;

          while (index !== -1 && tagStack[index] !== closingTag) {
            --index;
          }

          // Found an opening tag
          if (index !== -1) {
            // Insert unbalanced closing tags
            while (index < tagStackCursor) {
              callback('CLOSING_TAG', startIndex - 2, startIndex - 2);
              --tagStackCursor;
              ++index;
            }

            callback('CLOSING_TAG', startIndex, endIndex);
            --tagStackCursor;
            break;
          }

          if (!autoOpeningTags.has(closingTag)) {
            // Ignore orphan closing tag
            break;
          }

          // Auto insert opening tag

          tagStackCursor = autoCloseTags(
            autoClosingTags.get(closingTag),
            tagStack,
            tagStackCursor,
            callback,
            startIndex - 2
          );

          callback('OPENING_TAG_START', startIndex, endIndex);
          callback('OPENING_TAG_SELF_CLOSE', endIndex, endIndex);
          break;
        }

        case 'ATTRIBUTE_START': {
          callback('ATTRIBUTE_START', startIndex, endIndex);
          break;
        }

        case 'ATTRIBUTE_END': {
          callback('ATTRIBUTE_END', startIndex, endIndex);
          break;
        }

        default: {
          callback('TEXT', startIndex, endIndex);
          break;
        }
      }
    },
    options
  );
}

function autoCloseTags(
  autoClosedTags: Set<number> | undefined,
  tagStack: number[],
  tagStackCursor: number,
  callback: TokenCallback,
  insertionIndex: number
): number {
  if (autoClosedTags === undefined) {
    return tagStackCursor;
  }

  let index = 0;

  while (index <= tagStackCursor && !autoClosedTags.has(tagStack[index])) {
    ++index;
  }

  while (index <= tagStackCursor) {
    callback('CLOSING_TAG', insertionIndex, insertionIndex);
    --tagStackCursor;
    ++index;
  }

  return tagStackCursor;
}
