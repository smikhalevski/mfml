import {IMessageRuntime, IMessageRuntimeOptions, RuntimeMethod} from './runtime-types';
import {createFunctionRenderer, createPluralMatcher, exactMatchSelect, matchLocaleOrLanguage} from './runtime-utils';

/**
 * Creates the new runtime that uses provided callbacks.
 *
 * @param options The runtime options.
 */
export function createMessageRuntime<T>(options: IMessageRuntimeOptions<T>): IMessageRuntime<T> {

  const {
    dateTimeStyles,
    numberStyles,
    renderArgument,
    renderFunction,
  } = options;

  const renderArgument0 = renderArgument || ((locale, value) => {
    if (typeof value === 'number') {
      return renderFunction0(locale, 'number', value);
    }
    if (value instanceof Date) {
      return renderFunction0(locale, 'date', value);
    }
    if (value == null || typeof value === 'boolean') {
      return '';
    }
    return value;
  });

  const renderFunction0 = renderFunction || createFunctionRenderer({
    dateTimeStyles,
    numberStyles,
    renderFallback: (locale, name, value) => renderArgument ? renderArgument(locale, value) : value,
  });

  const {
    renderFragment,
    renderElement,
    matchLocale = matchLocaleOrLanguage,
    matchSelect = exactMatchSelect,
    matchPlural = createPluralMatcher('cardinal'),
    matchSelectOrdinal = createPluralMatcher('ordinal'),
  } = options;

  return {
    [RuntimeMethod.FRAGMENT]: renderFragment,
    [RuntimeMethod.ELEMENT]: renderElement,
    [RuntimeMethod.ARGUMENT]: renderArgument0,
    [RuntimeMethod.FUNCTION]: renderFunction0,
    [RuntimeMethod.LOCALE]: matchLocale,
    [RuntimeMethod.SELECT]: matchSelect,
    [RuntimeMethod.PLURAL]: matchPlural,
    [RuntimeMethod.SELECT_ORDINAL]: matchSelectOrdinal,
  };
}
