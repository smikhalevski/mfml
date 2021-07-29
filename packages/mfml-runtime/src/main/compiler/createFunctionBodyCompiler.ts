// import {ILocaleNodeMap} from '../../compiler/compiler-types';
// import {compilePropertyAccessor, createVarNameProvider} from '../codegen';
// import {runtimeMethods} from '../index';
// import {
//   compileLocaleNodeMap,
//   ILocaleNodeMapCompilerDialectOptions,
//   ILocaleNodeMapCompilerOptions,
// } from '../../compiler/compileLocaleNodeMap';
// import {createNodeCompiler, INodeCompilerDialectOptions} from '../../compiler/compileNode';
// import {setMap} from '../../misc';
//
// export interface IFunctionBodyCompilerOptions extends ILocaleNodeMapCompilerDialectOptions, INodeCompilerDialectOptions {
//
//   /**
//    * The name of the variable that holds the runtime object.
//    */
//   runtimeVarName: string;
//
//   /**
//    * The name of the variable that holds the arguments object.
//    */
//   argsVarName: string;
// }
//
// export type FunctionBodyCompiler = (localeNodeMap: ILocaleNodeMap) => string;
//
// export function createFunctionBodyCompiler(options: IFunctionBodyCompilerOptions): FunctionBodyCompiler {
//
//   const {
//     runtimeVarName,
//     argsVarName,
//     localeVarName,
//     otherSelectCaseKey,
//     defaultLocale,
//     indexVarName,
//     localesVarName,
//     nullable,
//   } = options;
//
//   const varNameProvider = createVarNameProvider([
//     localeVarName,
//     runtimeVarName,
//     argsVarName,
//     indexVarName,
//     localesVarName,
//   ].concat(runtimeMethods));
//
//   const argVarNameMap = new Map<string, string>();
//
//   const compileNode = createNodeCompiler({
//     nullable,
//     otherSelectCaseKey,
//     indexVarName,
//     provideArgumentVarName: (name) => argVarNameMap.get(name) || setMap(argVarNameMap, name, varNameProvider.next()),
//   });
//
//   const runtimeVarsSrc = /*@__INLINE__*/compileRuntimeMethodVars(runtimeVarName);
//
//   const compilerOptions: ILocaleNodeMapCompilerOptions = {
//     compileNode,
//     localeVarName,
//     indexVarName,
//     defaultLocale,
//     locales: [],
//     localesVarName,
//     nullable,
//   };
//
//   return (localeNodeMap) => {
//     argVarNameMap.clear();
//
//     const locales = compilerOptions.locales = Object.keys(localeNodeMap);
//
//     const resultSrc = compileLocaleNodeMap(localeNodeMap, compilerOptions);
//
//     return 'var '
//         + indexVarName
//         + runtimeVarsSrc
//         + (locales.length > 1 ? ',' + localesVarName + '=' + JSON.stringify(locales) : '')
//         + /*@__INLINE__*/compileArgVarNameMap(argsVarName, argVarNameMap)
//         + ';'
//         + 'return ' + resultSrc;
//   };
// }
//
// function compileArgVarNameMap(argsVarName: string, argVarNameMap: Map<string, string>): string {
//   let src = '';
//   argVarNameMap.forEach((argName, varName) => {
//     src += ',' + varName + '=' + argsVarName + compilePropertyAccessor(argName);
//   });
//   return src;
// }
//
// function compileRuntimeMethodVars(runtimeVarName: string): string {
//   let src = '';
//   for (const runtimeMethod of runtimeMethods) {
//     src += ',' + runtimeMethod + '=' + runtimeVarName + '.' + runtimeMethod;
//   }
//   return src;
// }
