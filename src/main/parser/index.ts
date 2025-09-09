/**
 * Parses MFML text as a stream of tokens or as an AST.
 *
 * @module mfml/parser
 */

export { parseConfig, type ParserConfig } from './parseConfig.js';
export { parseMessage, type ParseMessageOptions } from './parseMessage.js';
export { tokenizeMessage, type Token, type TokenCallback, type TokenizeMessageOptions } from './tokenizeMessage.js';
