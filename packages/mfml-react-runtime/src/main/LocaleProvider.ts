import {createContext, createElement, Dispatch, FunctionComponent, SetStateAction, useContext, useState} from 'react';

const DEFAULT_LOCALE = 'en';

export const LocaleContext = createContext<[string, Dispatch<SetStateAction<string>>]>([DEFAULT_LOCALE, () => {
  throw new Error('Expected LocaleContext to be rendered');
}]);

LocaleContext.displayName = 'LocaleContext';

export interface ILocaleProviderProps {
  initialLocale?: string;
}

export const LocaleProvider: FunctionComponent<ILocaleProviderProps> = (props) => {
  const {initialLocale = DEFAULT_LOCALE, children} = props;

  return createElement(LocaleContext.Provider, {value: useState(initialLocale)}, children);
};

LocaleProvider.displayName = 'LocaleProvider';

export function useLocale(): [string, Dispatch<SetStateAction<string>>] {
  return useContext(LocaleContext);
}
