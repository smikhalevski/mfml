/**
 * The name of the runtime method.
 */
export const enum RuntimeMethod {
  LOCALE = 'l',
  FRAGMENT = 'f',
  ARGUMENT = 'a',
  ELEMENT = 'e',
  SHORT_ELEMENT = 'E',
  FUNCTION = 'c',
  PLURAL = 'p',
  SELECT = 's',
  SELECT_ORDINAL = 'o',
}

/**
 * The MFML runtime that renders a message.
 */
export interface IRuntime<T> {

  /**
   * Renders a fragment. Children may be absent if message has no content.
   *
   * @param children The fragment children varargs.
   */
  [RuntimeMethod.FRAGMENT](...children: Array<T | string>): T | string;

  /**
   * Renders an element.
   *
   * @param tagName The name of the tag to render.
   * @param attributes The element attributes.
   * @param children The element children varargs.
   */
  [RuntimeMethod.ELEMENT](tagName: string, attributes: Record<string, T | string> | null, ...children: Array<T | string>): T | string;

  /**
   * Renders an arbitrary argument passed to rendering function.
   *
   * @param value The argument value.
   */
  [RuntimeMethod.ARGUMENT](value: unknown): T | string;

  /**
   * Renders an element without attributes. This method is used to save space in compiled output since usually most
   * tags don't have attributes.
   *
   * @param tagName The name of the tag to render.
   * @param children The element children varargs.
   */
  [RuntimeMethod.SHORT_ELEMENT](tagName: string, ...children: Array<T | string>): T | string;

  /**
   * Applies a function to an argument value.
   *
   * @param name The function name.
   * @param value An argument value.
   * @param param An optional additional param.
   */
  [RuntimeMethod.FUNCTION](name: string, value: unknown, param?: T | string): T | string;

  /**
   * Returns an index of a locale from `locales` that best fits for `locale` or -1 to use the default locale available
   * in message.
   *
   * @param locale The requested locale.
   * @param locales The list of locales supported by the message.
   */
  [RuntimeMethod.LOCALE](locale: string, locales: Array<string>): number;

  /**
   * Returns an index of a case key from `caseKeys` that matches `value` or -1 if no case was found. If -1 is returned
   * then the case with "other" key would be used if it was provided.
   *
   * @param value An argument value.
   * @param caseKeys Case keys varargs.
   */
  [RuntimeMethod.SELECT](value: unknown, ...caseKeys: Array<string>): number;

  /**
   * Returns the index of the plural category from {@link pluralCategories} that should be used for cardinal
   * pluralization of `value` in the given `locale`.
   *
   * @param locale The locale for which pluralization is applied.
   * @param value An argument value.
   */
  [RuntimeMethod.PLURAL](locale: string, value: number): number;

  /**
   * Returns the index of the plural category from {@link pluralCategories} that should be used for ordinal
   * pluralization of `value` in the given `locale`.
   *
   * @param locale The locale for which pluralization is applied.
   * @param value An argument value.
   */
  [RuntimeMethod.SELECT_ORDINAL](locale: string, value: number): number;
}
