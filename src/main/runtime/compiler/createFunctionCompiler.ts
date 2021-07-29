// import {ITranslations} from '../../compiler/compiler-types';
// import {IRuntime} from '../createRuntime';
// import {createFunctionBodyCompiler} from './createFunctionBodyCompiler';
// import {parseTranslations} from '../../compiler/parseTranslations';
//
// const RUNTIME_VAR_NAME = 'runtime';
// const LOCALES_VAR_NAME = 'locales';
// const LOCALE_VAR_NAME = 'locale';
// const ARGS_VAR_NAME = 'args';
// const INDEX_VAR_NAME = 'i';
//
// export interface IFunctionCompilerOptions {
//   otherSelectCaseKey?: string;
//   defaultLocale?: string;
//   nullable?: boolean;
// }
//
// export type MessageFunction = <T>(runtime: IRuntime<T>, locale: string, args?: object) => T | string | null;
//
// export function createFunctionCompiler(options: IFunctionCompilerOptions = {}): (translations: ITranslations) => MessageFunction {
//
//   const {
//     otherSelectCaseKey,
//     defaultLocale = 'en',
//     nullable,
//   } = options;
//
//   const compileBody = createFunctionBodyCompiler({
//     runtimeVarName: RUNTIME_VAR_NAME,
//     localeVarName: LOCALE_VAR_NAME,
//     argsVarName: ARGS_VAR_NAME,
//     indexVarName: INDEX_VAR_NAME,
//     localesVarName: LOCALES_VAR_NAME,
//     otherSelectCaseKey,
//     defaultLocale,
//     nullable,
//   });
//
//   return (translations) => {
//     const bodySrc = compileBody(parseTranslations(null, translations));
//     return new Function(RUNTIME_VAR_NAME, LOCALE_VAR_NAME, ARGS_VAR_NAME, bodySrc) as MessageFunction;
//   };
// }
