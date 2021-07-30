import {createMessageRuntime, IMessageRuntime, IMessageRuntimeOptions} from 'mfml-runtime';
import React from 'react';
import {isReactNode} from './react-utils';

export interface IReactMessageRuntimeOptions extends Pick<IMessageRuntimeOptions<React.ReactNode>,
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
  createElement?(type: string, props: Record<string, unknown> | null, ...children: Array<React.ReactNode>): React.ReactNode;

  /**
   * Applies a function to an argument value. By default, `value` is rendered as is.
   *
   * @param name The function name.
   * @param value An argument value.
   * @param param An optional additional param.
   */
  renderFunction?(name: string, value: unknown, param: React.ReactNode): React.ReactNode;
}

/**
 * Creates a runtime that renders messages using React components.
 */
export function createReactMessageRuntime(options: IReactMessageRuntimeOptions = {}): IMessageRuntime<React.ReactNode> {

  const {
    createElement = React.createElement,
    renderFunction = renderFunctionValue,
    matchLocale,
    matchSelect,
    matchPlural,
    matchSelectOrdinal,
  } = options;

  return createMessageRuntime<React.ReactNode>({
    renderFragment: (...children) => children.length === 0 ? null : React.createElement(React.Fragment, null, children),
    renderElement: createElement,
    renderFunction,
    renderArgument: renderReactNode,
    matchLocale,
    matchSelect,
    matchPlural,
    matchSelectOrdinal,
  });
}

const renderFunctionValue = (name: string, value: unknown) => renderReactNode(value);

const renderReactNode = (value: unknown) => isReactNode(value) ? value : null;
