export interface IRuntimeHandler<T> {

  /**
   * Renders an element.
   *
   * @param tagName The name of the tag to render.
   * @param attributes The element attributes.
   * @param children The element children varargs.
   */
  renderElement(tagName: string, attributes: Record<string, T | string> | null, ...children: Array<T | string>): T | string;

  /**
   * Renders a fragment. Children may be absent if message has no content.
   *
   * @param children The fragment children varargs.
   */
  renderFragment(...children: Array<T | string>): T | string;

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
   *
   * @default {@link matchLocaleOrLanguage}
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
 * The name of the runtime method.
 */
export const enum RuntimeMethod {
  ELEMENT = 'e',
  FRAGMENT = 'f',
  FUNCTION = 'c',
  ARGUMENT = 'a',
  LOCALE = 'l',
  PLURAL = 'p',
  SELECT = 's',
  SELECT_ORDINAL = 'o',
}

/**
 * The runtime that compiled messages use for rendering.
 */
export interface IRuntime<T> {
  [RuntimeMethod.ELEMENT]: IRuntimeHandler<T>['renderElement'];
  [RuntimeMethod.FRAGMENT]: IRuntimeHandler<T>['renderFragment'];
  [RuntimeMethod.FUNCTION]: IRuntimeHandler<T>['renderFunction'];
  [RuntimeMethod.ARGUMENT]: IRuntimeHandler<T>['renderArgument'];
  [RuntimeMethod.LOCALE]: IRuntimeHandler<T>['matchLocale'] & {};
  [RuntimeMethod.PLURAL]: IRuntimeHandler<T>['matchPlural'] & {};
  [RuntimeMethod.SELECT]: IRuntimeHandler<T>['matchSelect'] & {};
  [RuntimeMethod.SELECT_ORDINAL]: IRuntimeHandler<T>['matchSelectOrdinal'] & {};
}
