import { Child, MessageNode } from '../ast.js';
import { Parser } from '../parser/index.js';
import {
  collectArgumentTsTypes,
  escapeJsIdentifier,
  formatJSDocComment,
  formatMarkdownBold,
  formatMarkdownFence,
  hashCode,
  truncateMessage,
} from './utils.js';

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
   * Mapping from a locale to a corresponding fallback locale.
   *
   * For example, let's consider {@link fallbackLocales} are set to:
   *
   * ```js
   * {
   *   'ru-RU': 'ru',
   *   'en-US': 'en',
   *   'ru': 'en'
   * }
   * ```
   *
   * In this case if a message doesn't support `ru-RU` locale, then compiler would look for `ru` locale. If `ru` locale
   * isn't supported as well then compiler would fall back to `en` locale. And if `en` isn't supported as well then
   * `null` would be returned from a message function when called with `ru-RU` locale.
   */
  fallbackLocales?: Record<string, string>;

  /**
   * The array of callbacks that are run before message tokenization.
   *
   * For example, preprocessors can be used to transform Markdown messages to HTML.
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

  /**
   * Returns the TypeScript type for a given ICU argument type.
   *
   * @example
   * (argumentType, argumentName) => {
   *   if (argumentType === 'number') {
   *     return 'number|bigint';
   *   }
   *   if (argumentType === 'date') {
   *     return 'number|Date';
   *   }
   *   return 'unknown';
   * };
   *
   * @param argumentType The {@link mfml/parser!ParserOptions.renameArgumentType renamed type} of an argument, or `undefined` for
   * an argument that does not have a type.
   * @param argumentName The {@link mfml/parser!ParserOptions.renameArgument renamed argument}.
   */
  getArgumentTsType?: (argumentType: string | undefined, argumentName: string) => string | undefined;
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
   * @returns The map from a file path to file contents.
   */
  compile(messages: { [locale: string]: { [messageKey: string]: string } }): Promise<Record<string, string>>;
}

/**
 * Creates a compiler that converts MFML to a source code.
 *
 * @example
 * import * as fs from 'node:fs';
 * import { createParser, htmlTokenizer } from 'mfml/parser';
 * import { compileFiles } from 'mfml/compiler';
 *
 * const parser = createParser({ tokenizer: htmlTokenizer });
 *
 * const compiler = createCompiler({ parser });
 *
 * const files = await compiler.compile({
 *   'en-US': {
 *     messageCount: 'You have <b>{count, number}</b> unread messages',
 *     messageReceived: '{gender, select, male {He} female {She} other {They}} sent you a message',
 *   },
 *   'ru-RU': {
 *     messageCount: 'У вас <b>{count, number}</b> непрочитанных сообщений',
 *     messageReceived: '{gender, select, male {Он отправил} female {Она отправила} other {Они отправили}} вам сообщение',
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
 * @returns The map from a file path to file contents.
 */
export async function compileFiles(
  messages: { [locale: string]: { [messageKey: string]: string } },
  options: CompilerOptions
): Promise<Record<string, string>> {
  const {
    parser,
    fallbackLocales,
    preprocessors,
    postprocessors,
    renameMessageFunction = escapeJsIdentifier,
    getArgumentTsType = getArgumentNaturalTsType,
  } = options;

  const locales = Object.keys(messages);

  const messageKeys = new Set(locales.flatMap(locale => Object.keys(messages[locale])));

  const files: Record<string, string> = {};

  const localeVars: Record<string, string> = {};

  let indexJs = '';
  let indexTs = 'import{MessageNode}from"mfml";\n';
  let localesJs = '';

  for (const locale of locales) {
    const localeVar = 'LOCALE_' + escapeJsIdentifier(locale).toUpperCase();

    localeVars[locale] = localeVar;
    localesJs += 'export const ' + localeVar + '=' + JSON.stringify(locale) + ';\n';
  }

  files['locales.js'] = localesJs;

  const localesJsImport = 'import{' + Object.values(localeVars).join(',') + '}from"./locales.js";';

  // Prevents infinite loop when resolving a fallback locale, reused between messages
  const visitedFallbackLocales = new Set<string>();

  for (const messageKey of messageKeys) {
    const localeGroups = [];

    // Pick locales supported by a message
    for (const locale of locales) {
      if (messages[locale][messageKey] !== undefined) {
        localeGroups.push([locale]);
      }
    }

    if (fallbackLocales !== undefined && localeGroups.length !== locales.length) {
      // Message doesn't support all locales, detect fallbacks and extent locale groups

      for (const locale of locales) {
        if (messages[locale][messageKey] !== undefined) {
          continue;
        }

        visitedFallbackLocales.clear();

        let fallbackLocale = locale;

        do {
          fallbackLocale = fallbackLocales[fallbackLocale];
        } while (
          fallbackLocale !== undefined &&
          locales.indexOf(fallbackLocale) !== -1 &&
          !visitedFallbackLocales.has(fallbackLocale) &&
          (visitedFallbackLocales.add(fallbackLocale), messages[fallbackLocale][messageKey] === undefined)
        );

        if (fallbackLocale === undefined || fallbackLocale === locale) {
          // No fallback
          continue;
        }

        for (const localeGroup of localeGroups) {
          if (localeGroup[0] === fallbackLocale) {
            localeGroup.push(locale);
          }
        }
      }
    }

    const messageNodes: MessageNode[] = [];
    const argumentTsTypes = new Map<string, Set<string>>();

    let jsCode = 'export default function(locale){\nreturn ';
    let jsDocComment = formatMarkdownBold('Message key') + '\n' + formatMarkdownFence(messageKey, 'text');

    // Parse message text for each locale
    for (const localeGroup of localeGroups) {
      const baseLocale = localeGroup[0];

      let text = messages[baseLocale][messageKey];
      let messageNode;

      try {
        if (preprocessors !== undefined) {
          for (const preprocessor of preprocessors) {
            text = await preprocessor(text, baseLocale, messageKey);
          }
        }

        messageNode = parser.parse(baseLocale, text);

        if (postprocessors !== undefined) {
          for (const postprocessor of postprocessors) {
            messageNode = await postprocessor(messageNode, messageKey);
          }
        }

        collectArgumentTsTypes(messageNode, getArgumentTsType, argumentTsTypes);
      } catch (cause) {
        throw new Error('Cannot compile "' + messageKey + '" message for locale ' + baseLocale, { cause });
      }

      messageNodes.push(messageNode);

      jsDocComment +=
        '\n' +
        formatMarkdownBold(baseLocale) +
        (localeGroup.length === 1 ? '' : ' (Used as a fallback for ' + localeGroup.slice(1).join(', ') + ')') +
        '\n' +
        formatMarkdownFence(truncateMessage(text), 'html');
    }

    // Build a ternary that selects a message node depending on a requested locale
    for (let i = 0; i < localeGroups.length; ++i) {
      for (let j = 0; j < localeGroups[i].length; ++j) {
        jsCode += (j === 0 ? '' : '||') + 'locale===' + localeVars[localeGroups[i][j]];
      }

      try {
        jsCode += '?' + compileMessageNode('locale', messageNodes[i]) + ':';
      } catch (cause) {
        throw new Error('Cannot compile "' + messageKey + '" message for locale ' + localeGroups[i][0], { cause });
      }
    }

    // Return null from a message function for an unknown or unsupported locale
    jsCode += 'null;\n}\n';

    jsDocComment = formatJSDocComment(jsDocComment);

    jsCode =
      'import{createMessageNode as M,createElementNode as E,createArgumentNode as A,createSelectNode as S}from"mfml";\n' +
      localesJsImport +
      '\n\n' +
      jsDocComment +
      '\n' +
      jsCode;

    try {
      const fileName = await hashCode(jsCode, 16);
      const functionName = renameMessageFunction(messageKey);

      files[fileName + '.js'] = jsCode;

      indexJs += 'export{default as ' + functionName + '}from"./' + fileName + '.js";\n';

      indexTs +=
        '\n' +
        jsDocComment +
        '\nexport declare function ' +
        functionName +
        '(locale:string):' +
        compileMessageTsType(argumentTsTypes) +
        ';\n';
    } catch (cause) {
      throw new Error('Cannot compile "' + messageKey + '" message', { cause });
    }
  }

  files['index.js'] = indexJs;

  files['index.d.ts'] = indexTs;

  files['metadata.js'] =
    localesJsImport + '\n\nexport const supportedLocales=[' + Object.values(localeVars).join(',') + '];\n';

  files['metadata.d.ts'] =
    'export type SupportedLocale=' +
    locales.map(locale => JSON.stringify(locale)).join('|') +
    ';\n' +
    '\nexport declare const supportedLocales:readonly SupportedLocale[];\n';

  return files;
}

export function getArgumentNaturalTsType(argumentType: string | undefined, _argumentName: string): string | undefined {
  switch (argumentType) {
    case 'number':
      return 'number|bigint';

    case 'date':
    case 'time':
      return 'number|Date';

    case 'list':
      return 'string[]';

    case 'plural':
    case 'selectordinal':
      return 'number';

    case 'select':
      return 'number|string';

    default:
      return undefined;
  }
}

export function compileMessageTsType(argumentTsTypes: Map<string, Set<string>>): string {
  if (argumentTsTypes.size === 0) {
    return 'MessageNode|null';
  }

  let str = '';
  let argumentIndex = 0;

  for (const [argumentName, tsTypes] of argumentTsTypes) {
    str += (argumentIndex++ === 0 ? '' : ';') + JSON.stringify(argumentName) + ':';

    tsTypes.delete('unknown');

    if (tsTypes.size === 0) {
      str += 'unknown';
      continue;
    }

    if (tsTypes.size === 1) {
      str += tsTypes.values().next().value;
      continue;
    }

    let tsTypeIndex = 0;

    for (const tsType of tsTypes) {
      str += (tsTypeIndex++ === 0 ? '' : '&') + '(' + tsType + ')';
    }
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

  const nodeType = child.nodeType;

  if (nodeType === 'element') {
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

  if (nodeType === 'argument') {
    let str = 'A(' + JSON.stringify(child.name);

    if (child.type !== undefined) {
      str += ',' + JSON.stringify(child.type);
    }

    if (child.style !== undefined) {
      str += ',' + JSON.stringify(child.style);
    }

    return str + ')';
  }

  if (nodeType === 'select') {
    let str = 'S(' + JSON.stringify(child.argumentName) + ',' + JSON.stringify(child.type) + ',{';

    let keyIndex = 0;

    for (const key in child.categories) {
      str += (keyIndex++ === 0 ? '' : ',') + JSON.stringify(key) + ':' + compileChildrenArray(child.categories[key]);
    }

    return str + '})';
  }

  throw new Error('Unknown AST node type: ' + nodeType);
}
