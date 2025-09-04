/**
 * Renders elements and arguments.
 *
 * @template Element The type of a rendered element.
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
   * @param locale The message locale.
   * @param value The value of an argument.
   * @param type The type of an argument.
   * @param style The formatting style to apply.
   * @param options The argument options.
   * @returns Formatted argument value.
   */
  formatArgument(
    locale: string,
    value: unknown,
    type: string | undefined,
    style: string | undefined,
    options: Record<string, string> | undefined
  ): string;

  /**
   * Returns the selected category depending of an ICU argument value.
   *
   * @param locale The message locale.
   * @param value The value of an argument.
   * @param type The type of the select node ("plural", "selectordinal", "select").
   * @param categories The array of categories available for the argument.
   * @param options The argument options.
   * @returns The selected category, or `undefined` if there's no matching category.
   */
  selectCategory(
    locale: string,
    value: unknown,
    type: string,
    categories: string[],
    options: Record<string, string> | undefined
  ): string | undefined;
}

export type Formatter = (
  locale: string,
  value: unknown,
  type: string | undefined,
  style: string | undefined,
  options: Record<string, string> | undefined
) => string | void;

export interface RendererOptions {
  formatters?: Formatter[];
}

export function createRenderer<Element>(options: RendererOptions = {}): Renderer<Element> {
  const { formatters = [] } = options;

  return {
    renderElement(_tagName, _attributes, _children) {
      return '';
    },

    formatArgument(locale, value, type, style, options) {
      for (const formatter of formatters) {
        const formattedValue = formatter(locale, value, type, style, options);

        if (formattedValue !== undefined) {
          return formattedValue;
        }
      }

      return '' + value;
    },

    selectCategory(locale, value, type, categories, _options) {
      let category = '=' + value;

      if ((type === 'plural' || type === 'selectordinal' || type === 'select') && categories.includes(category)) {
        return category;
      }

      if ((type === 'plural' || type === 'selectordinal') && typeof value === 'number') {
        category = new Intl.PluralRules(locale, { type: type === 'plural' ? 'cardinal' : 'ordinal' }).select(value);
      } else if (type === 'select') {
        category = '' + value;
      } else {
        category = 'other';
      }

      return categories.includes(category) ? category : categories.includes('other') ? 'other' : undefined;
    },
  };
}

export function createNumberFormatter(type: string, options?: Intl.NumberFormatOptions): Formatter;

export function createNumberFormatter(type: string, style: string, options?: Intl.NumberFormatOptions): Formatter;

export function createNumberFormatter(
  type: string,
  style?: string | Intl.NumberFormatOptions,
  options?: Intl.NumberFormatOptions
): Formatter {
  return (locale, value, actualType, actualStyle, actualOptions) => {
    if (
      type !== actualType ||
      (typeof value !== 'number' && typeof value !== 'bigint') ||
      (typeof style === 'string' && style !== actualStyle)
    ) {
      return;
    }

    return new Intl.NumberFormat(
      locale,
      style === undefined ? actualOptions : typeof style === 'string' ? { ...options, ...actualOptions } : style
    ).format(value);
  };
}

export function createDateTimeFormatter(type: string, options?: Intl.DateTimeFormatOptions): Formatter;

export function createDateTimeFormatter(type: string, style: string, options?: Intl.DateTimeFormatOptions): Formatter;

export function createDateTimeFormatter(
  type: string,
  style?: string | Intl.DateTimeFormatOptions,
  options?: Intl.DateTimeFormatOptions
): Formatter {
  return (locale, value, actualType, actualStyle, actualOptions) => {
    if (
      type !== actualType ||
      (typeof value !== 'number' && !(value instanceof Date)) ||
      (typeof style === 'string' && style !== actualStyle)
    ) {
      return;
    }

    return new Intl.DateTimeFormat(
      locale,
      style === undefined ? actualOptions : typeof style === 'string' ? options : { ...style, ...actualOptions }
    ).format(value);
  };
}

createRenderer({
  formatters: [
    createNumberFormatter('number', 'decimal', { style: 'decimal' }),
    createNumberFormatter('number', 'percent', { style: 'percent' }),
    createNumberFormatter('number'),

    createDateTimeFormatter('date', 'short', { dateStyle: 'short' }),
    createDateTimeFormatter('date', 'full', { dateStyle: 'full' }),
    createDateTimeFormatter('date', 'long', { dateStyle: 'long' }),
    createDateTimeFormatter('date', 'medium', { dateStyle: 'medium' }),
    createDateTimeFormatter('date', { dateStyle: 'medium' }),

    createDateTimeFormatter('time', 'short', { timeStyle: 'short' }),
    createDateTimeFormatter('time', 'full', { timeStyle: 'full' }),
    createDateTimeFormatter('time', 'long', { timeStyle: 'long' }),
    createDateTimeFormatter('time', 'medium', { timeStyle: 'medium' }),
    createDateTimeFormatter('time', { timeStyle: 'medium' }),
  ],
});
