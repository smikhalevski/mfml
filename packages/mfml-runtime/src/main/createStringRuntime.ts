import {createRuntime, IRuntimeOptions} from './createRuntime';
import {ArgumentRenderer, ElementRenderer, FragmentRenderer, IRuntime} from './runtime-types';

/**
 * Creates a runtime that renders a message as a string.
 *
 * @param options Runtime options.
 */
export function createStringRuntime(options: Partial<IRuntimeOptions<string>> = {}): IRuntime<string> {
  return createRuntime(Object.assign({}, options, {
    renderElement: options.renderElement || stringElementRenderer,
    renderFragment: options.renderFragment || stringFragmentRenderer,
    renderArgument: options.renderArgument || stringArgumentRenderer,
  }));
}

const stringElementRenderer: ElementRenderer<string> = function () {
  let str = '';
  for (let i = 2; i < arguments.length; ++i) {
    str += arguments[i];
  }
  return str;
};

const stringFragmentRenderer: FragmentRenderer<string> = function () {
  let str = '';
  for (let i = 0; i < arguments.length; ++i) {
    str += arguments[i];
  }
  return str;
};

const stringArgumentRenderer: ArgumentRenderer<string> = (locale, value) => '' + value;
