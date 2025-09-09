import { Child, MessageNode } from '../ast.js';
import { parseConfig, parseMessage, ParserConfig } from '../parser/index.js';
import { collectArgumentNames, escapeIdentifier } from './utils.js';

/**
 * Options of {@link compileModule}.
 */
export interface ModuleOptions extends ParserConfig {
  /**
   * Translations arranged by a locale.
   *
   * ```json
   * {
   *   "en-US": {
   *     "messageCount": "You have <b>{count, number}</b> unread messages",
   *     "messageReceived": "{gender, select, male {He} female {She} other {They}} sent you a message",
   *   },
   *   "ru-RU": {
   *     "messageCount": "У вас <b>{count, number}</b> непрочитанных сообщений",
   *     "messageReceived": "{gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение",
   *   }
   * }
   * ```
   */
  translations: { [locale: string]: { [translationKey: string]: string } };

  /**
   * Renames translation key so it can be used as a function name.
   */
  renameTranslationKey?: (translationKey: string) => string;
}

/**
 * Compiles MFML AST as a TypeScript source.
 *
 * @param options Compilation options.
 * @returns The source of a module that exports translation functions.
 */
export function compileModule(options: ModuleOptions): string {
  const { translations, renameTranslationKey = escapeIdentifier } = options;

  const parseMessageOptions = parseConfig(options);

  let str =
    'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S,type MessageNode}from"mfml/ast";\n';

  const locales = Object.keys(translations);

  const translationKeys = new Set(
    locales.reduce<string[]>((keys, locale) => keys.concat(Object.keys(translations[locale])), [])
  );

  for (const translationKey of translationKeys) {
    const messageNodes: MessageNode[] = [];
    const argumentNames = new Set<string>();

    for (const locale of locales) {
      const text = translations[locale][translationKey];

      if (text !== undefined) {
        const messageNode = parseMessage(locale, text, parseMessageOptions);
        collectArgumentNames(messageNode, argumentNames);
        messageNodes.push(messageNode);
      }
    }

    str +=
      '\nexport function ' +
      renameTranslationKey(translationKey) +
      '(locale:string):MessageNode<' +
      compileArgumentsType(argumentNames) +
      '>|null{\nreturn ';

    for (const messageNode of messageNodes) {
      str += 'locale===' + JSON.stringify(messageNode.locale) + '?' + compileMessageNode(messageNode) + ':';
    }

    str += 'null\n}\n';
  }

  return str;
}

function compileArgumentsType(argumentNames: Set<string>): string {
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

  throw new Error('Unknown type');
}
