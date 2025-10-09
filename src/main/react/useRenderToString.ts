import { createContext, useCallback, useContext } from 'react';
import { MessageNode, Renderer } from '../types.js';
import { defaultStringRenderer, renderToString } from '../renderToString.js';
import { MessageLocaleContext } from './Message.js';

const StringMessageRendererContext = createContext<Renderer<string>>(defaultStringRenderer);
StringMessageRendererContext.displayName = 'StringMessageRendererContext';

export const StringMessageRendererProvider = StringMessageRendererContext.Provider;

export function useRenderToString(): (message: (locale: string) => MessageNode<void> | null) => string;

export function useRenderToString(): <Values extends object>(
  message: (locale: string) => MessageNode<Values> | null,
  values: Values
) => string;

export function useRenderToString(): (
  message: (locale: string) => MessageNode | null,
  values: object | void
) => string {
  const locale = useContext(MessageLocaleContext);
  const renderer = useContext(StringMessageRendererContext);

  return useCallback((message, values) => renderToString({ message, values, locale, renderer }), [locale, renderer]);
}
