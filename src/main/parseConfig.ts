import { getCaseInsensitiveHashCode, getCaseSensitiveHashCode, TokenizeMarkupOptions } from './tokenizeMarkup.js';

export interface Config {
  /**
   * List of tag that cannot have any content and are always closed after being opening tag.
   */
  voidTags?: readonly string[];

  /**
   * The map from a tag (A) to a list of tags that must be forcefully closed if tag (A) is opened.
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
   * Use in conjunctions with {@link isUnbalancedTagsAutoClosed}.
   */
  forceClosedTags?: Record<string, readonly string[]>;

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
  reopenedOrphanClosingTags?: readonly string[];

  /**
   * A character that prevent the following character to be treated as plain text.
   *
   * @default "\"
   */
  escapeChar?: string;

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
  isUnbalancedTagsAutoClosed?: boolean;

  /**
   * If `true` then closing tags that dont have a corresponding closing tag are ignored. Otherwise,
   * a {@link SyntaxError} is thrown.
   *
   * Use in conjunctions with {@link isUnbalancedTagsAutoClosed}.
   *
   * ```html
   * <a></b></a> → <a></a>
   * ```
   *
   * @default false
   */
  isOrphanClosingTagsIgnored?: boolean;
}

export function parseConfig(config: Config): TokenizeMarkupOptions {
  const {
    voidTags,
    forceClosedTags,
    reopenedOrphanClosingTags,
    escapeChar,
    isCaseInsensitiveTags,
    isSelfClosingTagsRecognized,
    isUnbalancedTagsAutoClosed,
    isOrphanClosingTagsIgnored,
  } = config;

  const getHashCode = isCaseInsensitiveTags ? getCaseInsensitiveHashCode : getCaseSensitiveHashCode;

  const toHashCode = (str: string) => getHashCode(str, 0, str.length);

  return {
    readTag: getHashCode,
    voidTags: voidTags && new Set(voidTags.map(toHashCode)),
    forceClosedTags:
      forceClosedTags &&
      new Map(Object.entries(forceClosedTags).map(entry => [toHashCode(entry[0]), new Set(entry[1].map(toHashCode))])),
    reopenedOrphanClosingTags: reopenedOrphanClosingTags && new Set(reopenedOrphanClosingTags.map(toHashCode)),
    escapeChar,
    isSelfClosingTagsRecognized,
    isUnbalancedTagsAutoClosed,
    isOrphanClosingTagsIgnored,
  };
}
