import {IRuntime, RuntimeMethod} from './runtime-types';
import {createPluralMatcher, exactMatchSelect, matchLocaleOrLanguage} from './runtime-utils';

export interface IRuntimeOptions<T> {

  /**
   * Renders a fragment. Children may be absent if message has no content.
   *
   * @param children The fragment children varargs.
   */
  renderFragment(...children: Array<T | string>): T | string;

  /**
   * Renders an element.
   *
   * @param tagName The name of the tag to render.
   * @param attributes The element attributes.
   * @param children The element children varargs.
   */
  renderElement(tagName: string, attributes: Record<string, T | string> | null, ...children: Array<T | string>): T | string;

  /**
   * Applies a function to an argument value.
   *
   * @param name The function name.
   * @param value An argument value.
   * @param param An optional additional param.
   */
  renderFunction(name: string, value: unknown, param?: T | string): T | string;

  /**
   * Renders an arbitrary argument passed to rendering function.
   *
   * @param value The argument value.
   */
  renderArgument(value: unknown): T | string;

  /**
   * Returns an index of a locale from `locales` that best fits for `locale` or -1 to use the default locale available
   * in message.
   *
   * @param locale The requested locale.
   * @param locales The list of locales supported by the message.
   */
  matchLocale?(locale: string, locales: Array<string>): number;

  /**
   * Returns an index of a case key from `caseKeys` that matches `value` or -1 if no case was found. If -1 is returned
   * then the case with "other" key would be used if it was provided.
   *
   * @param value An argument value.
   * @param caseKeys Case keys varargs.
   */
  matchSelect?(value: unknown, ...caseKeys: Array<string>): number;

  /**
   * Returns the index of the plural category from {@link pluralCategories} that should be used for cardinal
   * pluralization of `value` in the given `locale`.
   *
   * @param locale The locale for which pluralization is applied.
   * @param value An argument value.
   */
  matchPlural?(locale: string, value: number): number;

  /**
   * Returns the index of the plural category from {@link pluralCategories} that should be used for ordinal
   * pluralization of `value` in the given `locale`.
   *
   * @param locale The locale for which pluralization is applied.
   * @param value An argument value.
   */
  matchSelectOrdinal?(locale: string, value: number): number;
}

/**
 * Creates an MFML runtime.
 *
 * @param options Runtime options.
 */
export function createRuntime<T>(options: IRuntimeOptions<T>): IRuntime<T> {

  const {
    renderFragment,
    renderElement,
    renderFunction,
    renderArgument,
    matchLocale = matchLocaleOrLanguage,
    matchSelect = exactMatchSelect,
    matchPlural = createPluralMatcher('cardinal'),
    matchSelectOrdinal = createPluralMatcher('ordinal'),
  } = options;

  return {
    [RuntimeMethod.FRAGMENT]: renderFragment,
    [RuntimeMethod.ELEMENT]: renderElement,
    [RuntimeMethod.ARGUMENT]: renderArgument,
    [RuntimeMethod.SHORT_ELEMENT]: createRenderShortElement(renderElement),
    [RuntimeMethod.FUNCTION]: renderFunction,
    [RuntimeMethod.LOCALE]: matchLocale,
    [RuntimeMethod.SELECT]: matchSelect,
    [RuntimeMethod.PLURAL]: matchPlural,
    [RuntimeMethod.SELECT_ORDINAL]: matchSelectOrdinal,
  };
}

function createRenderShortElement<T>(renderElement: IRuntimeOptions<T>['renderElement']): IRuntime<T>[RuntimeMethod.SHORT_ELEMENT] {
  const args: any = {1: null, length: 1};

  return function (tagName) {
    const argCount = arguments.length;

    if (argCount === 1) {
      return renderElement(tagName, null);
    }
    if (argCount === 2) {
      return renderElement(tagName, null, arguments[1]);
    }

    args[0] = tagName;

    for (let i = 1; i < argCount; ++i) {
      args[i + 1] = arguments[i];
    }
    for (let i = argCount + 1; i < args.length; ++i) {
      args[i] = undefined;
    }

    args.length = argCount + 1;

    return renderElement.apply(undefined, args);
  };
}
