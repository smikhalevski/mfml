export function getListFormat(locale: string, options: Intl.ListFormatOptions): Intl.ListFormat {
  return getCachedInstance(Intl.ListFormat, locale, options);
}

export function getNumberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  return getCachedInstance(Intl.NumberFormat, locale, options);
}

export function getDateTimeFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return getCachedInstance(Intl.DateTimeFormat, locale, options);
}

export function getPluralRules(locale: string, options: Intl.PluralRulesOptions): Intl.PluralRules {
  return getCachedInstance(Intl.PluralRules, locale, options);
}

export function getDisplayNames(locale: string, options: Intl.DisplayNamesOptions): Intl.DisplayNames {
  return getCachedInstance(Intl.DisplayNames, locale, options);
}

const intlCache = new Map<string, WeakMap<Function, WeakMap<object, any>>>();

function getCachedInstance<O, T>(constructor: new (locale: string, options: O) => T, locale: string, options: O): T {
  let value;

  value = intlCache.get(locale) || (intlCache.set(locale, (value = new WeakMap())), value);

  value = value.get(constructor) || (value.set(constructor, (value = new WeakMap())), value);

  value = value.get(options) || (value.set(options, (value = new constructor(locale, options))), value);

  return value;
}
