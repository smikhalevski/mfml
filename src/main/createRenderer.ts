/**
 * Params provided to a {@link Renderer.formatArgument}.
 *
 * @group Renderer
 */
export interface FormatArgumentParams {
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
 * Params provided to a {@link Renderer.selectCategory}.
 *
 * @group Renderer
 */
export interface SelectCategoryParams {
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
 * Renders elements and arguments.
 *
 * @template Element The rendered element.
 * @group Renderer
 */
export interface Renderer<Element> {
  /**
   * Renders an element.
   *
   * @param tagName The element tag name.
   * @param attributes Attributes of an element.
   * @param children Children of an element.
   * @returns Rendering result.
   */
  renderElement(
    tagName: string,
    attributes: Record<string, string>,
    children: Array<Element | string>
  ): Element | string;

  /**
   * Formats argument value as a string.
   *
   * @param params The params use for formatting.
   * @returns Formatted argument value.
   */
  formatArgument(params: FormatArgumentParams): string;

  /**
   * Returns the selected category depending of an argument value.
   *
   * @param params The params use for category selection.
   * @returns The selected category, or `undefined` if there's no matching category.
   */
  selectCategory(params: SelectCategoryParams): string | undefined;
}

/**
 * Renders an element.
 *
 * @param tagName The element tag name.
 * @param attributes Attributes of an element.
 * @param children Children of an element.
 * @returns Rendering result or `undefined` if renderer cannot render the requested element.
 * @group Renderer
 */
export type ElementRenderer<Element> = (
  tagName: string,
  attributes: Record<string, string>,
  children: Array<Element | string>
) => Element | string | undefined;

/**
 * A callback that formats an argument value or returns `undefined` if value cannot be formatted.
 *
 * @param params Formatting params.
 * @group Renderer
 */
export type Formatter = (params: FormatArgumentParams) => string | undefined;

/**
 * Options of {@link createRenderer}.
 *
 * @template Element The rendered element.
 * @group Renderer
 */
export interface RendererOptions<Element> {
  /**
   * Element renderers.
   */
  elementRenderers: ElementRenderer<Element>[];

  /**
   * Argument formatters.
   */
  formatters: Formatter[];
}

/**
 * Creates a new {@link Renderer}.
 *
 * @param options Renderer options.
 * @group Renderer
 */
export function createRenderer<Element>(options: RendererOptions<Element>): Renderer<Element> {
  const { elementRenderers, formatters } = options;

  return {
    renderElement(tagName, attributes, children) {
      for (const elementRenderer of elementRenderers) {
        const element = elementRenderer(tagName, attributes, children);

        if (element !== undefined) {
          return element;
        }
      }

      return '';
    },

    formatArgument(params) {
      for (const formatter of formatters) {
        const formattedValue = formatter(params);

        if (formattedValue !== undefined) {
          return formattedValue;
        }
      }

      return '' + params.value;
    },

    selectCategory,
  };
}

/**
 * Selects an argument value category.
 *
 * @param params The params use for category selection.
 * @returns The selected category, or `undefined` if there's no matching category.
 */
export function selectCategory(params: SelectCategoryParams): string | undefined {
  const { value, type, locale, categories } = params;

  let selectedCategory = '=' + value;

  if ((type === 'plural' || type === 'selectordinal' || type === 'select') && categories.includes(selectedCategory)) {
    return selectedCategory;
  }

  if ((type === 'plural' || type === 'selectordinal') && typeof value === 'number') {
    selectedCategory = getPluralRules(locale, type === 'plural' ? cardinalOptions : ordinalOptions).select(value);
  } else if (type === 'select') {
    selectedCategory = '' + value;
  } else {
    selectedCategory = 'other';
  }

  return categories.includes(selectedCategory) ? selectedCategory : categories.includes('other') ? 'other' : undefined;
}

const defaultOptions = {};

export type IntlFactory<O, R> = (locale: string, options?: O) => R;

export function cacheIntlFactory<O extends object, R>(factory: IntlFactory<O, R>): IntlFactory<O, R> {
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

const cardinalOptions: Intl.PluralRulesOptions = { type: 'cardinal' };

const ordinalOptions: Intl.PluralRulesOptions = { type: 'ordinal' };

const getPluralRules = cacheIntlFactory((locale, options) => new Intl.PluralRules(locale, options));

const getNumberFormat = cacheIntlFactory((locale, options) => new Intl.NumberFormat(locale, options));

const getDateTimeFormat = cacheIntlFactory((locale, options) => new Intl.DateTimeFormat(locale, options));

const getListFormat = cacheIntlFactory((locale, options) => new Intl.ListFormat(locale, options));

export function createNumberFormatter(
  type: string,
  style: string | null = null,
  options?: Intl.NumberFormatOptions
): Formatter {
  return params => {
    if (
      // Unrelated type
      type !== params.type ||
      // Unrelated style
      style !== params.style ||
      // Unsupported value
      (typeof params.value !== 'number' && typeof params.value !== 'bigint')
    ) {
      return;
    }

    const formatOptions =
      params.options === null ? options : options === undefined ? params.options : { ...options, ...params.options };

    return getNumberFormat(params.locale, formatOptions).format(params.value);
  };
}

export function createDateTimeFormatter(
  type: string,
  style: string | null = null,
  options?: Intl.DateTimeFormatOptions
): Formatter {
  return params => {
    if (
      // Unrelated type
      type !== params.type ||
      // Unrelated style
      style !== params.style ||
      // Unsupported value
      (typeof params.value !== 'number' && !(params.value instanceof Date))
    ) {
      return;
    }

    const formatOptions =
      params.options === null ? options : options === undefined ? params.options : { ...options, ...params.options };

    return getDateTimeFormat(params.locale, formatOptions).format(params.value);
  };
}

export function createListFormatter(
  type: string,
  style: string | null = null,
  options?: Intl.ListFormatOptions
): Formatter {
  return params => {
    if (
      // Unrelated type
      type !== params.type ||
      // Unrelated style
      style !== params.style ||
      // Unsupported value
      !Array.isArray(params.value)
    ) {
      return;
    }

    const formatOptions =
      params.options === null ? options : options === undefined ? params.options : { ...options, ...params.options };

    return getListFormat(params.locale, formatOptions).format(params.value);
  };
}

export const defaultFormatters: Formatter[] = [
  createNumberFormatter('number', 'decimal', { style: 'decimal' }),
  createNumberFormatter('number', 'percent', { style: 'percent' }),
  createNumberFormatter('number'),

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
];
