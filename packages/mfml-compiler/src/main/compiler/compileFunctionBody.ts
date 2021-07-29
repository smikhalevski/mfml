import {compilePropertyAccessor, createVarNameProvider} from '@smikhalevski/codegen';
import {compileLocaleNodeMap, ILocaleNodeMap, ILocaleNodeMapCompilerOptions} from './index';
import {createMap} from '../misc';
import {runtimeMethods} from './runtimeMethods';

export interface IFunctionBodyCompilerOptions extends Pick<ILocaleNodeMapCompilerOptions,
    | 'localeVarName'
    | 'otherSelectCaseKey'
    | 'defaultLocale'
    | 'indexVarName'
    | 'localesVarName'> {

  /**
   * The name of the variable that holds the runtime object.
   */
  runtimeVarName: string;

  /**
   * The name of the variable that holds the arguments object.
   */
  argsVarName: string;
}

/**
 * Compiles a JavaScript function body that renders a `localeNodeMap`.
 *
 * @param localeNodeMap The map from locale to an AST node.
 * @param options The compiler options.
 */
export function compileFunctionBody(localeNodeMap: ILocaleNodeMap, options: IFunctionBodyCompilerOptions): string {

  const {
    runtimeVarName,
    argsVarName,
    localeVarName,
    otherSelectCaseKey,
    defaultLocale,
    indexVarName,
    localesVarName,
  } = options;

  const varNameProvider = createVarNameProvider([
    localeVarName,
    runtimeVarName,
    argsVarName,
    indexVarName,
    localesVarName,
  ].concat(runtimeMethods));

  const argVarNameMap = createMap<string>();
  const locales = Object.keys(localeNodeMap);

  const runtimeVarsSrc = /*@__INLINE__*/compileRuntimeMethodVars(runtimeVarName);

  const resultSrc = compileLocaleNodeMap(localeNodeMap, {
    otherSelectCaseKey,
    indexVarName,
    provideArgumentVarName: (name) => argVarNameMap[name] ||= varNameProvider.next(),
    localeVarName,
    defaultLocale,
    locales,
    localesVarName,
  });

  return 'var '
      + indexVarName
      + runtimeVarsSrc
      + (locales.length > 1 ? ',' + localesVarName + '=' + JSON.stringify(locales) : '')
      + /*@__INLINE__*/compileArgVarNameMap(argsVarName, argVarNameMap)
      + ';'
      + 'return ' + resultSrc;
}

function compileArgVarNameMap(argsVarName: string, argVarNameMap: Record<string, string>): string {
  let src = '';
  for (const [argName, varName] of Object.entries(argVarNameMap)) {
    src += ',' + varName + '=' + argsVarName + compilePropertyAccessor(argName);
  }
  return src;
}

function compileRuntimeMethodVars(runtimeVarName: string): string {
  let src = '';
  for (const runtimeMethod of runtimeMethods) {
    src += ',' + runtimeMethod + '=' + runtimeVarName + '.' + runtimeMethod;
  }
  return src;
}
