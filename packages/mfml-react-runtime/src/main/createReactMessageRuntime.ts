import {createMessageRuntime, IMessageRuntime, IMessageRuntimeOptions} from 'mfml-runtime';
import React from 'react';
import {isReactNode} from './react-utils';

export type ElementFactory = (props: Record<string, any> | null, children: Array<React.ReactNode>) => React.ReactNode;

export type FunctionHandler = (value: any, param: React.ReactNode) => React.ReactNode;

export interface IReactMessageRuntime extends IMessageRuntime<React.ReactNode> {

  /**
   * Registers a factory that creates a `React.ReactNode` that represents a tag.
   *
   * @param tagName The element tag name.
   * @param factory The factory that creates a `React.ReactNode`.
   */
  registerElementFactory(tagName: string, factory: ElementFactory): void;

  /**
   * Registers a function handler that is invoked when an argument is rendered using a function.
   *
   * @param name The function name.
   * @param handler The function handler that receives an argument value and an optional parameter.
   */
  registerFunctionHandler(name: string, handler: FunctionHandler): void;
}

export interface IReactMessageRuntimeOptions extends Pick<IMessageRuntimeOptions<React.ReactNode>,
    | 'matchLocale'
    | 'matchSelect'
    | 'matchPlural'
    | 'matchSelectOrdinal'> {

  /**
   * Creates the new `React.ReactNode`. This method is used if there is no element factory that was registered using
   * {@link IReactMessageRuntime.registerElementFactory}. If you want to render all tags as DOM elements, assign
   * `React.createElement`.
   *
   * @param type The element type.
   * @param props The element props.
   * @param children The element children.
   */
  renderElement?(type: string, props: Record<string, unknown> | null, children: Array<React.ReactNode>): React.ReactNode;

  /**
   * Applies a function to an argument value. This method is used if there is no function handler that was registered
   * using {@link IReactMessageRuntime.registerFunctionHandler}.
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
export function createReactMessageRuntime(options: IReactMessageRuntimeOptions = {}): IReactMessageRuntime {

  const {
    renderElement,
    renderFunction,
    matchLocale,
    matchSelect,
    matchPlural,
    matchSelectOrdinal,
  } = options;

  const elementFactories = new Map<string, ElementFactory>();
  const functionHandlers = new Map<string, FunctionHandler>();

  const runtime = <IReactMessageRuntime>createMessageRuntime<React.ReactNode>({

    renderFragment(...children) {
      return arguments.length === 0 ? null : React.createElement(React.Fragment, null, children);
    },

    renderElement(tagName, props, ...children) {
      const factory = elementFactories.get(tagName);
      return factory ? factory(props, children) : renderElement?.(tagName, props, children);
    },

    renderFunction(name, value, param) {
      const handler = functionHandlers.get(name);
      return handler ? handler(value, param) : renderFunction?.(name, value, param);
    },

    renderArgument(value) {
      return isReactNode(value) ? value : null;
    },

    matchLocale,
    matchSelect,
    matchPlural,
    matchSelectOrdinal,
  });

  runtime.registerElementFactory = (name, factory) => {
    elementFactories.set(name, factory);
  };

  runtime.registerFunctionHandler = (name, handler) => {
    functionHandlers.set(name, handler);
  };

  return runtime;
}
