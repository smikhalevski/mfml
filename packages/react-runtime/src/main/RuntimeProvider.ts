import {createContext} from 'react';
import {createReactRuntime} from './createReactRuntime';

export const RuntimeContext = createContext(createReactRuntime());

export const RuntimeProvider = RuntimeContext.Provider;
