import {Context, useCallback, useContext} from 'react';
import {IRuntime, MessageFunction} from 'mfml-runtime';

export interface IMessageRenderer<T> {

  <F extends MessageFunction<void>>(message: F): T | string;

  <F extends MessageFunction<any>>(message: F, values: F extends MessageFunction<infer Values> ? Values : never): T | string;
}

/**
 * Creates a React hook that returns a callback that renders a message function using runtime retrieved from
 * `runtimeContext`.
 *
 * @param runtimeContext The context that provides a runtime to render a message.
 * @param localeContext The context that provides the current locale.
 * @see {@link useMessage}
 */
export function createMessageHook<T>(runtimeContext: Context<IRuntime<T>>, localeContext: Context<string>): () => IMessageRenderer<T> {
  return () => {
    const runtime = useContext(runtimeContext);
    const locale = useContext(localeContext);

    return useCallback((message, values) => message(runtime, locale, values), [runtime, locale]);
  };
}
