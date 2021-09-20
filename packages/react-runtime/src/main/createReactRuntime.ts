import {createElement, Fragment, ReactNode} from 'react';
import {isReactNode} from './react-utils';
import {ArgumentRenderer, createRuntime, FragmentRenderer, IRuntime, IRuntimeOptions} from '@mfml/runtime';

/**
 * Creates a runtime that renders messages using React components.
 *
 * By default, all elements are rendered using `React.createElement` and element attributes are rendered as strings.
 *
 * @param options Runtime options.
 */
export function createReactRuntime(options: Partial<IRuntimeOptions<ReactNode>> = {}): IRuntime<ReactNode> {
  return createRuntime({
    ...options,
    renderElement: options.renderElement || createElement,
    renderFragment: options.renderFragment || reactFragmentRenderer,
    renderArgument: options.renderArgument || reactArgumentRenderer,
    renderAttributeFragment: options.renderAttributeFragment || stringFragmentRenderer,
    renderAttributeArgument: options.renderAttributeArgument || stringArgumentRenderer,
    renderAttributeFunction: options.renderAttributeFunction || stringArgumentRenderer,
  });
}

const reactFragmentRenderer: FragmentRenderer<ReactNode> = createElement.bind(undefined, Fragment, null);

const reactArgumentRenderer: ArgumentRenderer<ReactNode> = (locale, value) => isReactNode(value) ? value : null;

const stringFragmentRenderer: FragmentRenderer<any> = function () {
  let str = '';
  for (let i = 0; i < arguments.length; ++i) {
    str += arguments[i];
  }
  return str;
};

const stringArgumentRenderer: ArgumentRenderer<any> = (locale, value) => '' + value;
