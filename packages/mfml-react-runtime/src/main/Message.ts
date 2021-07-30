import React from 'react';
import {createReactMessageRuntime} from './createReactMessageRuntime';
import {IMessageRuntime} from 'mfml-runtime';
import {createMessageComponent} from './createMessageComponent';

export const messageRuntime = createReactMessageRuntime({
  renderElement: React.createElement,
});

const RuntimeContext = React.createContext<IMessageRuntime<React.ReactNode>>(messageRuntime);

const LocaleContext = React.createContext('en');

export const MessageRuntimeProvider = RuntimeContext.Provider;

export const LocaleProvider = LocaleContext.Provider;

export const Message = createMessageComponent({
  runtimeContext: RuntimeContext,
  localeContext: LocaleContext,
});
