import {Context, createElement, Fragment, isValidElement, ReactElement, ReactNode, useContext} from 'react';
import {IRuntime, MessageFunction} from 'mfml-runtime';

interface IUnsafeMessageProps {
  message: MessageFunction<any>;
  values?: any;
}

export type MessageProps<F extends MessageFunction<any>> =
    F extends MessageFunction<infer Values> ? Values extends object ? { message: F, values: Values } : { message: F } : never;

/**
 * The component that renders a message using a runtime available through the context.
 */
export type MessageComponent = <F extends MessageFunction<any>>(props: MessageProps<F>) => ReactElement | null;

/**
 * Creates a component that renders a message using a runtime provided through the `runtimeContext`.
 *
 * @param runtimeContext The context that provides a runtime to render a message.
 * @param localeContext The context that provides the current locale.
 * @see {@link Message}
 */
export function createMessageComponent(runtimeContext: Context<IRuntime<ReactNode>>, localeContext: Context<string>): MessageComponent {
  return (props: IUnsafeMessageProps) => {
    const {message, values} = props;

    const runtime = useContext(runtimeContext);
    const locale = useContext(localeContext);

    const node = message(runtime, locale, values);

    if (node === null || isValidElement(node)) {
      return node;
    }
    return createElement(Fragment, null, node);
  };
}
