import { TokenizeOptions } from './tokenize.js';

export interface Config {
  voidTags?: readonly string[];
  autoClosingTags?: Record<string, readonly string[]>;
  autoOpeningTags?: readonly string[];
  isCaseSensitive?: boolean;
  escapeChar?: string;
  enableJSXAttributes?: boolean;
  enableSelfClosing?: boolean;
}

export function parseConfig(config: Config = {}): TokenizeOptions {
  const {
    voidTags,
    autoClosingTags,
    autoOpeningTags,
    isCaseSensitive = false,
    escapeChar = '\\',
    enableJSXAttributes = false,
    enableSelfClosing = false,
  } = config;

  const getHashCode = isCaseSensitive ? getCaseSensitiveHashCode : getCaseInsensitiveHashCode;

  const toHashCode = (str: string) => getHashCode(str, 0, str.length);

  return {
    voidTags: new Set(voidTags?.map(toHashCode)),
    autoClosingTags: new Map(
      autoClosingTags === null || autoClosingTags === undefined
        ? undefined
        : Object.entries(autoClosingTags).map(entry => [toHashCode(entry[0]), new Set(entry[1].map(toHashCode))])
    ),
    autoOpeningTags: new Set(autoOpeningTags?.map(toHashCode)),
    getHashCode,
    escapeChar,
    enableJSXAttributes,
    enableSelfClosing,
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
