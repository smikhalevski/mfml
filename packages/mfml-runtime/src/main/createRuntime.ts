import {RuntimeMethod} from './RuntimeMethod';

export interface IRuntime<T> {
  [RuntimeMethod.LOCALE]: (localeMap: Record<string, T>) => T;
  [RuntimeMethod.FRAGMENT]: (...children: Array<T>) => T;
  [RuntimeMethod.ELEMENT]: (tagName: string, attrs: Record<string, T> | null, ...children: Array<T>) => T;
  [RuntimeMethod.FUNCTION]: (name: string, arg: T, ...children: Array<T>) => T;
  [RuntimeMethod.PLURAL]: (pluralMap: Record<string, T>) => T;
  [RuntimeMethod.SELECT]: (selectMap: Record<string, T>) => T;
  [RuntimeMethod.SELECT_ORDINAL]: (selectMap: Record<string, T>) => T;
}

export interface IRuntimeOptions<T> {
  createFragment: IRuntime<T>[RuntimeMethod.FRAGMENT];
  createElement: IRuntime<T>[RuntimeMethod.ELEMENT];
  callFunction: IRuntime<T>[RuntimeMethod.FUNCTION];
  pickLocale?: IRuntime<T>[RuntimeMethod.LOCALE];
  pickPlural?: IRuntime<T>[RuntimeMethod.PLURAL];
  pickSelect?: IRuntime<T>[RuntimeMethod.SELECT];
  pickSelectOrdinal?: IRuntime<T>[RuntimeMethod.SELECT_ORDINAL];
}

export function createRuntime<T>(options: IRuntimeOptions<T>): IRuntime<T> {

  const {
    createFragment,
    createElement,
    callFunction,
    pickLocale = (localeMap) => localeMap.FOO,
    pickPlural = (pluralMap) => pluralMap.FOO,
    pickSelect = (selectMap) => selectMap.FOO,
    pickSelectOrdinal = (selectMap) => selectMap.FOO,
  } = options;

  return {
    [RuntimeMethod.LOCALE]: pickLocale,
    [RuntimeMethod.FRAGMENT]: createFragment,
    [RuntimeMethod.ELEMENT]: createElement,
    [RuntimeMethod.FUNCTION]: callFunction,
    [RuntimeMethod.PLURAL]: pickPlural,
    [RuntimeMethod.SELECT]: pickSelect,
    [RuntimeMethod.SELECT_ORDINAL]: pickSelectOrdinal,
  };
}
