import {
  ARGS_VAR_NAME,
  compileMessage,
  IMessage,
  IMessageCompilerPublicOptions,
  LOCALE_VAR_NAME,
  RUNTIME_VAR_NAME,
} from './compileMessage';
import {createVarNameProvider} from '@smikhalevski/codegen';
import {createMap, jsonStringify} from '../misc';
import {TEMP_VAR_NAME} from './compileNode';
import {RuntimeMethod} from '../runtime';

export interface IMessageGroup {
  [messageKey: string]: IMessage;
}

export interface IModuleCompilerOptions extends IMessageCompilerPublicOptions {
  renameMessageInterface: (key: string) => string;
  renameMessageFunction: (key: string) => string;
  rewriteDisplayName: (key: string) => string | undefined;
}

/**
 * Compiles translations as a module that exports message functions and corresponding argument interfaces.
 *
 * @param messageGroup The map from translation key to a mapping from locale to a parsed AST.
 * @param options Compiler options.
 */
export function compileModule(messageGroup: IMessageGroup, options: IModuleCompilerOptions): string {
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

  const supportedLocalesSrcMap = createMap<string>();
  const nextVarName = createVarNameProvider([
    RUNTIME_VAR_NAME,
    LOCALE_VAR_NAME,
    ARGS_VAR_NAME,
    TEMP_VAR_NAME,
    RuntimeMethod.LOCALE,
    RuntimeMethod.FRAGMENT,
    RuntimeMethod.ARGUMENT,
    RuntimeMethod.ELEMENT,
    RuntimeMethod.SHORT_ELEMENT,
    RuntimeMethod.FUNCTION,
    RuntimeMethod.PLURAL,
    RuntimeMethod.SELECT,
    RuntimeMethod.SELECT_ORDINAL,
  ]);

  let src = '';

  for (const [key, message] of Object.entries(messageGroup)) {

    const supportedLocales = Object.keys(message).sort();
    const supportedLocalesVarName = supportedLocales.length > 1 ? supportedLocalesSrcMap[supportedLocales.map(jsonStringify).join(',')] ||= nextVarName() : '';

    src += compileMessage(message, {
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

  const supportedLocaleEntries = Object.entries(supportedLocalesSrcMap);
  if (supportedLocaleEntries.length) {
    src = 'const ' + supportedLocaleEntries.map(([localesSrc, varName]) => varName + '=[' + localesSrc + ']').join(',') + ';' + src;
  }

  return 'import {IRuntime} from "mfml/lib/runtime";' + src;
}
