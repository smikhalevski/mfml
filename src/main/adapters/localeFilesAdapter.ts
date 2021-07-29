import {Adapter} from './adapter-types';
import {IMessage, IMessageModule} from '../compiler';
import {createMap, trimExtension} from '../misc';
import path from 'path';

export interface ILocaleFilesAdapterOptions {

  /**
   * The name of the index file that would re-export all message modules.
   *
   * @default './index.ts'
   */
  digestFilePath?: string;

  /**
   * If {@link digestFilePath} and {@link renameDigestNamespace} are provided then message functions from a module are
   * exported under a namespace.
   *
   * @param filePath The module file path.
   * @param messageModule The message module that is exported from the digest.
   * @returns The name of the namespace that is exported from the digest and holds messages from the module.
   */
  renameDigestNamespace?(filePath: string, messageModule: IMessageModule): string;

  /**
   * Returns the relative file path with an extension where the message must be stored.
   *
   * @default () => './messages.ts'
   */
  rewriteFilePath?(messageName: string, message: IMessage): string;
}

/**
 * Treats contents each file from `files` as a JSON object that maps a message name to a translation. The name of each
 * file is treated as a locale.
 */
const localeFilesAdapter: Adapter<ILocaleFilesAdapterOptions | undefined | void> = (files, moduleCompiler, options = {}) => {

  const {
    digestFilePath,
    renameDigestNamespace,
    rewriteFilePath = () => './messages.ts',
  } = options;

  const messages = createMap<IMessage>();
  const messageModules = createMap<IMessageModule>();
  const outputFiles: Record<string, string> = {};

  // Collect messages
  for (const [filePath, json] of Object.entries(files)) {
    const locale = trimExtension(path.basename(filePath));

    for (const [messageName, messageSource] of Object.entries<string>(JSON.parse(json))) {
      const message = messages[messageName] ||= {translations: {}};
      message.translations[locale] = messageSource;
    }
  }

  // Assemble message modules
  for (const [messageName, message] of Object.entries(messages)) {
    const messageModule = messageModules[rewriteFilePath(messageName, message)] ||= {messages: {}};
    messageModule.messages[messageName] = message;
  }

  let digestSrc = '';

  // Compile message modules
  for (const [filePath, messageModule] of Object.entries(messageModules)) {

    // Assemble digest contents
    if (digestFilePath != null) {
      if (renameDigestNamespace != null) {
        digestSrc += `export*as ${renameDigestNamespace(filePath, messageModule)} from`;
      } else {
        digestSrc += 'export*from';
      }
      digestSrc += JSON.stringify(filePath);
    }
    outputFiles[filePath] = moduleCompiler(messageModule) + '\n';
  }

  if (digestFilePath != null && digestSrc !== '') {
    outputFiles[digestFilePath] = digestSrc;
  }

  return outputFiles;
};

export default localeFilesAdapter;
