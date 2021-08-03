/**
 * A function that renders a message using `runtime`. Compiler produces functions of this type.
 *
 * @template Values An object type that describes values of the message arguments or `void` if there's no  arguments.
 * @template Result The type of the rendering result.
 *
 * @param runtime The runtime that provides methods to render the message.
 * @param locale The locale that defines what translation is used.
 * @param values The ICU argument values.
 * @returns The rendered message translation.
 */
export type MessageFunction<Values extends object | void> = <T>(runtime: IRuntime<T>, locale: string, values: Values) => T | string;

/**
 * Renders an element by `tagName`.
 *
 * @template Result The type of the rendering result.
 *
 * @param tagName The name of the tag to render.
 * @param attributes The element attributes.
 * @param children The element children varargs.
 * @returns The rendered element.
 */
export type ElementRenderer<T> = (tagName: string, attributes: Record<string, T> | null, ...children: Array<T>) => T;

/**
 * Renders a fragment.
 *
 * @template Result The type of the rendering result.
 *
 * @param children The fragment children varargs.
 * @returns A rendered fragment.
 */
export type FragmentRenderer<T> = (...children: Array<T>) => T;

/**
 * Renders an arbitrary argument value.
 *
 * @template Result The type of the rendering result.
 *
 * @param locale The locale passed to the message function or a default locale.
 * @param value The argument value.
 * @returns The formatted argument.
 */
export type ArgumentRenderer<T> = (locale: string, value: unknown) => T;

/**
 * Renders an argument value formatted using a function.
 *
 * @template Result The type of the rendering result.
 *
 * @param locale The locale passed to the message function or a default locale.
 * @param name The formatter function name.
 * @param value An argument value.
 * @param param An optional additional param.
 * @returns The formatted argument.
 */
export type FunctionRenderer<T> = (locale: string, value: unknown, name: string, param?: T) => T;

/**
 * Looks up a locale among `locales` that best fits `locale`.
 *
 * @param locale The locale passed to the message function.
 * @param locales The list of locales supported by the message.
 * @returns The index of a locale from `locales` that matches `locale` or -1 to use the default locale.
 */
export type LocaleMatcher = (locale: string, locales: Array<string>) => number;

/**
 * Detects the plural category that should be used for cardinal pluralization of `value` with the `locale`.
 *
 * @param locale The locale passed to the message function or a default locale.
 * @param value An argument value.
 * @returns The index of the plural category from {@link pluralCategories}.
 */
export type PluralMatcher = (locale: string, value: number) => number;

/**
 * Matches value with case keys.
 *
 * @param value An argument value.
 * @param caseKeys Case keys varargs.
 * @returns The index of a case key from `caseKeys` that matches `value` or -1 if no case was found. If -1 is returned
 *     then the case with "other" key would be used if it was provided.
 */
export type SelectMatcher = (value: unknown, ...caseKeys: Array<string>) => number;

/**
 * Detects the plural category that should be used for ordinal pluralization of `value` with the `locale`.
 *
 * @param locale The locale passed to the message function or a default locale.
 * @param value An argument value.
 * @returns The index of the plural category from {@link pluralCategories}.
 */
export type SelectOrdinalMatcher = (locale: string, value: number) => number;

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
 * The runtime that message functions use for rendering.
 *
 * @template Result The type of the rendering result.
 */
export interface IRuntime<T> {
  [RuntimeMethod.ELEMENT]: ElementRenderer<T | string>;
  [RuntimeMethod.FRAGMENT]: FragmentRenderer<T | string>;
  [RuntimeMethod.ARGUMENT]: ArgumentRenderer<T | string>;
  [RuntimeMethod.FUNCTION]: FunctionRenderer<T | string>;
  [RuntimeMethod.LOCALE]: LocaleMatcher;
  [RuntimeMethod.PLURAL]: PluralMatcher;
  [RuntimeMethod.SELECT]: SelectMatcher;
  [RuntimeMethod.SELECT_ORDINAL]: SelectOrdinalMatcher;
}
