import {createReactRuntime} from './createReactRuntime';
import {createMessageComponent} from './createMessageComponent';
import {createMessageHook} from './createMessageHook';
import {createContext, ReactNode} from 'react';
import {IRuntime, stringRuntime} from 'mfml-runtime';

/**
 * Provides runtime for {@link Message} and {@link useMessage}.
 *
 * **Note:** The default runtime renders all tags as DOM elements using `React.createElement`.
 */
export const RuntimeContext = createContext<IRuntime<ReactNode>>(createReactRuntime());

export const StringRuntimeContext = createContext<IRuntime<string>>(stringRuntime);

/**
 * Provides locale for {@link Message} and {@link useMessage}.
 */
export const LocaleContext = createContext('en');

/**
 * A shortcut for {@link RuntimeContext.Provider}.
 */
export const RuntimeProvider = RuntimeContext.Provider;

export const StringRuntimeProvider = StringRuntimeContext.Provider;

/**
 * A shortcut for {@link LocaleContext.Provider}.
 */
export const LocaleProvider = LocaleContext.Provider;

/**
 * Renders a message using a runtime provided through {@link RuntimeContext}.
 *
 * @see {@link createMessageComponent}
 */
export const Message = createMessageComponent(RuntimeContext, LocaleContext);

/**
 * The React hook that returns a callback that renders a message function using a runtime provided through
 * {@link RuntimeContext}.
 *
 * @see {@link createMessageHook}
 */
export const useMessage = createMessageHook(RuntimeContext, LocaleContext);

export const useStringMessage = createMessageHook(StringRuntimeContext, LocaleContext);
