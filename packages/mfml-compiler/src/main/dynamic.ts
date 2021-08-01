import {createMfmlParser, IMfmlParserOptions} from './parser';
import {compileFunction, IFunctionCompilerOptions} from './compiler/compileFunction';
import {MessageFunction} from 'mfml-runtime';

export * from './parser';
export * from './compiler/compileFunction';

export interface IDynamicCompilerOptions extends IMfmlParserOptions, IFunctionCompilerOptions {
}

/**
 * Creates the dynamic message function compiler that can transform translations to a message function on the fly.
 *
 * ```ts
 * import {createDynamicCompiler} from 'mfml-compiler/lib/dynamic';
 * import {stringRuntime} from 'mfml-runtime';
 *
 * const compile = createDynamicCompiler();
 *
 * const message = compile({
 *   en: 'Hello, {name}!',
 *   ru: 'Привет, {name}!',
 *   es: 'Adiós, {name}!',
 * });
 *
 * message(stringRuntime, 'en', {name: 'Karen'}); // → 'Hello, Karen!'
 * ```
 *
 * @param options Compiler options.
 */
export function createDynamicCompiler<Values extends object | void>(options: IDynamicCompilerOptions = {}): (translations: Record<string, string>) => MessageFunction<Values> {
  const parser = createMfmlParser(options);
  return (translations) => compileFunction<Values>(translations, parser, options);
}
