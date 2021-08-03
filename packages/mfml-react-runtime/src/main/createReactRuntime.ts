import {createIntlRuntime, IIntlRuntime, IRuntimeOptions} from 'mfml-runtime';
import {createElement, Fragment, ReactNode} from 'react';
import {isReactNode} from './react-utils';

export interface IReactRuntimeOptions extends Partial<IRuntimeOptions<ReactNode>> {
}

/**
 * Creates a runtime that renders messages using React components.
 *
 * @param options Runtime options.
 */
export function createReactRuntime(options: IReactRuntimeOptions = {}): IIntlRuntime<ReactNode> {

  const {
    formatterRegistry,
    renderElement = createElement,
    renderFunction,
    matchLocale,
    matchSelect,
    matchPlural,
    matchSelectOrdinal,
  } = options;

  return createIntlRuntime<ReactNode>({
    formatterRegistry,
    renderFragment: createElement.bind(undefined, Fragment, null),
    renderArgument: (locale, value) => isReactNode(value) ? value : null,
    renderElement,
    renderFunction,
    matchLocale,
    matchSelect,
    matchPlural,
    matchSelectOrdinal,
  });
}
