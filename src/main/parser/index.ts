/**
 * Tokenizes MFML text as a stream of tokens or parser it as an AST.
 *
 * @module mfml/parser
 */

export { createParser, type Parser, type ParserOptions } from './createParser.js';
export { createTokenizer, type Tokenizer, type TokenizerOptions } from './createTokenizer.js';
export { ParserError, type Token, type TokenCallback } from './tokenizeMessage.js';
export { htmlTokenizer, htmlTokenizerOptions } from './htmlTokenizer.js';
