import {compileMessage, IMessageCompilerOptions, IMessageMetadata} from './compileMessage';
import {camelCase, createVarNameProvider, pascalCase} from '@smikhalevski/codegen';
import {createMap, jsonStringify, Maybe} from '../misc';
import {runtimeMethods} from 'mfml-runtime';
import {IMessage, IMessageModule} from './compiler-types';
import {MfmlParser, Node} from '../parser';
import {ILocaleNodeMap} from './compileLocaleNodeMap';

const VAR_NAME_RUNTIME = 'runtime';
const VAR_NAME_LOCALE = 'locale';
const VAR_NAME_ARGS = 'args';
const VAR_NAME_INDEX = 'i';

export interface IModuleCompilerOptions extends Pick<IMessageCompilerOptions,
    | 'nullable'
    | 'provideFunctionType'
    | 'otherSelectCaseKey'> {

  /**
   * Returns the default locale for a message.
   *
   * @default () => 'en'
   */
  provideDefaultLocale?(messageName: string, message: IMessage): string;

  /**
   * Returns an arguments interface name.
   *
   * @default `pascalCase`
   */
  renameInterface?(messageName: string, message: IMessage): string;

  /**
   * Returns a message rendering function name.
   *
   * @default `camelCase`
   */
  renameMessageFunction?(messageName: string, message: IMessage): string;

  /**
   * Returns the doc comment rendered.
   */
  extractComment?(messageName: string, message: IMessage): Maybe<string>;

  /**
   * Returns arbitrary source code that is rendered after message function rendering is completed.
   */
  renderMetadata?(messageName: string, message: IMessage, metadata: IMessageMetadata): Maybe<string>;
}

/**
 * Compiles messages as a module that exports functions and corresponding interfaces.
 *
 * @param messageModule The map from the message name to an actual message.
 * @param mfmlParser The MFML parser instance.
 * @param options Compiler options.
 */
export function compileModule(messageModule: IMessageModule, mfmlParser: MfmlParser, options: Readonly<IModuleCompilerOptions> = {}): string {
  const {
    renameInterface = pascalCase,
    renameMessageFunction = camelCase,
    nullable,
    otherSelectCaseKey,
    provideFunctionType,
    provideDefaultLocale = () => 'en',
    extractComment,
    renderMetadata,
  } = options;

  const messageEntries = Object.entries(messageModule.messages);
  const functionNames = messageEntries.map(([messageName, message]) => renameMessageFunction(messageName, message));
  const localesVarSrcMap = createMap<string>();

  const varNameProvider = createVarNameProvider([
    VAR_NAME_RUNTIME,
    VAR_NAME_LOCALE,
    VAR_NAME_ARGS,
    VAR_NAME_INDEX,
  ].concat(runtimeMethods, functionNames));

  let src = '';

  for (const [messageName, message] of messageEntries) {

    const locales = Object.keys(message.translations).sort();
    const localesVarName = locales.length > 1 ? localesVarSrcMap[jsonStringify(locales)] ||= varNameProvider.next() : '';

    const localeNodeMap: ILocaleNodeMap = {};
    for (const locale of locales) {
      localeNodeMap[locale] = mfmlParser(message.translations[locale]);
    }

    src += compileMessage(localeNodeMap, {
      nullable,
      otherSelectCaseKey,
      provideFunctionType,
      renderMetadata: renderMetadata ? (metadata) => renderMetadata(messageName, message, metadata) : undefined,
      interfaceName: renameInterface(messageName, message),
      functionName: renameMessageFunction(messageName, message),
      localeVarName: VAR_NAME_LOCALE,
      runtimeVarName: VAR_NAME_RUNTIME,
      argsVarName: VAR_NAME_ARGS,
      indexVarName: VAR_NAME_INDEX,
      comment: extractComment?.(messageName, message),
      defaultLocale: provideDefaultLocale(messageName, message),
      localesVarName,
      locales,
    });
  }

  return 'import{IRuntime}from"mfml-runtime";'
      + Object.entries(localesVarSrcMap).reduce((src, [localesSrc, localesVarName]) => src
          + `const ${localesVarName}=${localesSrc};`,
          '')
      + src
      + (functionNames.length ? `export{${functionNames.join(',')}};` : '');
}
