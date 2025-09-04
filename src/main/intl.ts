export const getListFormat = createCache(Intl.ListFormat);
export const getNumberFormat = createCache(Intl.NumberFormat);
export const getDateTimeFormat = createCache(Intl.DateTimeFormat);
export const getPluralRules = createCache(Intl.PluralRules);
export const getDisplayNames = createCache(Intl.DisplayNames);

function createCache<O, T>(constructor: new (locale: string, options: O) => T): (locale: string, options: O) => T {
  const cache = new Map<string, WeakMap<any, T>>();

  return (locale, options) => {
    let values = cache.get(locale);
    let value = (values || (cache.set(locale, (values = new WeakMap())), values)).get(options);

    return value || (values.set(options, (value = new constructor(locale, options))), value);
  };
}
