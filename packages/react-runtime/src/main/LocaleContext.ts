import {createContext, Dispatch, SetStateAction} from 'react';

export type LocaleProtocol = [string, Dispatch<SetStateAction<string>>];

/**
 * The context that provides current locale to {@link Message} and {@link useMessage}.
 *
 * @see {@link LocaleProvider}
 */
export const LocaleContext = createContext<LocaleProtocol>(['en', () => {
  throw new Error('Locale cannot be set because the application is not wrapped in LocaleProvider');
}]);

LocaleContext.displayName = 'LocaleContext';
