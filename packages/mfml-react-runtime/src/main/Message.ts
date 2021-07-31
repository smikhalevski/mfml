import {createReactMessageRuntime} from './createReactMessageRuntime';
import {createMessageComponent} from './createMessageComponent';
import {createMessageHook} from './createMessageHook';
import {createContext} from 'react';

/**
 * Provides runtime for {@link Message} and {@link useMessage}.
 *
 * **Note:** The default runtime renders all tags as DOM elements using `React.createElement`.
 */
export const MessageRuntimeContext = createContext(createReactMessageRuntime());

/**
 * Provides locale for {@link Message} and {@link useMessage}.
 */
export const LocaleContext = createContext('en');

/**
 * A shortcut for {@link MessageRuntimeContext.Provider}.
 */
export const MessageRuntimeProvider = MessageRuntimeContext.Provider;

/**
 * A shortcut for {@link LocaleContext.Provider}.
 */
export const LocaleProvider = LocaleContext.Provider;

/**
 * Renders a message using a runtime provided through {@link MessageRuntimeContext}.
 *
 * @see {@link createMessageComponent}
 */
export const Message = createMessageComponent(MessageRuntimeContext, LocaleContext);

/**
 * The React hook that returns a callback that renders a message function using a runtime provided through
 * {@link MessageRuntimeContext}.
 *
 * @see {@link createMessageHook}
 */
export const useMessage = createMessageHook(MessageRuntimeContext, LocaleContext);
