import {pluralCategories} from './pluralCategories';
import {IMessageRuntime, RuntimeMethod} from './runtime-types';

/**
 * The locale matching algorithm:
 * 1. Lookup exact `locale` in `locales`;
 * 2. Lookup a language-only locale;
 * 3. Lookup the first locale in `locales` with the same language as `locale`;
 * 4. Return -1.
 *
 * **Note:** This function doesn't validate or normalize provided locales. Valid locales look like "en", "en_US",
 * "en-US", "en-us" or "en_US.UTF-8".
 *
 * @param locale The locale to match.
 * @param locales The list of known locales.
 * @returns An index of locale in `locales` or -1 if no locale matched.
 */
export function matchLocaleOrLanguage(locale: string, locales: Array<string>): number {

  // Lookup exact match
  let index = locales.indexOf(locale);
  if (index !== -1) {
    return index;
  }

  const charCode0 = locale.charCodeAt(0);
  const charCode1 = locale.charCodeAt(1);

  // Lookup a language-only locale
  if (locale.length !== 2) {
    for (let i = 0; i < locales.length; ++i) {
      const otherLocale = locales[i];
      if (otherLocale.length === 2 && otherLocale.charCodeAt(0) === charCode0 && otherLocale.charCodeAt(1) === charCode1) {
        return i;
      }
    }
  }

  // Lookup any locale with the same language
  for (let i = 0; i < locales.length; i++) {
    const otherLocale = locales[i];
    if (otherLocale.length !== 2 && otherLocale.charCodeAt(0) === charCode0 && otherLocale.charCodeAt(1) === charCode1) {
      return i;
    }
  }

  // No match
  return -1;
}

/**
 * Returns the index of `value` among `caseKeys`.
 */
export function exactMatchSelect(value: unknown, ...caseKeys: Array<string>): number;

export function exactMatchSelect(value: unknown): number {
  for (let i = 1; i < arguments.length; ++i) {
    if (arguments[i] === value) {
      return i - 1;
    }
  }
  return -1;
}

export interface IFunctionRendererOptions {
  dateTimeStyles?: Record<string, Intl.DateTimeFormatOptions>;
  numberStyles?: Record<string, Intl.NumberFormatOptions>;
  renderFallback: IMessageRuntime<unknown>[RuntimeMethod.FUNCTION];
}

export function createFunctionRenderer(options: IFunctionRendererOptions): IMessageRuntime<any>[RuntimeMethod.FUNCTION] {

  const {
    dateTimeStyles,
    numberStyles,
    renderFallback,
  } = options;

  const dateTimeFormatters: Record<string, DateTimeFormatter> = {
    default: createDateTimeFormatter(),
  };
  const numberFormatters: Record<string, NumberFormatter> = {
    default: createNumberFormatter(),
  };

  if (dateTimeStyles) {
    for (const [name, options] of Object.entries(dateTimeStyles)) {
      dateTimeFormatters[name] = createDateTimeFormatter(options);
    }
  }

  if (numberStyles) {
    for (const [name, options] of Object.entries(numberStyles)) {
      numberFormatters[name] = createNumberFormatter(options);
    }
  }

  return (locale, name, value, styleName) => {
    styleName ||= 'default';

    if (typeof styleName === 'string') {
      switch (name) {

        case 'date':
          if (value === undefined || typeof value === 'number' || value instanceof Date) {
            const formatter = dateTimeFormatters[styleName];
            if (formatter) {
              return formatter(locale, value);
            } else if (process.env.NODE_ENV !== 'production') {
              console.log();
            }
          }
          break;

        case 'number':
          if (typeof value === 'number') {
            const formatter = numberFormatters[styleName];
            if (formatter) {
              return formatter(locale, value);
            } else if (process.env.NODE_ENV !== 'production') {
              console.log();
            }
          }
          break;
      }
    }

    if (renderFallback) {
      renderFallback(locale, name, value, styleName);
    } else if (process.env.NODE_ENV !== 'production') {
      console.log();
    }
    return '';
  };
}

export type DateTimeFormatter = (locale: string, value: Date | number | undefined) => string;

export function createDateTimeFormatter(options?: Intl.DateTimeFormatOptions): DateTimeFormatter {
  const cache: Record<string, Intl.DateTimeFormat> = {};

  return (locale, value) => (cache[locale] ||= new Intl.DateTimeFormat(locale, options)).format(value);
}

export type NumberFormatter = (locale: string, value: number) => string;

export function createNumberFormatter(options?: Intl.NumberFormatOptions): NumberFormatter {
  const cache: Record<string, Intl.NumberFormat> = {};

  return (locale, value) => (cache[locale] ||= new Intl.NumberFormat(locale, options)).format(value);
}

export function createPluralMatcher(type: Intl.PluralRuleType): IMessageRuntime<any>[RuntimeMethod.PLURAL] {
  const cache: Record<string, Intl.PluralRules> = {};

  return (locale, value) => pluralCategories.indexOf((cache[locale] ||= new Intl.PluralRules(locale, {type})).select(value));
}
