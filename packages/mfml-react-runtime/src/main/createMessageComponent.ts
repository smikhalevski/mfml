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
export interface MessageComponent {

  <F extends MessageFunction<any>>(props: MessageProps<F>): ReactElement | null;

  displayName?: string | undefined;
}

/**
 * Creates a component that renders a message using a runtime provided through the `runtimeContext`.
 *
 * @param runtimeContext The context that provides a runtime to render a message.
 * @param i18nContext The context that holds i18n related data.
 * @param localeSelector The callback that returns a locale from i18n context value.
 * @see {@link Message}
 */
export function createMessageComponent<I18n>(runtimeContext: Context<IRuntime<ReactNode>>, i18nContext: Context<I18n>, localeSelector: (i18n: I18n) => string): MessageComponent {
  return (props: IUnsafeMessageProps) => {
    const {message, values} = props;

    const runtime = useContext(runtimeContext);
    const locale = localeSelector(useContext(i18nContext));
    const node = message(runtime, locale, values);

    return node === null || isValidElement(node) ? node : createElement(Fragment, null, node);
  };
}
