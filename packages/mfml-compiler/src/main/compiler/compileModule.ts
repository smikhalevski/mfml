import {compileMessage, IMessageCompilerOptions, IMessageMetadata} from './compileMessage';
import {createVarNameProvider} from '@smikhalevski/codegen';
import {createMap, jsonStringify, Maybe} from '../misc';
import {IMessage, IMessageModule} from './compiler-types';
import {MfmlParser} from '../parser';
import {ILocaleNodeMap} from './compileLocaleNodeMap';
import {runtimeMethods} from './runtimeMethods';
import {camelCase, upperFirst} from 'lodash-es';

const VAR_NAME_RUNTIME = 'runtime';
const VAR_NAME_LOCALE = 'locale';
const VAR_NAME_ARGS = 'values';
const VAR_NAME_INDEX = 'i';

export interface IModuleCompilerOptions extends Pick<IMessageCompilerOptions,
    | 'typingsEnabled'
    | 'provideFunctionType'
    | 'otherSelectCaseKey'> {

  /**
   * The path from which runtime dependencies are imported.
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
   * Returns the default locale for a message. If omitted then the first locale from `message.translations` is used as
   * default.
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
 * Compiles messages as a module that exports functions and corresponding interfaces. May return an empty string is
 * module has no translations.
 *
 * @param messageModule The map from the message name to an actual message.
 * @param mfmlParser The MFML parser instance.
 * @param options Compiler options.
 */
export function compileModule(messageModule: IMessageModule, mfmlParser: MfmlParser, options: Readonly<IModuleCompilerOptions> = {}): string {
  const {
    typingsEnabled,
    runtimeImportPath = 'mfml-runtime',
    renameInterface = renameValuesInterface,
    renameMessageFunction = camelCase,
    otherSelectCaseKey,
    provideFunctionType,
    rewriteTranslation,
    provideDefaultLocale,
    extractComment,
    renderMetadata,
    onError,
  } = options;

  const messageEntries = Object.entries(messageModule.messages);

  if (messageEntries.length === 0) {
    // Nothing to compile
    return '';
  }

  const functionNames = messageEntries.map(([messageName, message]) => renameMessageFunction(messageName, message));

  // Maps locale to a var name {"en_US": "x"}
  const localeVarNameMap = createMap<string>();

  // Maps serialized locales array to a var name like {"[\"en_US\",\"ru_RU\"]": "y"}
  const localesVarSrcMap = createMap<string>();

  // Maps var name to the list of locales stored in that var
  const localesMap = createMap<Array<string>>();

  const varNameProvider = createVarNameProvider([
    VAR_NAME_RUNTIME,
    VAR_NAME_LOCALE,
    VAR_NAME_ARGS,
    VAR_NAME_INDEX,
  ].concat(runtimeMethods, functionNames));

  let src = '';

  for (let i = 0; i < messageEntries.length; ++i) {

    const [messageName, message] = messageEntries[i];
    const locales = Object.keys(message.translations).sort();

    if (locales.length === 0) {
      // Nothing to compile
      continue;
    }

    const defaultLocale = provideDefaultLocale ? provideDefaultLocale(messageName, message) : locales[0];
    const defaultLocaleVarName = localeVarNameMap[defaultLocale] ||= varNameProvider.next();

    if (!locales.includes(defaultLocale)) {
      locales.push(defaultLocale);
      locales.sort();
    }

    let localesVarName = '';

    if (locales.length > 1) {
      localesVarName = localesVarSrcMap[jsonStringify(locales)] ||= varNameProvider.next();
      localesMap[localesVarName] = locales;
    }

    // Maps locale to a parsed node
    const localeNodeMap: ILocaleNodeMap = {};

    try {

      for (const locale of locales) {
        let translation = message.translations[locale];
        if (translation == null) {
          continue;
        }
        // Apply preprocessors
        if (rewriteTranslation != null) {
          translation = rewriteTranslation(translation, locale);
        }
        localeNodeMap[locale] = mfmlParser(translation);
      }

      const compilerOptions: IMessageCompilerOptions = {
        typingsEnabled,
        otherSelectCaseKey,
        provideFunctionType,
        renderMetadata: renderMetadata ? (metadata) => renderMetadata(metadata, messageName, message) : undefined,
        interfaceName: renameInterface(messageName, message),
        functionName: functionNames[i],
        localeVarName: VAR_NAME_LOCALE,
        runtimeVarName: VAR_NAME_RUNTIME,
        argsVarName: VAR_NAME_ARGS,
        indexVarName: VAR_NAME_INDEX,
        comment: extractComment?.(messageName, message),
        defaultLocale,
        defaultLocaleVarName,
        localesVarName,
        locales,
      };

      src += compileMessage(localeNodeMap, compilerOptions);

    } catch (error) {
      if (!onError) {
        throw error;
      }

      src += `let ${functionNames[i]}=/*ERROR*/undefined;`;

      onError(error, messageName, message);
    }
  }

  let localesSrc = '';

  for (const [locale, varName] of Object.entries(localeVarNameMap)) {
    localesSrc += `const ${varName}=${jsonStringify(locale)};`;
  }
  for (const [varName, locales] of Object.entries(localesMap)) {
    localesSrc += `const ${varName}=[`
        + locales.map((locale) => localeVarNameMap[locale] || jsonStringify(locale)).join(',')
        + '];';
  }

  return (typingsEnabled ? `import{MessageFunction}from"${runtimeImportPath}";` : '')
      + localesSrc
      + src
      + `export{${functionNames.join(',')}};`;
}

function renameValuesInterface(messageName: string): string {
  return upperFirst(camelCase(messageName)) + 'Values';
}
