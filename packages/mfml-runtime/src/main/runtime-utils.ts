import {pluralCategories} from './pluralCategories';

/**
 * The locale matching algorithm:
 * 1. Lookup exact `locale` in `locales`;
 * 2. Lookup an language-only locale;
 * 3. Lookup the first locale in `locales` with the same language as in `locale`;
 * 4. Return -1.
 *
 * **Note:** This doesn't validate or normalize provided locales.
 *
 * @param locale The locale to match.
 * @param locales The list of known locales.
 * @returns An index of locale from `locales` or -1 if no locale matched.
 */
export function matchLocaleOrLanguage(locale: string, locales: Array<string>): number {

  // Lookup exact match
  let index = locales.indexOf(locale);
  if (index !== -1) {
    return index;
  }

  let language = locale;

  // Lookup a language-only locale
  if (locale.length > 2) {
    language = locale.substr(0, 2);
    index = locales.indexOf(language);

    if (index !== -1) {
      return index;
    }
  }

  const a0 = language.charCodeAt(0);
  const a1 = language.charCodeAt(1);

  // Lookup locale with the same language
  for (let i = 0; i < locales.length; i++) {
    if (locales[i].charCodeAt(0) === a0 && locales[i].charCodeAt(1) === a1) {
      return i;
    }
  }

  // No match
  return -1;
}

/**
 * Creates matcher that uses `Intl.PluralRules` to match a plural category for `value`.
 */
export function createPluralMatcher(type: Intl.PluralRuleType): (locale: string, value: number) => number {
  const pluralRulesCache: Record<string, Intl.PluralRules> = {};

  return (locale, value) => {
    const pluralRules = pluralRulesCache[locale] ||= new Intl.PluralRules(locale, {type});
    return pluralCategories.indexOf(pluralRules.select(value));
  };
}

export function exactMatchSelect(value: unknown, ...caseKeys: Array<string>): number;

export function exactMatchSelect(value: unknown): number {
  for (let i = 1; i < arguments.length; ++i) {
    if (arguments[i] === value) {
      return i - 1;
    }
  }
  return -1;
}
