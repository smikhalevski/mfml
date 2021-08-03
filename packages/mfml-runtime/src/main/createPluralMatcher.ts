import {PluralMatcher} from './runtime-types';
import {pluralCategories} from './pluralCategories';

export function createPluralMatcher(type: Intl.PluralRuleType): PluralMatcher {
  const cache: Record<string, Intl.PluralRules> = {};

  return (locale, value) => pluralCategories.indexOf((cache[locale] ||= new Intl.PluralRules(locale, {type})).select(value));
}
