import {createElement, FC, useMemo, useState} from 'react';
import {LocaleContext, LocaleProtocol} from './LocaleContext';
import {useLocale} from './useLocale';

export interface ILocaleProviderProps {

  /**
   * The initial locale value.
   */
  initialLocale?: string;
}

/**
 * Provides a locale value and setter to underlying children.
 */
export const LocaleProvider: FC<ILocaleProviderProps> = (props) => {
  const [defaultLocale] = useLocale();
  const {initialLocale = defaultLocale, children} = props;

  const [locale, setLocale] = useState(initialLocale);
  const value = useMemo<LocaleProtocol>(() => [locale, setLocale], [locale]);

  return createElement(LocaleContext.Provider, {value}, children);
};

LocaleProvider.displayName = 'LocaleProvider';
