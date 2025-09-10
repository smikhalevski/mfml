import { getCaseInsensitiveHashCode, getCaseSensitiveHashCode, BinaryTokenizerOptions } from './tokenizeMessage.js';

export interface TokenizerOptions {
  /**
   * List of tag that cannot have any content and are always closed after being opening tag.
   */
  voidTags?: readonly string[];

  /**
   * The list CDATA tags. The content of these tags is interpreted as plain text. Ex. `script`, `style`, etc.
   */
  cdataTags?: readonly string[];

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
   * If `true` then ICU arguments are parsed inside {@link cdataTags CDATA tags}.
   *
   * @default false
   */
  isCDATAInterpolated?: boolean;
}

/**
 * Converts parser configuration into options consumed by {@link parseMessage} and {@link tokenizeMessage}.
 */
export function resolveTokenizerOptions(config: TokenizerOptions): BinaryTokenizerOptions {
  const {
    voidTags,
    cdataTags,
    implicitlyClosedTags,
    implicitlyOpenedTags,
    isCaseInsensitiveTags,
    isSelfClosingTagsRecognized,
    isUnbalancedTagsImplicitlyClosed,
    isOrphanClosingTagsIgnored,
    isCDATAInterpolated,
  } = config;

  const getHashCode = isCaseInsensitiveTags ? getCaseInsensitiveHashCode : getCaseSensitiveHashCode;

  const toHashCode = (str: string) => getHashCode(str, 0, str.length);

  return {
    readTag: getHashCode,
    voidTags: voidTags && new Set(voidTags.map(toHashCode)),
    cdataTags: cdataTags && new Set(cdataTags.map(toHashCode)),
    implicitlyClosedTags:
      implicitlyClosedTags &&
      new Map(
        Object.entries(implicitlyClosedTags).map(entry => [toHashCode(entry[0]), new Set(entry[1].map(toHashCode))])
      ),
    implicitlyOpenedTags: implicitlyOpenedTags && new Set(implicitlyOpenedTags.map(toHashCode)),
    isSelfClosingTagsRecognized,
    isUnbalancedTagsImplicitlyClosed,
    isOrphanClosingTagsIgnored,
    isCDATAInterpolated,
  };
}
