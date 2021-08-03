import {Formatter} from './createFormatterRegistry';

const DEFAULT_STYLE_NAME = 'default';

export interface IFormatterStyles<Options> {
  [DEFAULT_STYLE_NAME]?: Options;

  [styleName: string]: Options | undefined;
}

export function createIntlDateTimeFormatter(styles: IFormatterStyles<Intl.DateTimeFormatOptions>): Formatter<string> {
  const cache: Record<string, Record<string, Intl.DateTimeFormat>> = {};

  return (locale, value, name, options) => {
    if (value instanceof Date) {
      value = value.getTime();
    } else if (name == null) {
      return;
    }
    if (typeof value === 'string') {
      value = new Date(value).getTime();
    }
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return;
    }
    const styleName = typeof options === 'string' && options in styles ? options : DEFAULT_STYLE_NAME;
    const format = (cache[locale] ||= {})[styleName] ||= new Intl.DateTimeFormat(locale, styles[styleName]);
    return format.format(value as number);
  };
}

export function createIntlNumberFormatter(styles: IFormatterStyles<Intl.NumberFormatOptions>): Formatter<string> {
  const cache: Record<string, Record<string, Intl.NumberFormat>> = {};

  return (locale, value, name, options) => {
    if (typeof value !== 'number') {
      return;
    }
    const styleName = typeof options === 'string' && options in styles ? options : DEFAULT_STYLE_NAME;
    const format = (cache[locale] ||= {})[styleName] ||= new Intl.NumberFormat(locale, styles[styleName]);
    return format.format(value as number);
  };
}
