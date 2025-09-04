import { getPluralRules, mergeOptions } from './utils.js';

/**
 * Params provided to a {@link CategorySelector}.
 *
 * @group Category Selector
 */
export interface CategorySelectorParams {
  /**
   * The value of an argument.
   */
  value: any;

  /**
   * The message locale.
   */
  locale: string;

  /**
   * The type of the select node ("plural", "selectOrdinal", "select", etc.)
   */
  type: string;

  /**
   * The array of categories available for the argument.
   */
  categories: string[];

  /**
   * Argument options, or `null` if there are no options.
   */
  options: Record<string, any> | null;
}

/**
 * Returns the selected category depending of an argument value.
 *
 * @param params The params use for category selection.
 * @returns The selected category, or `undefined` if there's no matching category.
 * @group Category Selector
 */
export type CategorySelector = (params: CategorySelectorParams) => string | undefined;

/**
 * Selects a category for an argument value. Follows ICU MessageFormat convention and uses {@link Intl.PluralRules}
 * for "plural" and "selectOrdinal" argument types.
 *
 * @group Category Selector
 */
export const defaultCategorySelector: CategorySelector = params => {
  const { value, type, locale, categories, options } = params;

  let selectedCategory = '=' + value;

  if ((type === 'plural' || type === 'selectOrdinal' || type === 'select') && categories.includes(selectedCategory)) {
    return selectedCategory;
  }

  if ((type === 'plural' || type === 'selectOrdinal') && typeof value === 'number') {
    selectedCategory = getPluralRules(
      locale,
      mergeOptions(type === 'plural' ? pluralOptions : selectOrdinalOptions, options)
    ).select(value);
  } else if (type === 'select') {
    selectedCategory = '' + value;
  } else {
    selectedCategory = 'other';
  }

  if (categories.includes(selectedCategory)) {
    return selectedCategory;
  }

  if (categories.includes('other')) {
    return 'other';
  }
};

const pluralOptions: Intl.PluralRulesOptions = { type: 'cardinal' };

const selectOrdinalOptions: Intl.PluralRulesOptions = { type: 'ordinal' };
