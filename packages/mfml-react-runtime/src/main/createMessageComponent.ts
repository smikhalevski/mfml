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

/**
 * Creates a component that renders a message using a runtime provided through the `runtimeContext`.
 *
 * @param runtimeContext The context that provides a runtime that renders a message.
 * @param localeContext The context that provides the current locale.
 */
export function createMessageComponent(runtimeContext: React.Context<IMessageRuntime<React.ReactNode>>, localeContext: React.Context<string>): MessageComponent {
  return (props: IUnsafeMessageProps) => {
    const {message, values} = props;

    const runtime = React.useContext(runtimeContext);
    const locale = React.useContext(localeContext);

    const node = message(runtime, locale, values);

    return React.isValidElement(node) ? node : React.createElement(React.Fragment, null, node);
  };
}
