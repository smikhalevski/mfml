import {RuntimeMethod} from './RuntimeMethod';

export interface IRuntime<T> {
  [RuntimeMethod.FRAGMENT]: (...children: Array<T>) => T;
  [RuntimeMethod.ARGUMENT]: (value: unknown) => T;
  [RuntimeMethod.ELEMENT]: (tagName: string, attributes: Record<string, T> | null, ...children: Array<T>) => T;
  [RuntimeMethod.SHORT_ELEMENT]: (tagName: string, ...children: Array<T>) => T;
  [RuntimeMethod.FUNCTION]: (name: string, value: unknown, ...children: Array<T>) => T;
  [RuntimeMethod.LOCALE]: (locale: string, locales: Array<string>) => T;
  [RuntimeMethod.SELECT]: (value: unknown, ...knownKeys: Array<string>) => T;
  [RuntimeMethod.PLURAL]: (locale: string, value: number) => T;
  [RuntimeMethod.SELECT_ORDINAL]: (locale: string, value: number) => T;
}

export interface IRuntimeOptions<T> {
  fragment: IRuntime<T>[RuntimeMethod.FRAGMENT];
  argument: IRuntime<T>[RuntimeMethod.ARGUMENT];
  element: (tagName: string, attributes: Record<string, T> | null, children: Array<T>) => T;
  function: IRuntime<T>[RuntimeMethod.FUNCTION];
  locale?: IRuntime<T>[RuntimeMethod.LOCALE];
  select?: IRuntime<T>[RuntimeMethod.SELECT];
  plural?: IRuntime<T>[RuntimeMethod.PLURAL];
  selectOrdinal?: IRuntime<T>[RuntimeMethod.SELECT_ORDINAL];
}

export function createRuntime<T>(options: IRuntimeOptions<T>): IRuntime<T> {

  const {
    fragment: fragmentCallback,
    argument: argumentCallback,
    element: elementCallback,
    function: functionCallback,
    locale: localeCallback = pickLocale,
    select: selectCallback = pickSelect,
    plural: pluralCallback = pickPlural,
    selectOrdinal: selectOrdinalCallback = pickSelectOrdinal,
  } = options;

  return {
    [RuntimeMethod.LOCALE]: localeCallback,
    [RuntimeMethod.FRAGMENT]: fragmentCallback,
    [RuntimeMethod.ARGUMENT]: argumentCallback,
    [RuntimeMethod.ELEMENT]: (tagName, attributes, ...children) => elementCallback(tagName, attributes, children),
    [RuntimeMethod.SHORT_ELEMENT]: (tagName, ...children) => elementCallback(tagName, null, children),
    [RuntimeMethod.FUNCTION]: functionCallback,
    [RuntimeMethod.PLURAL]: pluralCallback,
    [RuntimeMethod.SELECT]: selectCallback,
    [RuntimeMethod.SELECT_ORDINAL]: selectOrdinalCallback,
  };
}

const cardinalPluralRules: Record<string, Intl.PluralRules> = {};
const ordinalPluralRules: Record<string, Intl.PluralRules> = {};

const pickLocale: IRuntime<any>[RuntimeMethod.LOCALE] = (locale, locales) => locales.indexOf(locale);

const pickSelect: IRuntime<any>[RuntimeMethod.SELECT] = function (value) {
  for (let i = 1; i < arguments.length; ++i) {
    if (arguments[i] === value) {
      return i;
    }
  }
  return -1;
};

const pickPlural: IRuntime<any>[RuntimeMethod.PLURAL] = (locale, value) => {
  return (cardinalPluralRules[locale] ||= new Intl.PluralRules(locale, {type: 'cardinal'})).select(value);
};

const pickSelectOrdinal: IRuntime<any>[RuntimeMethod.SELECT_ORDINAL] = (locale, value) => {
  return (ordinalPluralRules[locale] ||= new Intl.PluralRules(locale, {type: 'ordinal'})).select(value);
};
