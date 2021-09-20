export const enum PluralCategory {
  ZERO = 'zero',
  ONE = 'one',
  TWO = 'two',
  FEW = 'few',
  MANY = 'many',
  OTHER = 'other',
}

/**
 * The ordered list of plural categories.
 */
export const pluralCategories: Array<string> = [
  PluralCategory.ZERO,
  PluralCategory.ONE,
  PluralCategory.TWO,
  PluralCategory.FEW,
  PluralCategory.MANY,
  PluralCategory.OTHER,
];
