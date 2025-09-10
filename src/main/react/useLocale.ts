import { createContext, useContext } from 'react';

const LocaleContext = createContext<string | null>(null);

LocaleContext.displayName = 'LocaleContext';

export const LocaleProvider = LocaleContext.Provider;

export function useLocale(): string {
  const locale = useContext(LocaleContext);

  if (locale === null) {
    throw new Error('Cannot be used outside of LocaleProvider');
  }

  return locale;
}
