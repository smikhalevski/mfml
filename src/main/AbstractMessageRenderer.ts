import { MessageRenderer, MessageRendererOptions } from './types.js';

/**
 * The message renderer the provides the default implementation of text, argument and select rendering that matches the
 * default ICU behavior.
 *
 * @template T The rendering result (string, `ReactNode`).
 */
export abstract class AbstractMessageRenderer<T> implements MessageRenderer<T | string> {
  /**
   * Number formatting styles.
   */
  numberStyles: Record<string, Intl.NumberFormatOptions>;

  /**
   * Date formatting styles.
   */
  dateStyles: Record<string, Intl.DateTimeFormatOptions>;

  /**
   * Time formatting styles.
   */
  timeStyles: Record<string, Intl.DateTimeFormatOptions>;

  /**
   * Creates a new {@link AbstractMessageRenderer} instance.
   *
   * @param options Rendering options.
   */
  constructor(options: MessageRendererOptions = {}) {
    const { numberStyles = {}, dateStyles = {}, timeStyles = {} } = options;

    this.numberStyles = numberStyles;
    this.dateStyles = dateStyles;
    this.timeStyles = timeStyles;
  }

  renderText(_locale: string, text: string): T | string {
    return text;
  }

  abstract renderElement(
    locale: string,
    tagName: string,
    attributes: { readonly [name: string]: ReadonlyArray<T | string> | T | string },
    children: ReadonlyArray<T | string> | T | string
  ): T;

  renderArgumentValue(
    locale: string,
    argumentValue: unknown,
    argumentType: string | undefined,
    argumentStyle: string | undefined
  ): T | string {
    if (argumentType === 'number' && (typeof argumentValue === 'number' || typeof argumentValue === 'bigint')) {
      const options = argumentStyle === undefined ? defaultOptions : this.numberStyles[argumentStyle] || defaultOptions;

      return getCachedNumberFormat(locale, options).format(argumentValue);
    }

    if (argumentType === 'date' && (typeof argumentValue === 'number' || argumentValue instanceof Date)) {
      const options = argumentStyle === undefined ? defaultOptions : this.dateStyles[argumentStyle] || defaultOptions;

      return getCachedDateTimeFormat(locale, options).format(argumentValue);
    }

    if (argumentType === 'time' && (typeof argumentValue === 'number' || argumentValue instanceof Date)) {
      const options = argumentStyle === undefined ? defaultOptions : this.timeStyles[argumentStyle] || defaultOptions;

      return getCachedDateTimeFormat(locale, options).format(argumentValue);
    }

    if (argumentValue === null || argumentValue === undefined || argumentValue !== argumentValue) {
      return '';
    }

    return '' + argumentValue;
  }

  selectCategory(
    locale: string,
    argumentValue: unknown,
    selectType: string,
    selectCategories: readonly string[]
  ): string | undefined {
    let category = '=' + argumentValue;

    if (selectCategories.includes(category)) {
      return category;
    }

    if ((selectType === 'plural' || selectType === 'selectordinal') && typeof argumentValue === 'number') {
      const options = selectType === 'plural' ? cardinalOptions : ordinalOptions;

      category = getCachedPluralRules(locale, options).select(argumentValue);
    } else if (selectType === 'select') {
      category = '' + argumentValue;
    } else {
      category = 'other';
    }

    return selectCategories.includes(category) ? category : selectCategories.includes('other') ? 'other' : undefined;
  }
}

const defaultOptions = {};

const cardinalOptions: Intl.PluralRulesOptions = { type: 'cardinal' };

const ordinalOptions: Intl.PluralRulesOptions = { type: 'ordinal' };

const getCachedDateTimeFormat = createCachedFactory((locale, options) => new Intl.DateTimeFormat(locale, options));

const getCachedNumberFormat = createCachedFactory((locale, options) => new Intl.NumberFormat(locale, options));

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
