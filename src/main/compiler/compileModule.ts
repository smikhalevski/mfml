import {compileMessage, IMessageCompilerPublicOptions} from './compileMessage';
import {Node} from '../parser';
import {createVarNameProvider} from '../../../../codegen';
import {createMap, jsonStringify} from '../misc';

export interface IModuleCompilerOptions extends IMessageCompilerPublicOptions {
  renameMessageInterface: (key: string) => string;
  renameMessageFunction: (key: string) => string;
  rewriteDisplayName: (key: string) => string | undefined;
}

/**
 * Compiles translations as a module that exports message functions and corresponding argument interfaces.
 *
 * @param translations The map from translation key to a mapping from locale to a parsed AST.
 * @param options Compiler options.
 */
export function compileModule(translations: { [key: string]: { [locale: string]: Node } }, options: IModuleCompilerOptions): string {
  const {
    renameMessageInterface,
    renameMessageFunction,
    rewriteDisplayName,
    renameArgument,
    defaultLocale,
    renameTag,
    renameAttribute,
    renameFunction,
    nullable,
    getFunctionArgumentType,
    otherSelectCaseKey,
  } = options;

  const translationEntries = Object.entries(translations);
  const supportedLocalesMap = createMap<string>();
  const nextVarName = createVarNameProvider();

  let src = '';

  for (const [key, nodeMap] of translationEntries) {

    const supportedLocales = Object.keys(nodeMap).sort();
    const supportedLocalesVarName = supportedLocales.length > 2 ? supportedLocalesMap[supportedLocales.map(jsonStringify).join(',')] ||= nextVarName() : '';

    src += compileMessage(nodeMap, {
      interfaceName: renameMessageInterface(key),
      functionName: renameMessageFunction(key),
      displayName: rewriteDisplayName(key),
      supportedLocales,
      supportedLocalesVarName,
      renameArgument,
      defaultLocale,
      renameTag,
      renameAttribute,
      renameFunction,
      nullable,
      getFunctionArgumentType,
      otherSelectCaseKey,
    });
  }

  const supportedLocalesEntries = Object.entries(supportedLocalesMap);
  if (supportedLocalesEntries.length) {
    src = 'const ' + supportedLocalesEntries.map(([localesSrc, varName]) => src + varName + '=[' + localesSrc + ']').join(',') + ';' + src;
  }

  return 'import {IRuntime} from "mfml/lib/runtime";' + src;
}
