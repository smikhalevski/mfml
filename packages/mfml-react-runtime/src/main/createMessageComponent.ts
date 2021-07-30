import React from 'react';
import {IMessageRuntime, MessageFunction} from 'mfml-runtime';

interface IUnsafeMessageProps {
  message: MessageFunction<any>;
  values?: any;
}

export type MessageProps<F extends MessageFunction<any>> =
    F extends MessageFunction<infer Values> ? Values extends object ? { message: F, values: Values } : { message: F } : never;

/**
 * The component that renders a message using a runtime available through the context.
 */
export type MessageComponent = <F extends MessageFunction<any>>(props: MessageProps<F>) => React.ReactElement;

export interface IMessageComponentOptions {

  /**
   * The context that provides a runtime that renders a message.
   */
  runtimeContext: React.Context<IMessageRuntime<React.ReactNode>>;

  /**
   * The context that provides the current locale.
   */
  localeContext: React.Context<string>;
}

/**
 * Creates a component that renders a message using a runtime provided through the
 * {@link IMessageComponentOptions.runtimeContext}.
 *
 * @param options Component options.
 */
export function createMessageComponent(options: IMessageComponentOptions): MessageComponent {
  const {runtimeContext, localeContext} = options;

  return (props: IUnsafeMessageProps) => {
    const {message, values} = props;

    const runtime = React.useContext(runtimeContext);
    const locale = React.useContext(localeContext);

    const node = message(runtime, locale, values);

    return React.isValidElement(node) ? node : React.createElement(React.Fragment, null, node);
  };
}
