import {createContext, createElement, Dispatch, FunctionComponent, SetStateAction, useContext, useState} from 'react';

const DEFAULT_LOCALE = 'en';

export const LocaleContext = createContext<[string, Dispatch<SetStateAction<string>>]>([DEFAULT_LOCALE, () => {
  throw new Error('Expected LocaleContext to be rendered');
}]);

LocaleContext.displayName = 'LocaleContext';

export interface ILocaleProviderProps {

  /**
   * The initial locale value.
   *
   * @default "en"
   */
  initialLocale?: string;
}

/**
 * Provides a locale value and setter to underlying children.
 */
export const LocaleProvider: FunctionComponent<ILocaleProviderProps> = (props) => {
  const {initialLocale = DEFAULT_LOCALE, children} = props;

  const [locale, setLocale] = useState(initialLocale);

  return createElement(LocaleContext.Provider, {value: [locale, setLocale]}, children);
};

LocaleProvider.displayName = 'LocaleProvider';

/**
 * Returns the locale value and setter.
 */
export function useLocale(): [string, Dispatch<SetStateAction<string>>] {
  return useContext(LocaleContext);
}
