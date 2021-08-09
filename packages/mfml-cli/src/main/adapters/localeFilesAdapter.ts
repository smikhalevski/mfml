import {compileModule, createMfmlParser, IMessage, IMessageModule} from 'mfml-compiler';
import path from 'path';
import {Adapter} from '../cli-types';
import {
  assert,
  assertFunction,
  assertString,
  bold,
  createMap,
  die,
  errorMessage,
  formatFilePath,
  isObject,
  isString,
  requireOrDie,
  withoutExtension,
  writeFileOrDie,
} from '../misc';
import {logInfo} from '../log-utils';

export interface ILocaleFilesAdapterOptions {

  /**
   * The name of the index file that exports all message modules.
   */
  digestModulePath?: string;

  /**
   * The file name suffix added to a namespace file. This file re-exports all message functions under a namespace.
   *
   * @default "-namespace"
   */
  namespaceModuleSuffix?: string;

  /**
   * Returns a namespace under which the message must be exported.
   */
  renameNamespace?(messageName: string, message: IMessage): string;

  /**
   * Returns the name of the file where namespace must be output. Extension can be omitted.
   */
  rewriteModulePath?(namespace: string): string;
}

/**
 * Treats contents each file from `files` as a JSON object that maps a message name to a translation. The name of each
 * file is treated as a locale.
 */
const localeFilesAdapter: Adapter<ILocaleFilesAdapterOptions> = (config) => {

  const {
    onError,
    include,
    rootDir,
    outDir,
    digestModulePath,
    typingsEnabled,
    renameNamespace,
    rewriteModulePath,
  } = config;

  let {namespaceModuleSuffix} = config;

  namespaceModuleSuffix ||= '-namespace';

  if (digestModulePath != null) {
    assertString(digestModulePath, 'digestModulePath');
  }
  if (renameNamespace != null) {
    assertFunction(renameNamespace, 'renameNamespace');
  }
  if (rewriteModulePath != null) {
    assertFunction(rewriteModulePath, 'rewriteModulePath');
  }

  assertString(namespaceModuleSuffix, 'namespaceModuleSuffix');

  const errorMessages: Array<string> = [];

  config = {
    ...config,

    onError(error, messageName, message) {
      errorMessages.push(`Message ${bold(messageName)}\n${errorMessage(error)}`);
      onError?.(error, messageName, message);
    },
  };

  const parse = createMfmlParser(config);
  const messages = createMap<IMessage>();
  const messageModules = createMap<IMessageModule>();
  const namespaces = createMap<string>();
  const outputFiles = createMap<string>();
  const moduleExtension = typingsEnabled ? '.ts' : '.js';

  // Assemble messages
  for (let filePath of include) {
    filePath = path.resolve(rootDir, filePath);
    const translations = requireOrDie(filePath, `Failed to load translations from ${formatFilePath(filePath)}`);

    assert(isObject(translations), `Expected map from translation key to a string in ${formatFilePath(filePath)}`);

    const locale = withoutExtension(path.basename(filePath));

    for (const [messageName, messageSource] of Object.entries<string>(translations)) {
      (messages[messageName] ||= {translations: {}}).translations[locale] = messageSource;
    }
  }

  // Assemble modules
  for (const [messageName, message] of Object.entries(messages)) {
    const namespace = renameNamespace ? renameNamespace(messageName, message) : 'messages';

    assert(isString(namespace) && namespace.length !== 0, `The namespace for message ${bold(messageName)} was expected`);

    let modulePath = rewriteModulePath ? rewriteModulePath(namespace) : '.' + path.sep + namespace;

    // Ensure that relative paths start with dot
    modulePath = path.dirname(modulePath) + path.sep + path.basename(modulePath);

    namespaces[modulePath] ||= namespace;

    (messageModules[modulePath] ||= {messages: {}}).messages[messageName] = message;
  }

  for (const [modulePath, messageModule] of Object.entries(messageModules)) {

    // Compile module
    outputFiles[modulePath] = compileModule(messageModule, parse, config) + '\n';

    // Compile namespace module
    if (digestModulePath != null) {
      outputFiles[modulePath + namespaceModuleSuffix] = `export*as ${namespaces[modulePath]} from${JSON.stringify(modulePath)};`;
    }
  }

  if (errorMessages.length !== 0) {
    die('Compilation failed\n\n' + errorMessages.join('\n\n'));
  }

  if (digestModulePath != null) {
    outputFiles[digestModulePath] = Object.keys(messageModules).map((modulePath) => `export*from${JSON.stringify(modulePath + namespaceModuleSuffix)};`).join('');
  }

  for (const [modulePath, source] of Object.entries(outputFiles)) {
    writeFileOrDie(path.resolve(outDir, modulePath + moduleExtension), source, `Failed to write ${formatFilePath(modulePath)}`);
  }

  const outputFilePaths = Object.keys(outputFiles);

  logInfo(`Output ${bold(outputFilePaths.length)} files to ${formatFilePath(outDir)}:\n${outputFilePaths.join('\n')}\n`);
};

export default localeFilesAdapter;
