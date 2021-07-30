import {IRuntime} from 'mfml-runtime';
import {compileFunctionBody} from './compileFunctionBody';
import {ILocaleNodeMap} from './compileLocaleNodeMap';
import {createMap} from '../misc';
import {MfmlParser} from '../parser';

const VAR_NAME_RUNTIME = 'runtime';
const VAR_NAME_LOCALES = 'locales';
const VAR_NAME_LOCALE = 'locale';
const VAR_NAME_ARGS = 'args';
const VAR_NAME_INDEX = 'i';

export interface IFunctionCompilerOptions {

  /**
   * The key that is used as the default for `select`.
   *
   * @default "other"
   */
  otherSelectCaseKey?: string;

  /**
   * The default locale that that would be used if no other locales from `translations` matched.
   *
   * @default 'en'
   */
  defaultLocale?: string;
}

/**
 * A function that renders a translation.
 */
export type MessageFunction<Args = any> = <T>(runtime: IRuntime<T>, locale: string, args: Args) => T | string | null;

/**
 * Compiles an executable function that renders a translation.
 *
 * @param translations The translations to compile.
 * @param mfmlParser The MFML parser instance.
 * @param options Compiler options.
 */
export function compileFunction(translations: Record<string, string>, mfmlParser: MfmlParser, options: IFunctionCompilerOptions = {}): MessageFunction {

  const {
    otherSelectCaseKey = 'other',
    defaultLocale = 'en',
  } = options;

  const localeNodeMap: ILocaleNodeMap = createMap();

  for (const [locale, translation] of Object.entries(translations)) {
    localeNodeMap[locale] = mfmlParser(translation);
  }

  const bodySrc = compileFunctionBody(localeNodeMap, {
    runtimeVarName: VAR_NAME_RUNTIME,
    localeVarName: VAR_NAME_LOCALE,
    argsVarName: VAR_NAME_ARGS,
    indexVarName: VAR_NAME_INDEX,
    localesVarName: VAR_NAME_LOCALES,
    otherSelectCaseKey,
    defaultLocale,
  });

  return new Function(VAR_NAME_RUNTIME, VAR_NAME_LOCALE, VAR_NAME_ARGS, bodySrc) as MessageFunction;
}
