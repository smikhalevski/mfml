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
) => Element | string | undefined;

/**
 * Params provided to a {@link Formatter}.
 *
 * @group Renderer
 */
export interface FormatterParams {
  /**
   * The message locale.
   */
  locale: string;

  /**
   * The value of an argument.
   */
  value: unknown;

  /**
   * The type of format to apply.
   */
  type: string | null;

  /**
   * The formatting style to apply.
   */
  style: string | null;

  /**
   * Argument options.
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
export type Formatter = (params: FormatterParams) => string | undefined;

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
   * Argument options.
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
export type CategorySelector = (params: CategorySelectorParams) => string | undefined;

/**
 * Renders elements and arguments.
 *
 * @template Element The rendered element.
 * @group Renderer
 */
export interface Renderer<Element> {
  /**
   * Renders an element.
   */
  elementRenderer: ElementRenderer<Element>;

  /**
   * Formats argument value as a string.
   */
  formatter: Formatter;

  /**
   * Returns the selected category depending of an argument value.
   */
  categorySelector: CategorySelector;
}

export function combineFormatters(formatters: Formatter[]): Formatter {
  return params => {
    for (const formatter of formatters) {
      const formattedValue = formatter(params);

      if (formattedValue !== undefined) {
        return formattedValue;
      }
    }
  };
}

/**
 * Selects an argument value category.
 *
 * @param params The params use for category selection.
 * @returns The selected category, or `undefined` if there's no matching category.
 */
export const naturalCategorySelector: CategorySelector = params => {
  const { value, type, locale, categories } = params;

  let selectedCategory = '=' + value;

  if ((type === 'plural' || type === 'selectordinal' || type === 'select') && categories.includes(selectedCategory)) {
    return selectedCategory;
  }

  if ((type === 'plural' || type === 'selectordinal') && typeof value === 'number') {
    const formatOptions = type === 'plural' ? cardinalOptions : ordinalOptions;

    selectedCategory = getPluralRules(locale, combineOptions(formatOptions, params.options)).select(value);
  } else if (type === 'select') {
    selectedCategory = '' + value;
  } else {
    selectedCategory = 'other';
  }

  return categories.includes(selectedCategory) ? selectedCategory : categories.includes('other') ? 'other' : undefined;
};

const defaultOptions = {};

type IntlFactory<O, R> = (locale: string, options?: O) => R;

function cacheIntlFactory<O extends object, R>(factory: IntlFactory<O, R>): IntlFactory<O, R> {
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

function combineOptions<T>(formatOptions: T, argumentOptions: T | null): T {
  return argumentOptions === null ? formatOptions : { ...formatOptions, ...argumentOptions };
}

const cardinalOptions: Intl.PluralRulesOptions = { type: 'cardinal' };

const ordinalOptions: Intl.PluralRulesOptions = { type: 'ordinal' };

const getPluralRules = cacheIntlFactory((locale, options) => new Intl.PluralRules(locale, options));

const getNumberFormat = cacheIntlFactory((locale, options) => new Intl.NumberFormat(locale, options));

const getDateTimeFormat = cacheIntlFactory((locale, options) => new Intl.DateTimeFormat(locale, options));

const getListFormat = cacheIntlFactory((locale, options) => new Intl.ListFormat(locale, options));

export function createNumberFormatter(
  type: string,
  style: string | null,
  options: Intl.NumberFormatOptions
): Formatter {
  return params => {
    if (
      type === params.type &&
      style === params.style &&
      (typeof params.value === 'number' || typeof params.value === 'bigint')
    ) {
      return getNumberFormat(params.locale, combineOptions(options, params.options)).format(params.value);
    }
  };
}

export function createDateTimeFormatter(
  type: string,
  style: string | null,
  options: Intl.DateTimeFormatOptions
): Formatter {
  return params => {
    if (
      type === params.type &&
      style === params.style &&
      (typeof params.value === 'number' || params.value instanceof Date)
    ) {
      return getDateTimeFormat(params.locale, combineOptions(options, params.options)).format(params.value);
    }
  };
}

export function createListFormatter(type: string, style: string | null, options: Intl.ListFormatOptions): Formatter {
  return params => {
    if (type === params.type && style === params.style && Array.isArray(params.value)) {
      return getListFormat(params.locale, combineOptions(options, params.options)).format(params.value);
    }
  };
}

export const defaultFormatters: Formatter[] = [
  params => {
    if (params.type === 'plural' || params.type === 'selectordinal') {
      params.type = 'number';
    }
    return undefined;
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

  params => (params.value !== null && params.value !== undefined ? '' + params.value : ''),
];

export const defaultFormatter = combineFormatters(defaultFormatters);
