import { getDateTimeFormat, getDisplayNames, getListFormat, getNumberFormat } from './intl.js';

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
   * The type of format to apply ("number", "date", "plural", "selectOrdinal", "select", etc.) or `null` if type
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
  options: Record<string, any> | null;
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
 * The default formatter.
 *
 * @group Formatter
 */
export const defaultArgumentFormatter = createWaterfallArgumentFormatter([
  createNumberArgumentFormatter(null, null, { style: 'decimal' }),
  createNumberArgumentFormatter('number', null, { style: 'decimal' }),
  createNumberArgumentFormatter('number', 'decimal', { style: 'decimal' }),
  createNumberArgumentFormatter('number', 'integer', { style: 'decimal', maximumFractionDigits: 0 }),
  createNumberArgumentFormatter('number', 'percent', { style: 'percent' }),
  createNumberArgumentFormatter('number', 'currency', { style: 'currency', currency: 'USD' }),

  createDateTimeArgumentFormatter(null, null, { dateStyle: 'medium' }),
  createDateTimeArgumentFormatter('date', null, { dateStyle: 'medium' }),
  createDateTimeArgumentFormatter('date', 'short', { dateStyle: 'short' }),
  createDateTimeArgumentFormatter('date', 'full', { dateStyle: 'full' }),
  createDateTimeArgumentFormatter('date', 'long', { dateStyle: 'long' }),
  createDateTimeArgumentFormatter('date', 'medium', { dateStyle: 'medium' }),

  createDateTimeArgumentFormatter('time', null, { timeStyle: 'medium' }),
  createDateTimeArgumentFormatter('time', 'short', { timeStyle: 'short' }),
  createDateTimeArgumentFormatter('time', 'full', { timeStyle: 'full' }),
  createDateTimeArgumentFormatter('time', 'long', { timeStyle: 'long' }),
  createDateTimeArgumentFormatter('time', 'medium', { timeStyle: 'medium' }),

  createListArgumentFormatter('conjunction', null, { type: 'conjunction', style: 'long' }),
  createListArgumentFormatter('conjunction', 'long', { type: 'conjunction', style: 'long' }),
  createListArgumentFormatter('conjunction', 'narrow', { type: 'conjunction', style: 'narrow' }),
  createListArgumentFormatter('conjunction', 'short', { type: 'conjunction', style: 'short' }),

  createListArgumentFormatter('disjunction', null, { type: 'disjunction', style: 'long' }),
  createListArgumentFormatter('disjunction', 'long', { type: 'disjunction', style: 'long' }),
  createListArgumentFormatter('disjunction', 'narrow', { type: 'disjunction', style: 'narrow' }),
  createListArgumentFormatter('disjunction', 'short', { type: 'disjunction', style: 'short' }),
]);

/**
 * Creates an argument formatter that sequentially applies every formatter from formatters, until one of them returns a
 * formatted value. If non of the formatters returns a formatted value then a stringified value is returned.
 *
 * @param formatters The array of formatters to try.
 */
export function createWaterfallArgumentFormatter(formatters: ArgumentFormatter[]): ArgumentFormatter {
  return params => {
    for (const formatter of formatters) {
      const formattedValue = formatter(params);

      if (formattedValue !== undefined) {
        return formattedValue;
      }
    }

    return params.value === null || params.value === undefined ? undefined : '' + params.value;
  };
}

export function createNumberArgumentFormatter(
  type: string | null,
  style: string | null,
  formatOptions: Intl.NumberFormatOptions
): ArgumentFormatter {
  return params => {
    const { value } = params;

    if (type === params.type && style === params.style && (typeof value === 'number' || typeof value === 'bigint')) {
      return getNumberFormat(params.locale, mergeOptions(formatOptions, params.options)).format(value);
    }
  };
}

export function createDateTimeArgumentFormatter(
  type: string | null,
  style: string | null,
  formatOptions: Intl.DateTimeFormatOptions
): ArgumentFormatter {
  return params => {
    const { value } = params;

    if (type === params.type && style === params.style && (typeof value === 'number' || value instanceof Date)) {
      return getDateTimeFormat(params.locale, mergeOptions(formatOptions, params.options)).format(value);
    }
  };
}

export function createListArgumentFormatter(
  type: string | null,
  style: string | null,
  formatOptions: Intl.ListFormatOptions
): ArgumentFormatter {
  return params => {
    const { value } = params;

    if (
      type === params.type &&
      style === params.style &&
      Array.isArray(value) &&
      value.every(v => typeof v === 'string')
    ) {
      return getListFormat(params.locale, mergeOptions(formatOptions, params.options)).format(value);
    }
  };
}

export function createDisplayNameArgumentFormatter(
  type: string | null,
  style: string | null,
  options: Intl.DisplayNamesOptions
): ArgumentFormatter {
  return params => {
    const { value } = params;

    if (type === params.type && style === params.style && typeof value === 'string') {
      try {
        return getDisplayNames(params.locale, mergeOptions(options, params.options)).of(value);
      } catch {}
    }
  };
}

function mergeOptions<T>(formatOptions: T, argumentOptions: object | null): T {
  return argumentOptions === null ? formatOptions : { ...formatOptions, ...argumentOptions };
}
