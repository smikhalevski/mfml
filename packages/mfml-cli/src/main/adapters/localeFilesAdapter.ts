import {IMessage, IMessageModule} from 'mfml-compiler';
import * as path from 'path';
import {Adapter} from '../cli-types';

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
   * Returns the name of the file where namespace must be output.
   */
  rewriteFilePath?(namespace: string): string;
}

/**
 * Treats contents each file from `files` as a JSON object that maps a message name to a translation. The name of each
 * file is treated as a locale.
 */
const localeFilesAdapter: Adapter<ILocaleFilesAdapterOptions | null | undefined | void> = (includedFiles, moduleCompiler, options) => {

  options ||= {};

  const {
    digestFilePath,
    renameNamespace = () => 'messages',
    rewriteFilePath = (namespace) => namespace + '.ts',
  } = options;

  const messages = createMap<IMessage>();
  const messageModules = createMap<IMessageModule>();
  const namespaces = createMap<string>();
  const outputFiles = createMap<string>();

  // Assemble messages
  for (const [includedFilePath, json] of Object.entries(includedFiles)) {
    const locale = path.basename(includedFilePath, '.json');

    for (const [messageName, messageSource] of Object.entries<string>(JSON.parse(json))) {
      const message = messages[messageName] ||= {translations: {}};
      message.translations[locale] = messageSource;
    }
  }

  // Assemble modules
  for (const [messageName, message] of Object.entries(messages)) {
    const namespace = renameNamespace(messageName, message);
    const filePath = rewriteFilePath(namespace);

    namespaces[filePath] ||= namespace;

    const messageModule = messageModules[filePath] ||= {messages: {}};
    messageModule.messages[messageName] = message;
  }

  let digestSrc = '';
  let failed = false;

  const errors = createMap<unknown>();

  const handleError = (error: unknown, messageName: string) => {
    failed = true;
    errors[messageName] = error;
  };

  // Compile modules
  for (const [filePath, messageModule] of Object.entries(messageModules)) {
    if (digestFilePath != null) {
      const modulePath = path.dirname(filePath) + path.sep + path.basename(filePath, '.ts');
      digestSrc += `export*as ${namespaces[filePath]} from` + JSON.stringify(modulePath);
    }
    outputFiles[filePath] = moduleCompiler(messageModule, handleError) + '\n';
  }

  if (failed) {
    for (const [messageName, error] of Object.entries(errors)) {
      console.log(messageName + '\n' + (error instanceof Error ? error.message : error));
    }
    return {};
  }

  if (digestFilePath != null && digestSrc !== '') {
    outputFiles[digestFilePath] = digestSrc;
  }

  return outputFiles;
};

export default localeFilesAdapter;

function createMap<T = any>(): Record<string, T> {
  return Object.create(null);
}
