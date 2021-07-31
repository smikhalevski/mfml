import React from 'react';
import {createReactMessageRuntime} from './createReactMessageRuntime';
import {createMessageComponent} from './createMessageComponent';
import {createMessageHook} from './createMessageHook';

/**
 * Provides runtime for {@link Message}.
 *
 * **Note:** The default runtime renders all tags as DOM elements using `React.createElement`.
 */
export const MessageRuntimeContext = React.createContext(createReactMessageRuntime());

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

export const useMessage = createMessageHook(MessageRuntimeContext, LocaleContext);
