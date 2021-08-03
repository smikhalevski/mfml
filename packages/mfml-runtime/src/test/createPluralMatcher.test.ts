import {createPluralMatcher} from '../main/createPluralMatcher';
import {pluralCategories, PluralCategory} from '../main/pluralCategories';

describe('createPluralMatcher', () => {

  test('creates a matcher', () => {
    const matcher = createPluralMatcher('cardinal');

    expect(matcher('en', 1)).toBe(pluralCategories.indexOf(PluralCategory.ONE));
    expect(matcher('en', 100)).toBe(pluralCategories.indexOf(PluralCategory.OTHER));

    expect(matcher('ru', 1)).toBe(pluralCategories.indexOf(PluralCategory.ONE));
    expect(matcher('ru', 3)).toBe(pluralCategories.indexOf(PluralCategory.FEW));
  });
});
