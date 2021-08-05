import {createRuntime, IRuntimeOptions} from './createRuntime';
import {ArgumentRenderer, ElementRenderer, FragmentRenderer, IRuntime} from './runtime-types';

/**
 * Creates a runtime that renders a message as a string.
 *
 * @param options Runtime options.
 */
export function createStringRuntime(options: Partial<IRuntimeOptions<string>> = {}): IRuntime<string> {
  return createRuntime({
    ...options,
    renderElement: options.renderElement || stringElementRenderer,
    renderFragment: options.renderFragment || stringFragmentRenderer,
    renderArgument: options.renderArgument || stringArgumentRenderer,
  });
}

export const stringElementRenderer: ElementRenderer<any> = function () {
  let str = '';
  for (let i = 2; i < arguments.length; ++i) {
    str += arguments[i];
  }
  return str;
};

export const stringFragmentRenderer: FragmentRenderer<any> = function () {
  let str = '';
  for (let i = 0; i < arguments.length; ++i) {
    str += arguments[i];
  }
  return str;
};

export const stringArgumentRenderer: ArgumentRenderer<any> = (locale, value) => '' + value;
