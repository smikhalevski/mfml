import {createMessageRuntime, IMessageRuntime, IMessageRuntimeOptions} from 'mfml-runtime';
import {createElement, Fragment, ReactNode} from 'react';
import {isReactNode} from './react-utils';

export interface IReactMessageRuntimeOptions extends Pick<IMessageRuntimeOptions<ReactNode>,
    | 'renderFunction'
    | 'matchLocale'
    | 'matchSelect'
    | 'matchPlural'
    | 'matchSelectOrdinal'> {

  /**
   * Creates the new `React.ReactNode`.
   *
   * @param type The element type.
   * @param props The element props.
   * @param children The element children.
   * @default `React.createElement`
   */
  renderElement?(type: string, props: Record<string, unknown> | null, ...children: Array<ReactNode>): ReactNode;
}

/**
 * Creates a runtime that renders messages using React components.
 *
 * @param options Runtime options.
 */
export function createReactMessageRuntime(options: IReactMessageRuntimeOptions = {}): IMessageRuntime<ReactNode> {

  const {
    renderElement = createElement,
    renderFunction,
    matchLocale,
    matchSelect,
    matchPlural,
    matchSelectOrdinal,
  } = options;

  return createMessageRuntime<ReactNode>({
    renderFragment: (...children) => children.length === 0 ? null : createElement(Fragment, null, children),
    renderArgument: (value) => isReactNode(value) ? value : null,
    renderElement,
    renderFunction,
    matchLocale,
    matchSelect,
    matchPlural,
    matchSelectOrdinal,
  });
}
