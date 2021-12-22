import {Dispatch, SetStateAction, useContext} from 'react';
import {LocaleContext} from './LocaleContext';

/**
 * Returns the locale value and setter.
 */
export function useLocale(): [string, Dispatch<SetStateAction<string>>] {
  return useContext(LocaleContext);
}
