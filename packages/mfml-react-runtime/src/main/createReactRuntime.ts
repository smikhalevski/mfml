import {createElement, Fragment, ReactNode} from 'react';
import {isReactNode} from './react-utils';
import {ArgumentRenderer, createRuntime, FragmentRenderer, IRuntime, IRuntimeOptions} from 'mfml-runtime';

/**
 * Creates a runtime that renders messages using React components.
 *
 * **Note:** By default, all elements are rendered using `React.createElement`.
 *
 * @param options Runtime options.
 */
export function createReactRuntime(options: Partial<IRuntimeOptions<ReactNode>> = {}): IRuntime<ReactNode> {
  return createRuntime(Object.assign({}, options, {
    renderElement: options.renderElement || createElement,
    renderFragment: options.renderFragment || reactFragmentRenderer,
    renderArgument: options.renderArgument || reactArgumentRenderer,
  }));
}

const reactFragmentRenderer: FragmentRenderer<ReactNode> = createElement.bind(undefined, Fragment, null);

const reactArgumentRenderer: ArgumentRenderer<ReactNode> = (locale, value) => isReactNode(value) ? value : null;
