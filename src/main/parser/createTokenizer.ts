import {
  getCaseInsensitiveHashCode,
  getCaseSensitiveHashCode,
  ResolvedTokenizerOptions,
  TokenCallback,
  tokenizeMessage,
} from './tokenizeMessage.js';

/**
 * Options of the {@link createTokenizer}.
 *
 * @group Tokenizer
 */
export interface TokenizerOptions {
  /**
   * The list of tags that can't have any contents (since there's no end tag, no content can be put between the start
   * tag and the end tag).
   *
   * @example
   * ['link', 'meta']
   * @see [HTML5 Void Elements](https://www.w3.org/TR/2010/WD-html5-20101019/syntax.html#void-elements)
   */
  voidTags?: string[];

  /**
   * The list of tags which content is interpreted as plain text.
   *
   * @example
   * ['script', 'style']
   * @see [HTML5 Raw Text Elements](https://www.w3.org/TR/2010/WD-html5-20101019/syntax.html#raw-text-elements)
   */
  rawTextTags?: string[];

  /**
   * The map from a tag (A) to a list of tags that must be closed if tag (A) is opened.
   *
   * For example, in HTML `p` and `h1` tags have the following semantics:
   *
   * ```html
   * <p><h1>  →  <p></p><h1></h1>
   *                ^^^^ p is implicitly closed
   * ```
   *
   * To achieve this behavior, set this option to:
   *
   * ```ts
   * { h1: ['p'] }
   * ```
   *
   * Use in conjunctions with {@link isUnbalancedStartTagsImplicitlyClosed}.
   */
  implicitlyClosedTags?: Record<string, string[]>;

  /**
   * The list of tags for which a start tag is inserted if an unbalanced end tag is met. Otherwise,
   * a {@link ParserError} is thrown.
   *
   * You can ignore unbalanced end tags with {@link isUnbalancedEndTagsIgnored}.
   *
   * For example, in HTML `p` and `br` tags follow this semantics:
   *
   * ```html
   * </p>  →  <p></p>
   *          ^^^ p is implicitly opened
   *
   * </br>  →  <br/>
   *              ^ br is implicitly opened
   * ```
   *
   * To achieve this behavior, set this option to:
   *
   * ```ts
   * ['p', 'br']
   * ```
   *
   * @see {@link isUnbalancedEndTagsIgnored}
   */
  implicitlyOpenedTags?: string[];

  /**
   * If `true` then ASCII alpha characters are case-insensitive in tag names.
   *
   * @default false
   */
  isCaseInsensitiveTags?: boolean;

  /**
   * If `true` then self-closing tags are recognized, otherwise they are treated as start tags.
   *
   * @default false
   */
  isSelfClosingTagsRecognized?: boolean;

  /**
   * If `true` then unbalanced start tags are forcefully closed. Otherwise, a {@link ParserError} is thrown.
   *
   * Use in conjunctions with {@link isUnbalancedEndTagsIgnored}.
   *
   * ```html
   * <a><b></a>  →  <a><b></b></a>
   *                      ^^^^ b is implicitly closed
   * ```
   *
   * @default false
   */
  isUnbalancedStartTagsImplicitlyClosed?: boolean;

  /**
   * If `true` then end tags that dont have a corresponding start tag are ignored. Otherwise,
   * a {@link ParserError} is thrown.
   *
   * Use in conjunctions with {@link isUnbalancedStartTagsImplicitlyClosed}.
   *
   * ```html
   * <a></b></a> → <a></a>
   *    ^^^^ b is ignored
   * ```
   *
   * @default false
   */
  isUnbalancedEndTagsIgnored?: boolean;

  /**
   * If `true` then arguments are parsed inside {@link rawTextTags}.
   *
   * @default false
   */
  isRawTextInterpolated?: boolean;

  /**
   * If `true` then an octothorpe character ("#") inside an argument category is replaced with the argument value.
   *
   * @default false
   */
  isOctothorpeRecognized?: boolean;
}

/**
 * A tokenizer that reads tokens from text and returns them by invoking a callback.
 *
 * @see {@link createTokenizer}
 * @group Tokenizer
 */
export interface Tokenizer {
  /**
   * Reads tokens from text and returns them by invoking a callback.
   *
   * @param text The text string to read tokens from.
   * @param callback The callback that is invoked when a token is read.
   */
  tokenize(text: string, callback: TokenCallback): void;
}

/**
 * Reads tokens from text and returns them by invoking a callback.
 *
 * Tokens are _guaranteed_ to be returned in correct order. Missing tokens are inserted to restore the correct order if
 * needed.
 *
 * @example
 * import { createTokenizer, htmlTokenizerOptions } from 'mfml/parser';
 *
 * const tokenizer = createTokenizer(htmlTokenizerOptions);
 *
 * tokenizer.tokenize(
 *   'Hello, <b>{name}</b>!',
 *   (token, startIndex, endIndex) => {
 *     // Handle token here
 *   },
 * );
 *
 * @param options Tokenizer options.
 * @group Tokenizer
 */
export function createTokenizer(options: TokenizerOptions = {}): Tokenizer {
  const resolvedOptions = resolveTokenizerOptions(options);

  return {
    tokenize(text, callback) {
      return tokenizeMessage(text, callback, resolvedOptions);
    },
  };
}

/**
 * Converts human-readable tokenizer options into options consumed by {@link parseMessage} and {@link tokenizeMessage}.
 */
export function resolveTokenizerOptions(options: TokenizerOptions): ResolvedTokenizerOptions {
  const {
    voidTags,
    rawTextTags,
    implicitlyClosedTags,
    implicitlyOpenedTags,
    isCaseInsensitiveTags,
    isSelfClosingTagsRecognized,
    isUnbalancedStartTagsImplicitlyClosed,
    isUnbalancedEndTagsIgnored,
    isRawTextInterpolated,
  } = options;

  const getHashCode = isCaseInsensitiveTags ? getCaseInsensitiveHashCode : getCaseSensitiveHashCode;

  const toHashCode = (str: string) => getHashCode(str, 0, str.length);

  return {
    readTag: getHashCode,
    voidTags: voidTags && new Set(voidTags.map(toHashCode)),
    rawTextTags: rawTextTags && new Set(rawTextTags.map(toHashCode)),
    implicitlyClosedTags:
      implicitlyClosedTags &&
      new Map(
        Object.entries(implicitlyClosedTags).map(entry => [toHashCode(entry[0]), new Set(entry[1].map(toHashCode))])
      ),
    implicitlyOpenedTags: implicitlyOpenedTags && new Set(implicitlyOpenedTags.map(toHashCode)),
    isSelfClosingTagsRecognized,
    isUnbalancedStartTagsImplicitlyClosed,
    isUnbalancedEndTagsIgnored,
    isRawTextInterpolated,
  };
}
