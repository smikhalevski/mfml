import {RuntimeFields} from './RuntimeFields';

export interface IRuntime<Result> {
  [RuntimeFields.FRAGMENT](...children: Array<Result>): Result;
  [RuntimeFields.ELEMENT](tagName: string, attrs: Record<string, Result> | null, ...children: Array<Result>): Result;
  [RuntimeFields.FUNCTION](name: string, arg: Result, ...children: Array<Result>): Result;
  [RuntimeFields.PLURAL](pluralMap: Record<string, Result>): Result;
  [RuntimeFields.SELECT](selectMap: Record<string, Result>): Result;
  [RuntimeFields.SELECT_ORDINAL](selectMap: Record<string, Result>): Result;
}

export interface IRuntimeOptions<Result> {
  createFragment(...children: Array<Result>): Result;
  createElement(tagName: string, attrs: Record<string, Result> | null, ...children: Array<Result>): Result;
  callFunction(name: string, arg: Result, ...children: Array<Result>): Result;
}

export function createRuntime<Result>(options: IRuntimeOptions<Result>): IRuntime<Result> {
  const {
    createFragment,
    createElement,
    callFunction,
  } = options;

  return {
    [RuntimeFields.FRAGMENT]() {
      return createFragment.apply(undefined, arguments as unknown as Parameters<IRuntime<Result>[RuntimeFields.FRAGMENT]>);
    },
    [RuntimeFields.ELEMENT]() {
      return createElement.apply(undefined, arguments as unknown as Parameters<IRuntime<Result>[RuntimeFields.ELEMENT]>);
    },
    [RuntimeFields.FUNCTION]() {
      return callFunction.apply(undefined, arguments as unknown as Parameters<IRuntime<Result>[RuntimeFields.FUNCTION]>);
    },
    [RuntimeFields.PLURAL](pluralMap) {
      return pluralMap.FOOO;
    },
    [RuntimeFields.SELECT](selectMap) {
      return selectMap.FOOO;
    },
    [RuntimeFields.SELECT_ORDINAL](selectMap) {
      return selectMap.FOOO;
    },
  }
}
