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
export interface MessageFunction<Values extends object | void> {

  <Result>(runtime: IRuntime<Result>, locale: string, values: Values): Result | string;

  displayName?: string | undefined;
}

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
export type ElementRenderer<Result> = (tagName: string, attributes?: Record<string, Result> | null, ...children: Array<Result>) => Result;

/**
 * Renders a fragment.
 *
 * @template Result The type of the rendering result.
 *
 * @param children The fragment children varargs.
 * @returns A rendered fragment.
 */
export type FragmentRenderer<Result> = (...children: Array<Result>) => Result;

/**
 * Renders an arbitrary argument value.
 *
 * @template Result The type of the rendering result.
 *
 * @param locale The locale passed to the message function or a default locale.
 * @param value The argument value.
 * @returns The formatted argument.
 */
export type ArgumentRenderer<Result> = (locale: string, value: unknown) => Result;

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
export type FunctionRenderer<Result> = (locale: string, value: unknown, name: string, param?: Result) => Result;

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
  ARGUMENT = 'a',
  FUNCTION = 'c',
  ATTRIBUTE_FRAGMENT = 'F',
  ATTRIBUTE_ARGUMENT = 'A',
  ATTRIBUTE_FUNCTION = 'C',
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
export interface IRuntime<Result> {
  [RuntimeMethod.ELEMENT]: ElementRenderer<Result | string>;
  [RuntimeMethod.FRAGMENT]: FragmentRenderer<Result | string>;
  [RuntimeMethod.ARGUMENT]: ArgumentRenderer<Result | string>;
  [RuntimeMethod.FUNCTION]: FunctionRenderer<Result | string>;
  [RuntimeMethod.ATTRIBUTE_FRAGMENT]: FragmentRenderer<Result | string>;
  [RuntimeMethod.ATTRIBUTE_ARGUMENT]: ArgumentRenderer<Result | string>;
  [RuntimeMethod.ATTRIBUTE_FUNCTION]: FunctionRenderer<Result | string>;
  [RuntimeMethod.LOCALE]: LocaleMatcher;
  [RuntimeMethod.PLURAL]: PluralMatcher;
  [RuntimeMethod.SELECT]: SelectMatcher;
  [RuntimeMethod.SELECT_ORDINAL]: SelectOrdinalMatcher;
}
