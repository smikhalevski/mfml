import { MessageRenderer, MessageRendererOptions } from './types.js';

/**
 * The message renderer the provides the default implementation of argument formatting and select matching.
 *
 * @template T The rendering result (string, `ReactNode`).
 */
export abstract class AbstractMessageRenderer<T> implements MessageRenderer<T> {
  /**
   * Formatting styles used for "number" argument type.
   */
  numberStyles;

  /**
   * Formatting styles used for "date" argument type.
   */
  dateStyles;

  /**
   * Formatting styles used for "time" argument type.
   */
  timeStyles;

  /**
   * Formatting styles used for "list" argument type.
   */
  listStyles;

  /**
   * Map from an attribute type to a custom formatter function.
   */
  formatters;

  /**
   * Creates a new {@link AbstractMessageRenderer} instance.
   *
   * @param options Rendering options.
   */
  constructor(options: MessageRendererOptions = {}) {
    const { numberStyles = {}, dateStyles = {}, timeStyles = {}, listStyles = {}, formatters = {} } = options;

    this.numberStyles = numberStyles;
    this.dateStyles = dateStyles;
    this.timeStyles = timeStyles;
    this.listStyles = listStyles;
    this.formatters = formatters;
  }

  abstract renderElement(locale: string, tagName: string, attributes: Record<string, string>, children: T[]): T;

  formatArgument(locale: string, value: unknown, type: string | undefined, style: string | undefined): string {
    if (type !== undefined && this.formatters.hasOwnProperty(type)) {
      return this.formatters[type](value, style);
    }

    if (type === 'number' && (typeof value === 'number' || typeof value === 'bigint')) {
      return getCachedNumberFormat(locale, (style && this.numberStyles[style]) || defaultOptions).format(value);
    }

    if (type === 'date' && (typeof value === 'number' || value instanceof Date)) {
      return getCachedDateTimeFormat(locale, (style && this.dateStyles[style]) || defaultOptions).format(value);
    }

    if (type === 'time' && (typeof value === 'number' || value instanceof Date)) {
      return getCachedDateTimeFormat(locale, (style && this.timeStyles[style]) || defaultOptions).format(value);
    }

    if (type === 'list' && Array.isArray(value)) {
      return getCachedListFormat(locale, (style && this.listStyles[style]) || defaultOptions).format(value);
    }

    if (value === null || value === undefined || value !== value) {
      return '';
    }

    return '' + value;
  }

  selectCategory(locale: string, value: unknown, type: string, categories: string[]): string | undefined {
    let category = '=' + value;

    if (categories.includes(category)) {
      return category;
    }

    if ((type === 'plural' || type === 'selectordinal') && typeof value === 'number') {
      category = getCachedPluralRules(locale, type === 'plural' ? cardinalOptions : ordinalOptions).select(value);
    } else if (type === 'select') {
      category = '' + value;
    } else {
      category = 'other';
    }

    return categories.includes(category) ? category : categories.includes('other') ? 'other' : undefined;
  }
}

const defaultOptions = {};

const cardinalOptions: Intl.PluralRulesOptions = { type: 'cardinal' };

const ordinalOptions: Intl.PluralRulesOptions = { type: 'ordinal' };

const getCachedDateTimeFormat = createCachedFactory((locale, options) => new Intl.DateTimeFormat(locale, options));

const getCachedNumberFormat = createCachedFactory((locale, options) => new Intl.NumberFormat(locale, options));

const getCachedListFormat = createCachedFactory((locale, options) => new Intl.ListFormat(locale, options));

const getCachedPluralRules = createCachedFactory((locale, options) => new Intl.PluralRules(locale, options));

function createCachedFactory<O extends object, V>(
  factory: (locale: string, options: O) => V
): (locale: string, options: O) => V {
  const localeCache = new Map<string, WeakMap<O, V>>();

  return (locale, options) => {
    let optionsCache = localeCache.get(locale);

    if (optionsCache === undefined) {
      optionsCache = new WeakMap();
      localeCache.set(locale, optionsCache);
    }

    let result = optionsCache.get(options);

    if (result === undefined) {
      result = factory(locale, options);
      optionsCache.set(options, result);
    }

    return result;
  };
}
