export interface RendererOptions {
  numberStyles?: Record<string, Intl.NumberFormatOptions>;

  dateStyles?: Record<string, Intl.DateTimeFormatOptions>;

  timeStyles?: Record<string, Intl.DateTimeFormatOptions>;
}

export interface Renderer<T> {
  renderText(locale: string, text: string): T;

  renderElement(
    locale: string,
    tagName: string,
    attributes: { readonly [name: string]: readonly T[] | T },
    children: readonly T[] | T
  ): T;

  renderValue(locale: string, value: unknown, type: string | undefined, style: string | undefined): T;

  selectCategory(locale: string, value: unknown, type: string, categories: readonly string[]): string | undefined;
}

export abstract class AbstractRenderer<T> implements Renderer<T | string> {
  numberStyles: Record<string, Intl.NumberFormatOptions>;
  dateStyles: Record<string, Intl.DateTimeFormatOptions>;
  timeStyles: Record<string, Intl.DateTimeFormatOptions>;

  constructor(options: RendererOptions = {}) {
    const { numberStyles = {}, dateStyles = {}, timeStyles = {} } = options;

    this.numberStyles = numberStyles;
    this.dateStyles = dateStyles;
    this.timeStyles = timeStyles;
  }

  renderText(_locale: string, text: string): T | string {
    return text;
  }

  abstract renderElement(
    locale: string,
    tagName: string,
    attributes: { [p: string]: ReadonlyArray<T | string> | T | string },
    children: ReadonlyArray<T | string> | T | string
  ): T;

  renderValue(locale: string, value: unknown, type: string | undefined, style: string | undefined): T | string {
    if (type === 'number' && (typeof value === 'number' || typeof value === 'bigint')) {
      return new Intl.NumberFormat(locale, style === undefined ? undefined : this.numberStyles[style]).format(value);
    }
    if (type === 'date' && (typeof value === 'number' || value instanceof Date)) {
      return new Intl.DateTimeFormat(locale, style === undefined ? undefined : this.dateStyles[style]).format(value);
    }
    if (type === 'time' && (typeof value === 'number' || value instanceof Date)) {
      return new Intl.DateTimeFormat(locale, style === undefined ? undefined : this.timeStyles[style]).format(value);
    }
    return '' + value;
  }

  selectCategory(locale: string, value: unknown, type: string, categories: readonly string[]): string | undefined {
    let category = '=' + value;

    if (categories.includes(category)) {
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
  }
}

export class StringRenderer extends AbstractRenderer<string> {
  renderElement(
    _locale: string,
    tagName: string,
    _attributes: { [p: string]: string[] | string },
    children: readonly string[] | string
  ): string {
    if (!isLowerCaseAlpha(tagName)) {
      // Custom elements aren't rendered
      return '';
    }

    const text = typeof children === 'string' ? children : children.join('');

    return tagName === 'p' ? text + '\n' : text;
  }
}

export function isLowerCaseAlpha(str: string): boolean {
  for (let i = 0; i < str.length; ++i) {
    const charCode = str.charCodeAt(i);

    if (charCode < /* a */ 97 || charCode > /* z */ 122) {
      return false;
    }
  }

  return true;
}

export const defaultRendererOptions: RendererOptions = {
  dateStyles: {
    short: { dateStyle: 'short' },
    full: { dateStyle: 'full' },
    long: { dateStyle: 'long' },
    medium: { dateStyle: 'medium' },
  },
  timeStyles: {
    short: { timeStyle: 'short' },
    full: { timeStyle: 'full' },
    long: { timeStyle: 'long' },
    medium: { timeStyle: 'medium' },
  },
  numberStyles: {
    decimal: { style: 'decimal' },
    percent: { style: 'percent' },
  },
};
