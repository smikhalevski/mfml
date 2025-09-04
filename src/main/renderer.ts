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
 * Params provided to a {@link ArgumentFormatter}.
 *
 * @group Renderer
 */
export interface ArgumentFormatterParams {
  /**
   * The message locale.
   */
  locale: string;

  /**
   * The value of an argument.
   */
  value: unknown;

  /**
   * The type of format to apply ("number", "date", "plural", "selectordinal", "select", etc.) or `null` if type
   * wasn't provided.
   */
  type: string | null;

  /**
   * The formatting style to apply ("decimal", "currency", etc.) or `null` if style wasn't provided.
   */
  style: string | null;

  /**
   * Argument options, or `null` if there are no options.
   */
  options: Record<string, string> | null;
}

/**
 * Formats an argument value as a string.
 *
 * @param params The formatting params.
 * @returns The formatted argument value, or `undefined` if an argument should not be rendered.
 * @group Renderer
 */
export type ArgumentFormatter = (params: ArgumentFormatterParams) => string | undefined | void;

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
   * The type of the select node ("plural", "selectordinal", "select", etc.)
   */
  type: string;

  /**
   * The array of categories available for the argument.
   */
  categories: string[];

  /**
   * Argument options, or `null` if there are no options.
   */
  options: Record<string, string> | null;
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
 * for "plural" and "selectordinal" argument types.
 *
 * @group Renderer
 */
export const defaultCategorySelector: CategorySelector = params => {
  const { value, type, locale, categories, options } = params;

  let selectedCategory = '=' + value;

  if ((type === 'plural' || type === 'selectordinal' || type === 'select') && categories.includes(selectedCategory)) {
    return selectedCategory;
  }

  if ((type === 'plural' || type === 'selectordinal') && typeof value === 'number') {
    const formatOptions = type === 'plural' ? cardinalOptions : ordinalOptions;

    selectedCategory = getPluralRules(locale, mergeOptions(formatOptions, options)).select(value);
  } else if (type === 'select') {
    selectedCategory = '' + value;
  } else {
    selectedCategory = 'other';
  }

  return categories.includes(selectedCategory) ? selectedCategory : categories.includes('other') ? 'other' : undefined;
};

/**
 * Formatter that supports number, date, time and list argument types that follow ICU MessageFormat spec.
 *
 * @group Renderer
 */
export const defaultArgumentFormatter: ArgumentFormatter = enqueueFormatters([
  params => {
    const { value, type } = params;

    if (type === 'plural' || type === 'selectordinal') {
      // Prefer number format
      params.type = 'number';
    }

    if (type === null) {
      // Infer type from an actual value
      params.type = typeof value === 'number' ? 'number' : value instanceof Date ? 'date' : null;
    }
  },

  createNumberFormatter('number', 'decimal', { style: 'decimal' }),
  createNumberFormatter('number', 'percent', { style: 'percent' }),
  createNumberFormatter('number', null, { style: 'decimal' }),

  createDateTimeFormatter('date', 'short', { dateStyle: 'short' }),
  createDateTimeFormatter('date', 'full', { dateStyle: 'full' }),
  createDateTimeFormatter('date', 'long', { dateStyle: 'long' }),
  createDateTimeFormatter('date', 'medium', { dateStyle: 'medium' }),
  createDateTimeFormatter('date', null, { dateStyle: 'medium' }),

  createDateTimeFormatter('time', 'short', { timeStyle: 'short' }),
  createDateTimeFormatter('time', 'full', { timeStyle: 'full' }),
  createDateTimeFormatter('time', 'long', { timeStyle: 'long' }),
  createDateTimeFormatter('time', 'medium', { timeStyle: 'medium' }),
  createDateTimeFormatter('time', null, { timeStyle: 'medium' }),

  createListFormatter('list', 'and', { type: 'conjunction' }),
  createListFormatter('list', 'or', { type: 'disjunction' }),
]);

/**
 * Creates an number argument formatter.
 *
 * @param type The required argument type.
 * @param style The require argument style, or `null` if argument mustn't have a style.
 * @param options Format options.
 * @group Renderer
 */
export function createNumberFormatter(
  type: string,
  style: string | null,
  options: Intl.NumberFormatOptions
): ArgumentFormatter {
  return params => {
    if (
      type === params.type &&
      style === params.style &&
      (typeof params.value === 'number' || typeof params.value === 'bigint')
    ) {
      return getNumberFormat(params.locale, mergeOptions(options, params.options)).format(params.value);
    }
  };
}

/**
 * Creates a date-time argument formatter.
 *
 * @param type The required argument type.
 * @param style The require argument style, or `null` if argument mustn't have a style.
 * @param options Format options.
 * @group Renderer
 */
export function createDateTimeFormatter(
  type: string,
  style: string | null,
  options: Intl.DateTimeFormatOptions
): ArgumentFormatter {
  return params => {
    if (
      type === params.type &&
      style === params.style &&
      (typeof params.value === 'number' || params.value instanceof Date)
    ) {
      return getDateTimeFormat(params.locale, mergeOptions(options, params.options)).format(params.value);
    }
  };
}

/**
 * Creates a list argument formatter.
 *
 * @param type The required argument type.
 * @param style The require argument style, or `null` if argument mustn't have a style.
 * @param options Format options.
 * @group Renderer
 */
export function createListFormatter(
  type: string,
  style: string | null,
  options: Intl.ListFormatOptions
): ArgumentFormatter {
  return params => {
    if (type === params.type && style === params.style && Array.isArray(params.value)) {
      return getListFormat(params.locale, mergeOptions(options, params.options)).format(params.value);
    }
  };
}

/**
 * Creates a formatter that consequently invokes formatter until a non-`undefined` result is returned.
 *
 * @param formatters Formatter to try.
 * @group Renderer
 */
export function enqueueFormatters(formatters: ArgumentFormatter[]): ArgumentFormatter {
  return params => {
    for (const formatter of formatters) {
      const formattedValue = formatter(params);

      if (formattedValue !== undefined) {
        return formattedValue;
      }
    }

    const { value } = params;

    if (value === value && value !== null && value !== undefined) {
      return '' + value;
    }
  };
}

function mergeOptions<T>(formatOptions: T, argumentOptions: T | null): T {
  return argumentOptions === null ? formatOptions : { ...formatOptions, ...argumentOptions };
}

function cacheIntlFactory<O extends object, R>(
  factory: (locale: string, options?: O) => R
): (locale: string, options?: O) => R {
  const cache = new Map<string, WeakMap<O, R>>();

  return (locale, options = defaultOptions as O) => {
    let weakCache = cache.get(locale);

    if (weakCache === undefined) {
      weakCache = new WeakMap();
      cache.set(locale, weakCache);
    }

    let value = weakCache.get(options);

    if (value === undefined) {
      value = factory(locale, options);
      weakCache.set(options, value);
    }

    return value;
  };
}

const defaultOptions = {};

const cardinalOptions: Intl.PluralRulesOptions = { type: 'cardinal' };

const ordinalOptions: Intl.PluralRulesOptions = { type: 'ordinal' };

const getPluralRules = cacheIntlFactory((locale, options) => new Intl.PluralRules(locale, options));

const getNumberFormat = cacheIntlFactory((locale, options) => new Intl.NumberFormat(locale, options));

const getDateTimeFormat = cacheIntlFactory((locale, options) => new Intl.DateTimeFormat(locale, options));

const getListFormat = cacheIntlFactory((locale, options) => new Intl.ListFormat(locale, options));
