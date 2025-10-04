import { getDateTimeFormat, getDisplayNames, getListFormat, getNumberFormat, mergeOptions } from './utils.js';

/**
 * Params provided to a {@link ArgumentFormatter}.
 *
 * @group Argument Formatter
 */
export interface ArgumentFormatterParams {
  /**
   * The value of an argument.
   */
  value: unknown;

  /**
   * The message locale.
   */
  locale: string;

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
 * @returns The formatted argument value, or `undefined` if a value cannot be formatted.
 * @group Argument Formatter
 */
export type ArgumentFormatter = (params: ArgumentFormatterParams) => unknown;

/**
 * Creates an argument formatter that sequentially applies each formatter from the list of formatters until one returns
 * a formatted value. If none of the formatters returns a formatted value, then a value returned as-is.
 *
 * @param formatters The array of formatters to try.
 * @group Argument Formatter
 */
export function combineArgumentFormatters(formatters: ArgumentFormatter[]): ArgumentFormatter {
  return params => {
    for (const formatter of formatters) {
      const value = formatter(params);

      if (value !== undefined) {
        return value;
      }
    }

    return params.value;
  };
}

/**
 * Creates a formatter that uses {@link Intl.NumberFormat} to format numeric argument values.
 *
 * @param type The required argument type, or `null` if type shouldn't be specified.
 * @param style The required argument style, or `null` if style shouldn't be specified.
 * @param options Number format options.
 * @group Argument Formatter
 */
export function createNumberArgumentFormatter(
  type: string | null,
  style: string | null,
  options?: Intl.NumberFormatOptions
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
 * Creates a formatter that uses {@link Intl.DateTimeFormat} to format numeric and {@link Date} argument values.
 *
 * @param type The required argument type, or `null` if type shouldn't be specified.
 * @param style The required argument style, or `null` if style shouldn't be specified.
 * @param options Date-time format options.
 * @group Argument Formatter
 */
export function createDateTimeArgumentFormatter(
  type: string | null,
  style: string | null,
  options?: Intl.DateTimeFormatOptions
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
 * Creates a formatter that uses {@link Intl.ListFormat} to format string array argument values.
 *
 * @param type The required argument type, or `null` if type shouldn't be specified.
 * @param style The required argument style, or `null` if style shouldn't be specified.
 * @param options List format options.
 * @group Argument Formatter
 */
export function createListArgumentFormatter(
  type: string | null,
  style: string | null,
  options?: Intl.ListFormatOptions
): ArgumentFormatter {
  return params => {
    if (type === params.type && style === params.style && Array.isArray(params.value)) {
      return getListFormat(params.locale, mergeOptions(options, params.options)).format(params.value);
    }
  };
}

/**
 * Creates a formatter that uses {@link Intl.DisplayNames} to format translations of language, region and script
 * display names.
 *
 * @param type The required argument type, or `null` if type shouldn't be specified.
 * @param style The required argument style, or `null` if style shouldn't be specified.
 * @param options Display name format options.
 * @group Argument Formatter
 */
export function createDisplayNameArgumentFormatter(
  type: string | null,
  style: string | null,
  options: Intl.DisplayNamesOptions
): ArgumentFormatter {
  return params => {
    if (type === params.type && style === params.style && typeof params.value === 'string') {
      return getDisplayNames(params.locale, mergeOptions(options, params.options)).of(params.value);
    }
  };
}

/**
 * The default argument formatter.
 *
 * @group Argument Formatter
 */
export const defaultArgumentFormatter = combineArgumentFormatters([
  createNumberArgumentFormatter(null, null),
  createNumberArgumentFormatter('number', null),
  createNumberArgumentFormatter('number', 'decimal'),
  createNumberArgumentFormatter('number', 'integer', { maximumFractionDigits: 0 }),
  createNumberArgumentFormatter('number', 'percent', { style: 'percent' }),
  createNumberArgumentFormatter('number', 'currency', { style: 'currency', currency: 'USD' }),

  createDateTimeArgumentFormatter(null, null),
  createDateTimeArgumentFormatter('date', null),
  createDateTimeArgumentFormatter('date', 'short', { dateStyle: 'short' }),
  createDateTimeArgumentFormatter('date', 'full', { dateStyle: 'full' }),
  createDateTimeArgumentFormatter('date', 'long', { dateStyle: 'long' }),
  createDateTimeArgumentFormatter('date', 'medium', { dateStyle: 'medium' }),

  createDateTimeArgumentFormatter('time', null, { timeStyle: 'short' }),
  createDateTimeArgumentFormatter('time', 'short', { timeStyle: 'short' }),
  createDateTimeArgumentFormatter('time', 'full', { timeStyle: 'full' }),
  createDateTimeArgumentFormatter('time', 'long', { timeStyle: 'long' }),
  createDateTimeArgumentFormatter('time', 'medium', { timeStyle: 'medium' }),

  createListArgumentFormatter('conjunction', null),
  createListArgumentFormatter('conjunction', 'long', { type: 'conjunction', style: 'long' }),
  createListArgumentFormatter('conjunction', 'narrow', { type: 'conjunction', style: 'narrow' }),
  createListArgumentFormatter('conjunction', 'short', { type: 'conjunction', style: 'short' }),

  createListArgumentFormatter('disjunction', null, { type: 'disjunction' }),
  createListArgumentFormatter('disjunction', 'long', { type: 'disjunction', style: 'long' }),
  createListArgumentFormatter('disjunction', 'narrow', { type: 'disjunction', style: 'narrow' }),
  createListArgumentFormatter('disjunction', 'short', { type: 'disjunction', style: 'short' }),
]);
