/**
 * Describes how element, argument and select nodes of an MFML AST are rendered.
 *
 * @template Element The type of a rendered element.
 * @group Renderer
 */
export interface Renderer<Element> {
  /**
   * Renders an element.
   *
   * @param locale The message locale.
   * @param tagName The element tag name.
   * @param attributes Attributes of an element.
   * @param children Children of an element.
   * @returns Rendering result.
   */
  renderElement(
    locale: string,
    tagName: string,
    attributes: Record<string, string>,
    children: Array<Element | string>
  ): Element | string;

  /**
   * Formats argument value as a string.
   *
   * @param locale The message locale.
   * @param value The value of an argument.
   * @param type The type of an argument.
   * @param style The formatting style to apply.
   * @returns Formatted argument value.
   */
  formatArgument(locale: string, value: unknown, type: string | undefined, style: string | undefined): string;

  /**
   * Returns the select category name depending of an ICU argument value.
   *
   * @param locale The message locale.
   * @param value The value of an argument.
   * @param type The type of the select node ("plural", "selectordinal", "select").
   * @param categories The array of categories available in the select node.
   * @returns The selected category, or `undefined` if there's no matching category.
   */
  selectCategory(locale: string, value: unknown, type: string, categories: string[]): string | undefined;
}

/**
 * Options of the {@link AbstractRenderer}.
 *
 * @group Renderer
 */
export interface AbstractRendererOptions {
  /**
   * Formatting styles used for "number" argument type.
   */
  numberStyles?: Record<string, Intl.NumberFormatOptions>;

  /**
   * Formatting styles used for "date" argument type.
   */
  dateStyles?: Record<string, Intl.DateTimeFormatOptions>;

  /**
   * Formatting styles used for "time" argument type.
   */
  timeStyles?: Record<string, Intl.DateTimeFormatOptions>;

  /**
   * Formatting styles used for "list" argument type.
   */
  listStyles?: Record<string, Intl.ListFormatOptions>;

  /**
   * Map from an attribute type to a custom formatter function.
   */
  formatters?: Record<string, (value: unknown, style: string | undefined) => string>;
}

/**
 * The message renderer that provides the default implementation of argument formatting and select matching.
 *
 * @template Element The type of a rendered element.
 * @group Renderer
 */
export abstract class AbstractRenderer<Element> implements Renderer<Element> {
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
   * Creates a new {@link AbstractRenderer} instance.
   *
   * @param options Rendering options.
   */
  constructor(options: AbstractRendererOptions = {}) {
    const { numberStyles = {}, dateStyles = {}, timeStyles = {}, listStyles = {}, formatters = {} } = options;

    this.numberStyles = numberStyles;
    this.dateStyles = dateStyles;
    this.timeStyles = timeStyles;
    this.listStyles = listStyles;
    this.formatters = formatters;
  }

  abstract renderElement(
    locale: string,
    tagName: string,
    attributes: Record<string, string>,
    children: Array<Element | string>
  ): Element | string;

  formatArgument(locale: string, value: unknown, type: string | undefined, style: string | undefined): string {
    if (type !== undefined && this.formatters.hasOwnProperty(type)) {
      return this.formatters[type](value, style);
    }

    if (type === 'number' && (typeof value === 'number' || typeof value === 'bigint')) {
      return getCachedNumberFormat(locale, getStyleOptions(this.numberStyles, style)).format(value);
    }

    if (type === 'date' && (typeof value === 'number' || value instanceof Date)) {
      return getCachedDateTimeFormat(locale, getStyleOptions(this.dateStyles, style)).format(value);
    }

    if (type === 'time' && (typeof value === 'number' || value instanceof Date)) {
      return getCachedDateTimeFormat(locale, getStyleOptions(this.timeStyles, style)).format(value);
    }

    if (type === 'list' && Array.isArray(value)) {
      return getCachedListFormat(locale, getStyleOptions(this.listStyles, style)).format(value);
    }

    if (value === null || value === undefined || value !== value) {
      return '';
    }

    return '' + value;
  }

  selectCategory(locale: string, value: unknown, type: string, categories: string[]): string | undefined {
    let category = '=' + value;

    if ((type === 'plural' || type === 'selectordinal' || type === 'select') && categories.includes(category)) {
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

function getStyleOptions<T>(styles: Record<string, T>, style: string | undefined): T {
  if (style !== undefined && styles.hasOwnProperty(style)) {
    return styles[style];
  }
  return defaultStyleOptions as T;
}

const defaultStyleOptions = {};

const cardinalOptions: Intl.PluralRulesOptions = { type: 'cardinal' };

const ordinalOptions: Intl.PluralRulesOptions = { type: 'ordinal' };

const getCachedDateTimeFormat = createCachedFactory((locale, options) => new Intl.DateTimeFormat(locale, options));

const getCachedNumberFormat = createCachedFactory((locale, options) => new Intl.NumberFormat(locale, options));

const getCachedListFormat = createCachedFactory((locale, options) => new Intl.ListFormat(locale, options));

const getCachedPluralRules = createCachedFactory((locale, options) => new Intl.PluralRules(locale, options));

function createCachedFactory<O extends object, V>(
  factory: (locale: string, options?: O) => V
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
