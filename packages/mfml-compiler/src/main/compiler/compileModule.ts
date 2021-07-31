import {compileMessage, IMessageCompilerOptions, IMessageMetadata} from './compileMessage';
import {camelCase, createVarNameProvider, pascalCase} from '@smikhalevski/codegen';
import {createMap, die, jsonStringify, Maybe} from '../misc';
import {IMessage, IMessageModule} from './compiler-types';
import {MfmlParser} from '../parser';
import {ILocaleNodeMap} from './compileLocaleNodeMap';
import {runtimeMethods} from './runtimeMethods';

const VAR_NAME_RUNTIME = 'runtime';
const VAR_NAME_LOCALE = 'locale';
const VAR_NAME_ARGS = 'values';
const VAR_NAME_INDEX = 'i';

export interface IModuleCompilerOptions extends Pick<IMessageCompilerOptions,
    | 'provideFunctionType'
    | 'otherSelectCaseKey'> {

  /**
   * The path from which a `MessageFunction` type is imported.
   *
   * @default `"mfml-runtime"`
   */
  runtimeImportPath?: string;

  /**
   * Receives a message translation and returns a new translation.
   *
   * Use this to apply preprocessors (such as markdown-to-HTML) or typography re-writers.
   *
   * @param translation The text of the translation.
   * @param locale The translation locale.
   */
  rewriteTranslation?(translation: string, locale: string): string;

  /**
   * Returns the default locale for a message.
   *
   * @default `() => "en"`
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
  renderMetadata?(metadata: IMessageMetadata, messageName: string, message: IMessage): Maybe<string>;

  /**
   * Triggered if an error occurred while compiling a message. If omitted then an error is thrown.
   */
  onError?(error: unknown, messageName: string, message: IMessage): void;
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
    runtimeImportPath = 'mfml-runtime',
    renameInterface = pascalCase,
    renameMessageFunction = camelCase,
    otherSelectCaseKey,
    provideFunctionType,
    rewriteTranslation,
    provideDefaultLocale = () => 'en',
    extractComment,
    renderMetadata,
    onError,
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
      let translation = message.translations[locale];

      if (rewriteTranslation != null) {
        translation = rewriteTranslation(translation, locale);
      }
      localeNodeMap[locale] = mfmlParser(translation);
    }

    const compilerOptions: IMessageCompilerOptions = {
      otherSelectCaseKey,
      provideFunctionType,
      renderMetadata: renderMetadata ? (metadata) => renderMetadata(metadata, messageName, message) : undefined,
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
    };

    try {
      src += compileMessage(localeNodeMap, compilerOptions);
    } catch (error) {
      if (onError) {
        onError(error, messageName, message);
      } else {
        die('Message compilation failed: ' + messageName);
      }
    }
  }

  return `import{MessageFunction}from"${runtimeImportPath}";`
      + Object.entries(localesVarSrcMap).reduce((src, [localesSrc, localesVarName]) => src
          + `const ${localesVarName}=${localesSrc};`,
          '')
      + src
      + (functionNames.length ? `export{${functionNames.join(',')}};` : '');
}
