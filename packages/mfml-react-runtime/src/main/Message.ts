import React from 'react';
import {createReactMessageRuntime} from './createReactMessageRuntime';
import {IMessageRuntime} from 'mfml-runtime';
import {createMessageComponent} from './createMessageComponent';

/**
 * The default runtime exposed by {@link MessageRuntimeContext}.
 *
 * **Note:** This runtime renders all tags as DOM elements using `React.createElement`.
 */
export const reactMessageRuntime = createReactMessageRuntime();

/**
 * Provides runtime for {@link Message}.
 */
export const MessageRuntimeContext = React.createContext<IMessageRuntime<React.ReactNode>>(reactMessageRuntime);

/**
 * Provides locale for {@link Message}.
 */
export const LocaleContext = React.createContext('en');

export const MessageRuntimeProvider = MessageRuntimeContext.Provider;

export const LocaleProvider = LocaleContext.Provider;

/**
 * Renders a message using a runtime provided through {@link MessageRuntimeContext}.
 */
export const Message = createMessageComponent(MessageRuntimeContext, LocaleContext);
