import { getCaseInsensitiveHashCode, getCaseSensitiveHashCode, TokenizeOptions } from './tokenize.js';

export interface Config {
  voidTags?: readonly string[];
  forceClosingTags?: Record<string, readonly string[]>;
  forceOpeningTags?: readonly string[];
  escapeChar?: string;
  isCaseInsensitiveTags?: boolean;
  enableJSXAttributes?: boolean;
  enableSelfClosingTags?: boolean;
  autoBalanceClosingTags?: boolean;
  ignoreOrphanClosingTags?: boolean;
}

export function parseConfig(config: Config = {}): TokenizeOptions {
  const {
    voidTags,
    forceClosingTags,
    forceOpeningTags,
    escapeChar,
    isCaseInsensitiveTags,
    enableJSXAttributes,
    enableSelfClosingTags,
    autoBalanceClosingTags,
    ignoreOrphanClosingTags,
  } = config;

  const getHashCode = isCaseInsensitiveTags ? getCaseInsensitiveHashCode : getCaseSensitiveHashCode;

  const toHashCode = (str: string) => getHashCode(str, 0, str.length);

  return {
    readTag: getHashCode,
    voidTags: voidTags && new Set(voidTags.map(toHashCode)),
    forceClosingTags:
      forceClosingTags &&
      new Map(Object.entries(forceClosingTags).map(entry => [toHashCode(entry[0]), new Set(entry[1].map(toHashCode))])),
    forceOpeningTags: forceOpeningTags && new Set(forceOpeningTags.map(toHashCode)),
    escapeChar,
    enableJSXAttributes,
    enableSelfClosingTags,
    autoBalanceClosingTags,
    ignoreOrphanClosingTags,
  };
}
