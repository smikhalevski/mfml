import {Context, useCallback, useContext} from 'react';
import {IRuntime, MessageFunction} from '@mfml/runtime';

export interface IMessageRenderer<Result> {

  <F extends MessageFunction<void>>(message: F): Result | string;

  <F extends MessageFunction<any>>(message: F, values: F extends MessageFunction<infer Values> ? Values : never): Result | string;
}

/**
 * Creates a React hook that returns a callback that renders a message function using runtime retrieved from
 * `runtimeContext`.
 *
 * @param runtimeContext The context that provides a runtime to render a message.
 * @param i18nContext The context that holds i18n related data.
 * @param localeSelector The callback that returns a locale from i18n context value.
 *
 * @template Result The type of values
 * @template I18n The type of the context that carries i18n data and provides the current locale.
 *
 * @see {@link useMessage}
 */
export function createMessageHook<Result, I18n>(runtimeContext: Context<IRuntime<Result>>, i18nContext: Context<I18n>, localeSelector: (i18n: I18n) => string): () => IMessageRenderer<Result> {
  return () => {
    const runtime = useContext(runtimeContext);
    const locale = localeSelector(useContext(i18nContext));

    return useCallback((message, values) => message(runtime, locale, values), [runtime, locale]);
  };
}
