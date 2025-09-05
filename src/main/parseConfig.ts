import { TokenizeOptions } from './tokenize.js';

export interface Config {
  voidTags?: readonly string[];
  forceClosingTags?: Record<string, readonly string[]>;
  forceOpeningTags?: readonly string[];
  escapeChar?: string;
  isCaseSensitiveTags?: boolean;
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
    isCaseSensitiveTags,
    enableJSXAttributes,
    enableSelfClosingTags,
    autoBalanceClosingTags,
    ignoreOrphanClosingTags,
  } = config;

  const getHashCode = isCaseSensitiveTags ? getCaseSensitiveHashCode : getCaseInsensitiveHashCode;

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

export function getCaseInsensitiveHashCode(text: string, startIndex: number, endIndex: number): number {
  let hashCode = 0;

  for (let i = startIndex; i < endIndex; ++i) {
    const charCode = text.charCodeAt(i);
    hashCode = (hashCode << 5) - hashCode + (charCode < 65 || charCode > 90 ? charCode : charCode + 32);
  }

  return hashCode >>> 0;
}

export function getCaseSensitiveHashCode(text: string, startIndex: number, endIndex: number): number {
  let hashCode = 0;

  for (let i = startIndex; i < endIndex; ++i) {
    hashCode = (hashCode << 5) - hashCode + text.charCodeAt(i);
  }

  return hashCode >>> 0;
}
