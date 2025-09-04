import { getDateTimeFormat, getDisplayNames, getListFormat, getNumberFormat, mergeOptions } from './utils.js';

/**
 * Params provided to a {@link Formatter}.
 *
 * @group Formatter
 */
export interface FormatterParams {
  /**
   * The value of an argument.
   */
  value: any;

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
 * @group Formatter
 */
export type Formatter = (params: FormatterParams) => string | undefined;

/**
 * Creates an argument formatter that sequentially applies each formatter from the list of formatters until one returns
 * a formatted value. If none of the formatters returns a formatted value, a stringified value is returned instead.
 *
 * @param formatters The array of formatters to try.
 * @group Formatter
 */
export function createWaterfallFormatter(formatters: Formatter[]): Formatter {
  return params => {
    for (const formatter of formatters) {
      const value = formatter(params);

      if (value !== undefined) {
        return value;
      }
    }

    return params.value === null || params.value === undefined ? undefined : '' + params.value;
  };
}

/**
 * Creates a formatter that uses {@link Intl.NumberFormat} to format numeric argument values.
 *
 * @param type The required argument type, or `null` if type shouldn't be specified.
 * @param style The required argument style, or `null` if style shouldn't be specified.
 * @param options Number format options.
 * @group Formatter
 */
export function createNumberFormatter(
  type: string | null,
  style: string | null,
  options?: Intl.NumberFormatOptions
): Formatter {
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
 * @group Formatter
 */
export function createDateTimeFormatter(
  type: string | null,
  style: string | null,
  options?: Intl.DateTimeFormatOptions
): Formatter {
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
 * @group Formatter
 */
export function createListFormatter(
  type: string | null,
  style: string | null,
  options?: Intl.ListFormatOptions
): Formatter {
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
 * @group Formatter
 */
export function createDisplayNameFormatter(
  type: string | null,
  style: string | null,
  options: Intl.DisplayNamesOptions
): Formatter {
  return params => {
    if (type === params.type && style === params.style && typeof params.value === 'string') {
      return getDisplayNames(params.locale, mergeOptions(options, params.options)).of(params.value);
    }
  };
}

/**
 * The default formatter.
 *
 * @group Formatter
 */
export const defaultFormatter = createWaterfallFormatter([
  createNumberFormatter(null, null),
  createNumberFormatter('number', null),
  createNumberFormatter('number', 'decimal'),
  createNumberFormatter('number', 'integer', { maximumFractionDigits: 0 }),
  createNumberFormatter('number', 'percent', { style: 'percent' }),
  createNumberFormatter('number', 'currency', { style: 'currency', currency: 'USD' }),

  createDateTimeFormatter(null, null),
  createDateTimeFormatter('date', null),
  createDateTimeFormatter('date', 'short', { dateStyle: 'short' }),
  createDateTimeFormatter('date', 'full', { dateStyle: 'full' }),
  createDateTimeFormatter('date', 'long', { dateStyle: 'long' }),
  createDateTimeFormatter('date', 'medium', { dateStyle: 'medium' }),

  createDateTimeFormatter('time', null),
  createDateTimeFormatter('time', 'short', { timeStyle: 'short' }),
  createDateTimeFormatter('time', 'full', { timeStyle: 'full' }),
  createDateTimeFormatter('time', 'long', { timeStyle: 'long' }),
  createDateTimeFormatter('time', 'medium', { timeStyle: 'medium' }),

  createListFormatter('conjunction', null),
  createListFormatter('conjunction', 'long', { type: 'conjunction', style: 'long' }),
  createListFormatter('conjunction', 'narrow', { type: 'conjunction', style: 'narrow' }),
  createListFormatter('conjunction', 'short', { type: 'conjunction', style: 'short' }),

  createListFormatter('disjunction', null, { type: 'disjunction' }),
  createListFormatter('disjunction', 'long', { type: 'disjunction', style: 'long' }),
  createListFormatter('disjunction', 'narrow', { type: 'disjunction', style: 'narrow' }),
  createListFormatter('disjunction', 'short', { type: 'disjunction', style: 'short' }),
]);
