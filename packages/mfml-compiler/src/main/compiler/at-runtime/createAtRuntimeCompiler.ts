import {createMfmlParser, IMfmlParserOptions} from '../../parser';
import {compileFunction, IFunctionCompilerOptions} from './compileFunction';
import {MessageFunction} from 'mfml-runtime';

export interface IAtRuntimeCompilerOptions extends IMfmlParserOptions, IFunctionCompilerOptions {
}

/**
 * Creates a compiler that produces message functions.
 *
 * ```ts
 * import {createAtRuntimeCompiler} from 'mfml-compiler/lib/dynamic';
 * import {stringRuntime} from 'mfml-runtime';
 *
 * const compile = createAtRuntimeCompiler();
 *
 * const message = compile({
 *   en: 'Bye, {name}!',
 *   ru: 'Пока, {name}!',
 *   es: 'Adiós, {name}!',
 * });
 *
 * message(stringRuntime, 'en', {name: 'Karen'}); // → 'Bye, Karen!'
 * ```
 *
 * @param options Compiler options.
 */
export function createAtRuntimeCompiler<Values extends object | void>(options: IAtRuntimeCompilerOptions = {}): (translations: Record<string, string>) => MessageFunction<Values> {
  const parser = createMfmlParser(options);
  return (translations) => compileFunction<Values>(translations, parser, options);
}
