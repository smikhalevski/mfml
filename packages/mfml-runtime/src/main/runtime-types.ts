/**
 * A function that renders a message.
 *
 * @template Values An object type that describes values of the message arguments or `void` if there's no  arguments.
 *
 * @param runtime The runtime that provides methods to render the message.
 * @param locale The locale that defines what translation is used.
 * @param values The ICU argument values.
 * @returns The rendered message translation.
 */
export type MessageFunction<Values extends object | void> = <T>(runtime: IMessageRuntime<T>, locale: string, values: Values) => T | string;

/**
 * Options of the {@link IMessageRuntime}.
 */
export interface IMessageRuntimeOptions<T> {

  dateTimeStyles?: {
    [name: string]: Intl.DateTimeFormatOptions;
    default: Intl.DateTimeFormatOptions;
  };

  numberStyles?: {
    [name: string]: Intl.NumberFormatOptions;
    default: Intl.NumberFormatOptions;
  };

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
   * Renders an arbitrary argument passed to rendering function.
   *
   * @param locale The locale passed to the message function or a default locale.
   * @param value The argument value.
   */
  renderArgument?(locale: string, value: unknown): T | string;

  /**
   * Applies a function to an argument value. If omitted then a function argument is rendered using
   * {@link renderArgument}.
   *
   * @param locale The locale passed to the message function or a default locale.
   * @param name The function name.
   * @param value An argument value.
   * @param param An optional additional param.
   */
  renderFunction?(locale: string, name: string, value: unknown, param?: T | string): T | string;

  /**
   * Returns an index of a locale from `locales` that best fits for `locale` or -1 to use the default locale available
   * in message.
   *
   * @param locale The locale passed to the message function.
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
   * @param locale The locale passed to the message function or a default locale.
   * @param value An argument value.
   */
  matchPlural?(locale: string, value: number): number;

  /**
   * Returns the index of the plural category from {@link pluralCategories} that should be used for ordinal
   * pluralization of `value` in the given `locale`.
   *
   * @param locale The locale passed to the message function or a default locale.
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
export interface IMessageRuntime<T> {
  [RuntimeMethod.ELEMENT]: IMessageRuntimeOptions<T>['renderElement'] & {};
  [RuntimeMethod.FRAGMENT]: IMessageRuntimeOptions<T>['renderFragment'] & {};
  [RuntimeMethod.ARGUMENT]: IMessageRuntimeOptions<T>['renderArgument'] & {};
  [RuntimeMethod.FUNCTION]: IMessageRuntimeOptions<T>['renderFunction'] & {};
  [RuntimeMethod.LOCALE]: IMessageRuntimeOptions<T>['matchLocale'] & {};
  [RuntimeMethod.PLURAL]: IMessageRuntimeOptions<T>['matchPlural'] & {};
  [RuntimeMethod.SELECT]: IMessageRuntimeOptions<T>['matchSelect'] & {};
  [RuntimeMethod.SELECT_ORDINAL]: IMessageRuntimeOptions<T>['matchSelectOrdinal'] & {};
}
