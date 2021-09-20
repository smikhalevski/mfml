import {PluralMatcher} from './runtime-types';
import {pluralCategories} from './pluralCategories';
import {normalizeLocale} from 'locale-matcher';

/**
 * Creates a {@link PluralMatcher} instance that uses cached `Intl.PluralRules` to resolve plural category.
 *
 * @param type The pluralization type.
 */
export function createPluralMatcher(type: Intl.PluralRuleType): PluralMatcher {
  const cache: Record<string, Intl.PluralRules> = {};

  return (locale, value) => pluralCategories.indexOf((cache[locale] ||= new Intl.PluralRules(normalizeLocale(locale), {type})).select(value));
}
