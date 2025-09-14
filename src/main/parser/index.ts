/**
 * Parses MFML text as a stream of tokens or as an AST.
 *
 * @module mfml/parser
 */

export { htmlTokenizerOptions } from './htmlTokenizerOptions.js';
export { parseMessage, type ParserOptions, type DecodingOptions } from './parseMessage.js';
export { resolveTokenizerOptions, type TokenizerOptions } from './resolveTokenizerOptions.js';
export { tokenizeMessage, type Token, type TokenCallback, type ResolvedTokenizerOptions } from './tokenizeMessage.js';
