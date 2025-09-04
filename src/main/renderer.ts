import { ArgumentFormatter } from './formatter.js';
import { getPluralRules } from './intl.js';

/**
 * Renders an element.
 *
 * @param tagName The element tag name.
 * @param attributes Attributes of an element.
 * @param children Children of an element.
 * @returns Rendering result, or `undefined` if an element should not be rendered.
 * @template Element The rendered element.
 * @group Renderer
 */
export type ElementRenderer<Element> = (
  tagName: string,
  attributes: Record<string, string>,
  children: Array<Element | string>
) => Element | string | undefined | void;

/**
 * Params provided to a {@link CategorySelector}.
 *
 * @group Renderer
 */
export interface CategorySelectorParams {
  /**
   * The message locale.
   */
  locale: string;

  /**
   * The value of an argument.
   */
  value: unknown;

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
 * @group Renderer
 */
export type CategorySelector = (params: CategorySelectorParams) => string | undefined | void;

/**
 * Renders elements and arguments.
 *
 * @template Element The rendered element.
 * @group Renderer
 */
export interface Renderer<Element> {
  /**
   * Renders an element.
   *
   * @see {@link mfml/react!createReactDOMElementRenderer createReactDOMElementRenderer}
   */
  renderElement: ElementRenderer<Element>;

  /**
   * Formats argument value as a string.
   *
   * @see {@link defaultArgumentFormatter}
   */
  formatArgument: ArgumentFormatter;

  /**
   * Returns the selected category depending of an argument value.
   *
   * @see {@link defaultCategorySelector}
   */
  selectCategory: CategorySelector;
}

/**
 * Selects a category for an argument value. Follows ICU MessageFormat convention and uses {@link Intl.PluralRules}
 * for "plural" and "selectOrdinal" argument types.
 *
 * @group Renderer
 */
export const defaultCategorySelector: CategorySelector = params => {
  const { value, type, locale, categories, options } = params;

  let selectedCategory = '=' + value;

  if ((type === 'plural' || type === 'selectOrdinal' || type === 'select') && categories.includes(selectedCategory)) {
    return selectedCategory;
  }

  if ((type === 'plural' || type === 'selectOrdinal') && typeof value === 'number') {
    const formatOptions = type === 'plural' ? cardinalOptions : ordinalOptions;

    selectedCategory = getPluralRules(locale, mergeOptions(formatOptions, options)).select(value);
  } else if (type === 'select') {
    selectedCategory = '' + value;
  } else {
    selectedCategory = 'other';
  }

  return categories.includes(selectedCategory) ? selectedCategory : categories.includes('other') ? 'other' : undefined;
};

function mergeOptions<T>(formatOptions: T, argumentOptions: T | null): T {
  return argumentOptions === null ? formatOptions : { ...formatOptions, ...argumentOptions };
}

const cardinalOptions: Intl.PluralRulesOptions = { type: 'cardinal' };

const ordinalOptions: Intl.PluralRulesOptions = { type: 'ordinal' };
