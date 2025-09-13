import { Child, MessageNode } from '../ast.js';
import {
  htmlTokenizerOptions,
  DecodingOptions,
  parseMessage,
  ParserOptions,
  resolveTokenizerOptions,
  TokenizerOptions,
} from '../parser/index.js';
import { collectArgumentNames, escapeIdentifier } from './utils.js';

/**
 * Options of {@link compileModule}.
 */
export interface ModuleOptions extends DecodingOptions {
  /**
   * Explicit message tokenization options or "html" to use {@link htmlTokenizerOptions HTML tokenization options}.
   *
   * @default "html"
   */
  tokenizerOptions?: TokenizerOptions | 'html';

  /**
   * The output language of a compiled module.
   *
   * @default "typescript"
   */
  language?: 'typescript' | 'javascript';

  /**
   * Returns the name of a message function for the given message key.
   */
  renameMessageFunction?: (messageKey: string) => string;
}

/**
 * Compiles MFML AST as a TypeScript source.
 *
 * @example
 * compileModule({
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
 * @param messages Messages arranged by a locale.
 * @param options Compilation options.
 * @returns The source of a module that exports message functions.
 */
export function compileModule(
  messages: { [locale: string]: { [messageKey: string]: string } },
  options: ModuleOptions = {}
): string {
  const { tokenizerOptions = 'html', language = 'typescript', renameMessageFunction = escapeIdentifier } = options;

  const parserOptions: ParserOptions = {
    ...options,
    tokenizerOptions:
      tokenizerOptions === 'html' ? htmlBinaryTokenizerOptions : resolveTokenizerOptions(tokenizerOptions),
  };

  let str = 'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S';

  if (language === 'typescript') {
    str += ',type MessageNode';
  }

  str += '}from"mfml";\n';

  const locales = Object.keys(messages);

  const messageKeys = new Set(
    locales.reduce<string[]>((keys, locale) => keys.concat(Object.keys(messages[locale])), [])
  );

  for (const messageKey of messageKeys) {
    const messageNodes: MessageNode[] = [];
    const argumentNames = new Set<string>();

    for (const locale of locales) {
      const text = messages[locale][messageKey];

      if (text !== undefined) {
        const messageNode = parseMessage(locale, text, parserOptions);

        if (language === 'typescript') {
          collectArgumentNames(messageNode, argumentNames);
        }

        messageNodes.push(messageNode);
      }
    }

    str +=
      '\nexport function ' +
      renameMessageFunction(messageKey) +
      (language === 'typescript'
        ? '(locale:string):MessageNode<' + compileArgumentsType(argumentNames) + '>|null'
        : '(locale)') +
      '{\nreturn ';

    for (const messageNode of messageNodes) {
      str += 'locale===' + JSON.stringify(messageNode.locale) + '?' + compileMessageNode(messageNode) + ':';
    }

    str += 'null\n}\n';
  }

  return str;
}

const htmlBinaryTokenizerOptions = resolveTokenizerOptions(htmlTokenizerOptions);

function compileArgumentsType(argumentNames: Set<string>): string {
  if (argumentNames.size === 0) {
    return 'void';
  }

  let str = '{';
  let argumentIndex = 0;

  for (const argumentName of argumentNames) {
    str += (argumentIndex++ === 0 ? '' : ',') + JSON.stringify(argumentName) + ':unknown';
  }

  return str + '}';
}

export function compileMessageNode(messageNode: MessageNode): string {
  return 'M(' + JSON.stringify(messageNode.locale) + ',' + compileChildrenArguments(messageNode.children) + ')';
}

function compileChildrenArguments(children: Child[] | string): string {
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
      str += (child.attributes !== null ? ',' : ',null,') + compileChildrenArguments(child.children);
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
