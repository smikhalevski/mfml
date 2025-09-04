import { AbstractRendererOptions } from './AbstractRenderer.js';
import { MessageNode } from './ast.js';

export function isLowerCaseAlpha(str: string): boolean {
  for (let i = 0; i < str.length; ++i) {
    const charCode = str.charCodeAt(i);

    if (charCode < /* a */ 97 || charCode > /* z */ 122) {
      return false;
    }
  }

  return true;
}

/**
 * Returns a message node for a given locale or for a fallback locale.
 */
export function getMessageNodeOrFallback(
  messageFunction: (locale: string) => MessageNode<any> | null,
  locale: string,
  fallbackLocales: Record<string, string> | undefined
): MessageNode<any> | null {
  if (fallbackLocales === undefined) {
    return messageFunction(locale);
  }

  let messageNode = null;
  let visitedLocales: Set<string> | undefined;

  while (
    locale !== undefined &&
    (visitedLocales === undefined || !visitedLocales.has(locale)) &&
    (messageNode = messageFunction(locale)) === null
  ) {
    if (visitedLocales === undefined) {
      visitedLocales = new Set();
    }
    visitedLocales.add(locale);
    locale = fallbackLocales[locale];
  }

  return messageNode;
}

export const defaultStyles: AbstractRendererOptions = {
  dateStyles: {
    short: { dateStyle: 'short' },
    full: { dateStyle: 'full' },
    long: { dateStyle: 'long' },
    medium: { dateStyle: 'medium' },
  },
  timeStyles: {
    short: { timeStyle: 'short' },
    full: { timeStyle: 'full' },
    long: { timeStyle: 'long' },
    medium: { timeStyle: 'medium' },
  },
  numberStyles: {
    decimal: { style: 'decimal' },
    percent: { style: 'percent' },
  },
  listStyles: {
    conjunction: { type: 'conjunction' },
    disjunction: { type: 'disjunction' },
  },
};
