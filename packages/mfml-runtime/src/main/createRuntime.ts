import {IRuntime, IRuntimeHandler, RuntimeMethod} from './runtime-types';
import {createPluralMatcher, exactMatchSelect, matchLocaleOrLanguage} from './runtime-utils';

/**
 * Creates the new runtime that uses provided callbacks.
 *
 * @param handler The runtime callbacks.
 */
export function createRuntime<T>(handler: IRuntimeHandler<T>): IRuntime<T> {

  const {
    renderFragment,
    renderElement,
    renderFunction,
    renderArgument,
    matchLocale = matchLocaleOrLanguage,
    matchSelect = exactMatchSelect,
    matchPlural = createPluralMatcher('cardinal'),
    matchSelectOrdinal = createPluralMatcher('ordinal'),
  } = handler;

  return {
    [RuntimeMethod.FRAGMENT]: renderFragment,
    [RuntimeMethod.ELEMENT]: renderElement,
    [RuntimeMethod.ARGUMENT]: renderArgument,
    [RuntimeMethod.FUNCTION]: renderFunction,
    [RuntimeMethod.LOCALE]: matchLocale,
    [RuntimeMethod.SELECT]: matchSelect,
    [RuntimeMethod.PLURAL]: matchPlural,
    [RuntimeMethod.SELECT_ORDINAL]: matchSelectOrdinal,
  };
}
