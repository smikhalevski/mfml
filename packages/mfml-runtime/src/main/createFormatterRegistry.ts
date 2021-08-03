export type Formatter<Result> = (locale: string, value: unknown, name?: string, options?: unknown) => Result | undefined;

export interface IFormatterRegistry<Result> {

  register(name: string, formatter: Formatter<Result>): void;

  format: Formatter<Result>;
}

export function createFormatterRegistry<Result>(): IFormatterRegistry<Result> {

  const formatterMap = new Map<string, Array<Formatter<Result>>>();
  const allFormatters: Array<Formatter<Result>> = [];

  const register: IFormatterRegistry<Result>['register'] = (name, formatter) => {
    let formatters = formatterMap.get(name);
    if (formatters) {
      if (formatters.includes(formatter)) {
        return;
      }
    } else {
      formatters = [];
      formatterMap.set(name, formatters);
    }
    allFormatters.splice(formatters.length !== 0 ? allFormatters.indexOf(formatters[formatters.length - 1]) + 1 : allFormatters.length, 0, formatter);
    formatters.push(formatter);
  };

  const format: Formatter<Result> = (locale, value, name, options) => {
    const formatters = name != null ? formatterMap.get(name) : allFormatters;
    if (!formatters) {
      return;
    }
    for (const formatter of formatters) {
      const result = formatter(locale, value, name, options);
      if (result !== undefined) {
        return result;
      }
    }
  };

  return {register, format};
}
