export function getListFormat(locale: string, options: Intl.ListFormatOptions): Intl.ListFormat {
  return getOrCreate(Intl.ListFormat, locale, options);
}

export function getNumberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  return getOrCreate(Intl.NumberFormat, locale, options);
}

export function getDateTimeFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return getOrCreate(Intl.DateTimeFormat, locale, options);
}

export function getPluralRules(locale: string, options: Intl.PluralRulesOptions): Intl.PluralRules {
  return getOrCreate(Intl.PluralRules, locale, options);
}

export function getDisplayNames(locale: string, options: Intl.DisplayNamesOptions): Intl.DisplayNames {
  return getOrCreate(Intl.DisplayNames, locale, options);
}

const cache = new Map<string, WeakMap<Function, WeakMap<object, any>>>();

function getOrCreate<O, T>(constructor: new (locale: string, options: O) => T, locale: string, options: O): T {
  let value;

  value = cache.get(locale) || (cache.set(locale, (value = new WeakMap())), value);

  value = value.get(constructor) || (value.set(constructor, (value = new WeakMap())), value);

  value = value.get(options) || (value.set(options, (value = new constructor(locale, options))), value);

  return value;
}
