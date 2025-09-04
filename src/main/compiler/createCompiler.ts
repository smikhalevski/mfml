import { Child, MessageNode } from '../ast.js';
import { Parser } from '../parser/index.js';
import { collectArgumentNames, escapeIdentifier } from '../utils.js';

/**
 * Options of {@link createCompiler}.
 *
 * @group Compiler
 */
export interface CompilerOptions {
  /**
   * Parser that converts a MFML text message to an MFML AST.
   */
  parser: Parser;

  /**
   * The array of callbacks that are run before message tokenization.
   */
  preprocessors?: Array<(text: string, locale: string, messageKey: string) => Promise<string> | string>;

  /**
   * The array of callbacks that are run after the message was parsed as an MFML AST.
   */
  postprocessors?: Array<
    (messageNode: MessageNode<any>, messageKey: string) => Promise<MessageNode<any>> | MessageNode<any>
  >;

  /**
   * Returns the name of a message function for the given message key.
   *
   * By default, an escaped message key is used as a function name.
   */
  renameMessageFunction?: (messageKey: string) => string;
}

/**
 * Compiles MFML messages to a source code.
 *
 * @group Compiler
 */
export interface Compiler {
  /**
   * Compiles MFML messages to a source code.
   *
   * @param messages Messages arranged by a locale.
   * @returns The source of a module that exports message functions.
   */
  compile(messages: { [locale: string]: { [messageKey: string]: string } }): Promise<Record<string, string>>;
}

/**
 * Creates a compiler that converts MFML to a source code.
 *
 * @example
 * import { createParser, htmlTokenizer } from 'mfml/parser';
 * import { compileFiles } from 'mfml/compiler';
 *
 * const compiler = createCompiler({
 *   parser: createParser({ tokenizer: htmlTokenizer })
 * });
 *
 * const files = await compiler.compile({
 *   "en-US": {
 *     "messageCount": "You have <b>{count, number}</b> unread messages",
 *     "messageReceived": "{gender, select, male {He} female {She} other {They}} sent you a message",
 *   },
 *   "ru-RU": {
 *     "messageCount": "У вас <b>{count, number}</b> непрочитанных сообщений",
 *     "messageReceived": "{gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение",
 *   }
 * });
 *
 * for (const file in files) {
 *   fs.writeFileSync(file, files[file]);
 * }
 *
 * @param options Compilation options.
 * @group Compiler
 */
export function createCompiler(options: CompilerOptions): Compiler {
  return {
    compile(messages) {
      return compileFiles(messages, options);
    },
  };
}

/**
 * Compiles MFML AST as a source code.
 *
 * @param messages Messages arranged by a locale.
 * @param options Compilation options.
 * @returns The map from a file path to a file contents.
 */
export async function compileFiles(
  messages: { [locale: string]: { [messageKey: string]: string } },
  options: CompilerOptions
): Promise<Record<string, string>> {
  const { parser, preprocessors, postprocessors, renameMessageFunction = escapeIdentifier } = options;

  const locales = Object.keys(messages);

  const messageKeys = new Set(locales.flatMap(locale => Object.keys(messages[locale])));

  const files: Record<string, string> = {};

  const localeVars: Record<string, string> = {};

  let indexSrc = '';
  let typingsSrc = 'import{MessageNode}from"mfml";\n';
  let localesSrc = '';

  for (const locale of locales) {
    const localeVar = 'LOCALE_' + escapeIdentifier(locale).toUpperCase();

    localeVars[locale] = localeVar;
    localesSrc += 'export const ' + localeVar + '=' + JSON.stringify(locale) + ';\n';
  }

  for (const messageKey of messageKeys) {
    const messageNodes: MessageNode[] = [];
    const argumentNames = new Set<string>();

    let sourceCode =
      'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
      'import{' +
      Object.values(localeVars).join(',') +
      '}from"./locales.js";\n';

    const messageLocales: string[] = [];

    for (const locale of locales) {
      let text = messages[locale][messageKey];

      if (text === undefined) {
        continue;
      }

      messageLocales.push(locale);

      if (preprocessors !== undefined) {
        for (const preprocessor of preprocessors) {
          text = await preprocessor(text, locale, messageKey);
        }
      }

      try {
        let messageNode = parser.parse(locale, text);

        if (postprocessors !== undefined) {
          for (const postprocessor of postprocessors) {
            messageNode = await postprocessor(messageNode, messageKey);
          }
        }

        collectArgumentNames(messageNode, argumentNames);

        messageNodes.push(messageNode);
      } catch (error) {
        throw new Error('Cannot compile "' + messageKey + '" message for locale "' + locale + '"', { cause: error });
      }
    }

    sourceCode += '\nexport default function (locale){\nreturn ';

    for (const messageNode of messageNodes) {
      const localeVar = localeVars[messageNode.locale];

      sourceCode += 'locale===' + localeVar + '?' + compileMessageNode(localeVar, messageNode) + ':';
    }

    sourceCode += 'null;\n}\n';

    const functionName = renameMessageFunction(messageKey);

    const hashCode = await sha256(sourceCode);

    const fileName = '_' + hashCode.substring(0, 16) + '.js';

    files[fileName] = sourceCode;

    indexSrc += 'export{default as ' + functionName + '}from"./' + fileName + '";\n';

    const jsDoc =
      '\n/**' +
      '\n * **Message key**&emsp;`' +
      messageKey +
      '`' +
      '\n * ' +
      '\n * ' +
      messageLocales
        .map(locale => '**' + locale + '**\n' + formatMessagePreview(messages[locale][messageKey]))
        .join('\n\n')
        .replace(/\n/g, '\n * ') +
      '\n */';

    typingsSrc +=
      jsDoc +
      '\nexport declare function ' +
      functionName +
      '(locale:string):' +
      compileMessageType(argumentNames) +
      ';\n';
  }

  files['locales.js'] = localesSrc;
  files['index.js'] = indexSrc;
  files['index.d.ts'] = typingsSrc;

  return files;
}

async function sha256(str: string): Promise<string> {
  let hashCode = '';

  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)));

  for (let i = 0; i < bytes.length; ++i) {
    hashCode += bytes[i].toString(16).padStart(2, '0');
  }

  return hashCode;
}

function compileMessageType(argumentNames: Set<string>): string {
  if (argumentNames.size === 0) {
    return 'MessageNode|null';
  }

  let str = '';
  let argumentIndex = 0;

  for (const argumentName of argumentNames) {
    str += (argumentIndex++ === 0 ? '' : ',') + JSON.stringify(argumentName) + ':unknown';
  }

  return 'MessageNode<{' + str + '}>|null';
}

export function compileMessageNode(localeVar: string, messageNode: MessageNode): string {
  return 'M(' + localeVar + ',' + compileChildrenSpread(messageNode.children) + ')';
}

function compileChildrenSpread(children: Child[] | string): string {
  return typeof children === 'string' ? compileChild(children) : children.map(compileChild).join(',');
}

function compileChildrenArray(children: Child[] | string): string {
  return typeof children === 'string' ? compileChild(children) : '[' + children.map(compileChild).join(',') + ']';
}

function compileChild(child: Child): string {
  if (typeof child === 'string') {
    return JSON.stringify(child);
  }

  if (child.nodeType === 'element') {
    let str = 'E(' + JSON.stringify(child.tagName);

    if (child.attributes !== null) {
      str += ',{';

      let keyIndex = 0;

      for (const key in child.attributes) {
        str += (keyIndex++ === 0 ? '' : ',') + JSON.stringify(key) + ':' + compileChildrenArray(child.attributes[key]);
      }

      str += '}';
    }

    if (child.children !== null) {
      str += (child.attributes !== null ? ',' : ',null,') + compileChildrenSpread(child.children);
    }

    return str + ')';
  }

  if (child.nodeType === 'argument') {
    let str = 'A(' + JSON.stringify(child.name);

    if (child.type !== undefined) {
      str += ',' + JSON.stringify(child.type);
    }

    if (child.style !== undefined) {
      str += ',' + JSON.stringify(child.style);
    }

    return str + ')';
  }

  if (child.nodeType === 'select') {
    let str = 'S(' + JSON.stringify(child.argumentName) + ',' + JSON.stringify(child.type) + ',{';

    let keyIndex = 0;

    for (const key in child.categories) {
      str += (keyIndex++ === 0 ? '' : ',') + JSON.stringify(key) + ':' + compileChildrenArray(child.categories[key]);
    }

    return str + '})';
  }

  throw new Error('Unknown node type');
}

export function formatMessagePreview(text: string, lineLength = 80): string {
  const lines = [];

  let lineStart = 0;
  let lineEnd = 0;

  for (let i = 0; i < text.length; ++i) {
    const charCode = text.charCodeAt(i);

    // Line separator
    if (charCode === /* \n */ 10 || charCode === /* \r */ 13) {
      lines.push(text.substring(lineStart, lineEnd));
      lineEnd = i + 1;
      continue;
    }

    // Word separator
    if (charCode == /* \s */ 32 || charCode === /* \t */ 9) {
      // Word fits in a line
      if (i - lineStart < lineLength) {
        lineEnd = i;
        continue;
      }

      lines.push(text.substring(lineStart, lineEnd));
      lineEnd = i + 1;
    }
  }

  if (lineStart !== lineEnd) {
    lines.push(text.substring(lineStart, lineEnd));
  }

  return '```\n' + lines.join('\n').replace(/`/g, '\\&$') + '\n```';
}
