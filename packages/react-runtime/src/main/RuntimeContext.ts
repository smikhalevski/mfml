import {createContext} from 'react';
import {createReactRuntime} from './createReactRuntime';

/**
 * The context that provides {@link IRuntime} to {@link Message} and {@link useMessage}.
 */
export const RuntimeContext = createContext(createReactRuntime());

RuntimeContext.displayName = 'RuntimeContext';

