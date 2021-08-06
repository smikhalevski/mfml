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
  digestFilePath?: string;

  /**
   * Returns a namespace under which the message must be exported.
   */
  renameNamespace?(messageName: string, message: IMessage): string;

  /**
   * Returns the name of the file where namespace must be output. Extension can be omitted.
   */
  rewriteFilePath?(namespace: string): string;
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
    typingsEnabled,
    digestFilePath,
    renameNamespace,
    rewriteFilePath,
  } = config;

  if (digestFilePath != null) {
    assertString(digestFilePath, 'digestFilePath');
  }
  if (renameNamespace != null) {
    assertFunction(renameNamespace, 'renameNamespace');
  }
  if (rewriteFilePath != null) {
    assertFunction(rewriteFilePath, 'rewriteFilePath');
  }

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

    const filePath = (rewriteFilePath ? withoutExtension(rewriteFilePath(namespace)) : namespace) + (typingsEnabled ? '.ts' : '.js');

    namespaces[filePath] ||= namespace;

    (messageModules[filePath] ||= {messages: {}}).messages[messageName] = message;
  }

  let digestSrc = '';

  // Compile modules
  for (const [filePath, messageModule] of Object.entries(messageModules)) {
    if (digestFilePath != null) {
      const modulePath = path.dirname(filePath) + path.sep + withoutExtension(path.basename(filePath));
      digestSrc += `export*as ${namespaces[filePath]} from` + JSON.stringify(modulePath);
    }
    outputFiles[filePath] = compileModule(messageModule, parse, config) + '\n';
  }

  if (errorMessages.length !== 0) {
    die('Compilation failed\n\n' + errorMessages.join('\n\n'));
  }

  if (digestFilePath != null && digestSrc !== '') {
    outputFiles[digestFilePath] = digestSrc;
  }

  for (const [outputFilePath, source] of Object.entries(outputFiles)) {
    writeFileOrDie(path.resolve(outDir, outputFilePath), source, `Failed to write ${formatFilePath(outputFilePath)}`);
  }

  const outputFilePaths = Object.keys(outputFiles);

  logInfo(`Output ${bold(outputFilePaths.length)} files to ${formatFilePath(outDir)}:\n${outputFilePaths.join('\n')}`);
};

export default localeFilesAdapter;
