import {compileMessage, IMessage, IMessageCompilerDialectOptions} from './compileMessage';
import {createVarNameProvider} from '@smikhalevski/codegen';
import {createMap, jsonStringify, Maybe, Rewriter} from '../misc';
import {RuntimeMethod} from '../runtime';

const RUNTIME_VAR_NAME = 'runtime';
const LOCALE_VAR_NAME = 'locale';
const ARGS_VAR_NAME = 'args';
const INDEX_VAR_NAME = 'i';

const excludedVarNames = [
  RUNTIME_VAR_NAME,
  LOCALE_VAR_NAME,
  ARGS_VAR_NAME,
  INDEX_VAR_NAME,
  RuntimeMethod.LOCALE,
  RuntimeMethod.FRAGMENT,
  RuntimeMethod.ARGUMENT,
  RuntimeMethod.ELEMENT,
  RuntimeMethod.SHORT_ELEMENT,
  RuntimeMethod.FUNCTION,
  RuntimeMethod.PLURAL,
  RuntimeMethod.SELECT,
  RuntimeMethod.SELECT_ORDINAL,
];

export interface IMessageGroup {
  [messageKey: string]: IMessage;
}

export interface IModuleCompilerOptions extends Omit<IMessageCompilerDialectOptions, 'defaultLocale'> {
  renameInterface: Rewriter;
  renameFunction: Rewriter;
  extractComment: (message: IMessage) => Maybe<string>;
  defaultLocale: ((message: IMessage) => string) | string;
}

/**
 * Compiles a group of messages as a module that exports functions and corresponding interfaces.
 *
 * @param messageGroup The map from the message name to an actual message.
 * @param options Compiler options.
 */
export function compileModule(messageGroup: IMessageGroup, options: IModuleCompilerOptions): string {
  const {
    renameInterface,
    renameFunction,
    extractComment,
    defaultLocale,
    nullable,
    otherSelectCaseKey,
    provideFunctionType,
  } = options;

  const supportedLocalesSrcMap = createMap<string>();
  const nextVarName = createVarNameProvider(excludedVarNames);

  let src = '';

  for (const [messageKey, message] of Object.entries(messageGroup)) {

    const supportedLocales = Object.keys(message.translationMap).sort();
    const supportedLocalesVarName = supportedLocales.length > 1 ? supportedLocalesSrcMap[supportedLocales.map(jsonStringify).join(',')] ||= nextVarName() : '';

    src += compileMessage(message, {
      nullable,
      otherSelectCaseKey,
      provideFunctionType,
      interfaceName: renameInterface(messageKey),
      functionName: renameFunction(messageKey),
      runtimeVarName: RUNTIME_VAR_NAME,
      localeVarName: LOCALE_VAR_NAME,
      argsVarName: ARGS_VAR_NAME,
      indexVarName: INDEX_VAR_NAME,
      comment: extractComment(message),
      supportedLocalesVarName,
      defaultLocale: typeof defaultLocale === 'function' ? defaultLocale(message) : defaultLocale,
      supportedLocales,
    });
  }

  const supportedLocaleEntries = Object.entries(supportedLocalesSrcMap);
  if (supportedLocaleEntries.length) {
    src = 'const ' + supportedLocaleEntries.map(([localesSrc, varName]) => varName + '=[' + localesSrc + ']').join(',') + ';' + src;
  }

  return 'import {IRuntime} from "mfml/lib/runtime";' + src;
}
