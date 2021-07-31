import React from 'react';
import {IMessageRuntime, MessageFunction} from 'mfml-runtime';

export interface IMessageRenderer<T> {

  <F extends MessageFunction>(message: F): T | string;

  <F extends MessageFunction<any>>(message: F, values: F extends MessageFunction<infer Values> ? Values : never): T | string;
}

export function createMessageHook<T>(runtimeContext: React.Context<IMessageRuntime<T>>, localeContext: React.Context<string>): () => IMessageRenderer<T> {
  return () => {
    const runtime = React.useContext(runtimeContext);
    const locale = React.useContext(localeContext);

    return React.useCallback((message, values) => message(runtime, locale, values), [runtime, locale]);
  };
}
