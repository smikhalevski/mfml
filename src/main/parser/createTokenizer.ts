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
   * ["link", "meta"]
   * @see [HTML5 Void Elements](https://www.w3.org/TR/2010/WD-html5-20101019/syntax.html#void-elements)
   */
  voidTags?: readonly string[];

  /**
   * The list of tags which content is interpreted as plain text.
   *
   * @example
   * ["script", "style"]
   * @see [HTML5 Raw Text Elements](https://www.w3.org/TR/2010/WD-html5-20101019/syntax.html#raw-text-elements)
   */
  rawTextTags?: readonly string[];

  /**
   * The map from a tag (A) to a list of tags that must be closed if tag (A) is opened.
   *
   * For example, in HTML `p`, `table`, and many other tags follow this semantics:
   * ```html
   * <p>foo<h1>bar → <p>foo</p><h1>bar</h1>
   * ```
   *
   * To achieve this behavior, set this option to:
   * ```ts
   * { h1: ['p'] }
   * ```
   *
   * Use in conjunctions with {@link isUnbalancedTagsImplicitlyClosed}.
   */
  implicitlyClosedTags?: Record<string, readonly string[]>;

  /**
   * The list of tags for which an opening tag is inserted if an orphan closing tag is met. Otherwise,
   * a {@link SyntaxError} is thrown.
   *
   * You can ignore orphan closing tags with {@link isOrphanClosingTagsIgnored}.
   *
   * For example, in HTML `p` and `br` tags follow this semantics:
   * ```html
   * </p>  → <p></p>
   * </br> → <br/>
   * ```
   *
   * To achieve this behavior, set this option to:
   * ```ts
   * ['p', 'br']
   * ```
   *
   * @see {@link isOrphanClosingTagsIgnored}
   */
  implicitlyOpenedTags?: readonly string[];

  /**
   * If `true` then ASCII alpha characters are case-insensitive in tag names.
   *
   * @default false
   */
  isCaseInsensitiveTags?: boolean;

  /**
   * If `true` then self-closing tags are recognized, otherwise they are treated as opening tags.
   *
   * @default false
   */
  isSelfClosingTagsRecognized?: boolean;

  /**
   * If `true` then unbalanced opening tags are forcefully closed. Otherwise, a {@link SyntaxError} is thrown.
   *
   * Use in conjunctions with {@link isOrphanClosingTagsIgnored}.
   *
   * ```html
   * <a><b></a></b> → <a><b></b></a></b>
   * ```
   *
   * @default false
   */
  isUnbalancedTagsImplicitlyClosed?: boolean;

  /**
   * If `true` then closing tags that dont have a corresponding closing tag are ignored. Otherwise,
   * a {@link SyntaxError} is thrown.
   *
   * Use in conjunctions with {@link isUnbalancedTagsImplicitlyClosed}.
   *
   * ```html
   * <a></b></a> → <a></a>
   * ```
   *
   * @default false
   */
  isOrphanClosingTagsIgnored?: boolean;

  /**
   * If `true` then ICU arguments are parsed inside {@link rawTextTags}.
   *
   * @default false
   */
  isRawTextInterpolated?: boolean;
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
 * Tokens are guaranteed to be returned in correct order. Missing tokens are inserted and `startIndex === endIndex`
 * for such tokens.
 *
 * The tokenizer doesn't guarantee that contents of returned tokens are consistent. For example, ICU argument type may
 * not properly reflect the consequent ICU category tokens.
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
    isUnbalancedTagsImplicitlyClosed,
    isOrphanClosingTagsIgnored,
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
    isUnbalancedTagsImplicitlyClosed,
    isOrphanClosingTagsIgnored,
    isRawTextInterpolated,
  };
}
