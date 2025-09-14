import { createContext, useContext } from 'react';

const LocaleContext = createContext('en');

LocaleContext.displayName = 'LocaleContext';

export const LocaleProvider = LocaleContext.Provider;

export function useLocale(): string {
  return useContext(LocaleContext);
}
