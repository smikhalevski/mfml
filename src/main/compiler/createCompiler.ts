import { AnyNode, ArgumentNode, MessageNode, PackageMetadata } from '../types.js';
import { Parser } from '../parser/index.js';
import {
  escapeJSIdentifier,
  formatJSDocComment,
  formatMarkdownBold,
  formatMarkdownFence,
  toHashCode,
  truncateMessage,
} from './utils.js';
import { walkNode } from '../utils.js';

/**
 * The error thrown by a compiler if a message text cannot be processed.
 *
 * @group Compiler
 */
export class CompilerError extends Error {
  constructor(
    /**
     * The message key for which an error occurred.
     */
    readonly messageKey: string,
    /**
     * The message locale.
     */
    readonly locale: string,
    /**
     * The cause of a compilation error.
     */
    readonly cause: unknown
  ) {
    super();
  }
}

/**
 * @internal
 */
CompilerError.prototype.name = 'CompilerError';

/**
 * Params provided to the {@link Preprocessor} by the {@link Compiler}.
 *
 * @group Compiler
 */
export interface PreprocessorParams {
  /**
   * The message text.
   */
  text: string;

  /**
   * The text locale.
   */
  locale: string;

  /**
   * The message key.
   */
  messageKey: string;
}

/**
 * Params provided to the {@link Postprocessor} by the {@link Compiler}.
 *
 * @group Compiler
 */
export interface PostprocessorParams {
  /**
   * The message text.
   */
  text: string;

  /**
   * The text locale.
   */
  locale: string;

  /**
   * The message key.
   */
  messageKey: string;

  /**
   * The parsed message node.
   */
  messageNode: MessageNode;
}

/**
 * Preprocessor that is run before the message text parsing begins.
 *
 * @param params Preprocessor params.
 * @returns The transformed message text.
 * @group Compiler
 */
export type Preprocessor = (params: PreprocessorParams) => Promise<string> | string;

/**
 * Preprocessor that is run after the message text parsing.
 *
 * @param params Postprocessor params.
 * @returns The transformed message node.
 * @group Compiler
 */
export type Postprocessor = (params: PostprocessorParams) => Promise<MessageNode> | MessageNode;

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
   * The name of the package from to which compiled messages are written.
   *
   * @default "@mfml/messages"
   */
  packageName?: string;

  /**
   * Mapping from a locale to a corresponding fallback locale.
   *
   * For example, let's consider {@link fallbackLocales} set to:
   *
   * ```js
   * {
   *   'ru-RU': 'ru',
   *   'en-US': 'en',
   *   'ru': 'en'
   * }
   * ```
   *
   * In this case:
   * - if a message doesn't support `ru-RU` locale, then compiler would look for `ru` locale.
   * - if `ru` locale isn't supported as well then a compiler would fall back to `en` locale.
   * - if `en` isn't supported as well then `null` would be returned from a message function when called with `ru-RU`
   * locale.
   */
  fallbackLocales?: Record<string, string>;

  /**
   * The array of callbacks that are run before message parsing.
   *
   * Preprocessors can be used to transform Markdown messages to HTML, or other text-based transformations.
   */
  preprocessors?: Preprocessor[];

  /**
   * The array of callbacks that are run after the message was parsed as an MFML AST.
   *
   * Preprocessors can be used to validate messages, rename arguments, or for other AST-based transformations.
   */
  postprocessors?: Postprocessor[];

  /**
   * Returns the name of a message function for the given message key.
   */
  renameMessageFunction?: (messageKey: string) => string;

  /**
   * Returns the TypeScript type for a given argument.
   *
   * @example
   * argumentNode => {
   *   if (argumentNode.typeNode?.value === 'number') {
   *     return 'number|bigint';
   *   }
   *   if (argumentNode.typeNode?.value === 'date') {
   *     return 'number|Date';
   *   }
   * };
   *
   * @see {@link getIntlArgumentTSType}
   */
  getArgumentTSType?: (argumentNode: ArgumentNode) => string | undefined;

  /**
   * Number of characters in a message body hash.
   *
   * @default 8
   */
  hashLength?: number;
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
 * Compiles MFML messages to a source code.
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
    packageName = '@mfml/messages',
    fallbackLocales,
    preprocessors,
    postprocessors,
    renameMessageFunction = messageKey => messageKey,
    getArgumentTSType = getIntlArgumentTSType,
    hashLength = 8,
  } = options;

  const errors: CompilerError[] = [];

  const supportedLocales = Object.keys(messages);

  const messageKeys = new Set(supportedLocales.flatMap(locale => Object.keys(messages[locale])));

  const files: Record<string, string> = {};

  const localeVars: Record<string, string> = {};

  const functionNames = new Map<string, string>();
  const messageHashes = new Set<string>();

  let indexJSCode = '';
  let indexTSCode = 'import{MessageNode}from"mfml";\n';
  let localesJSCode = '';

  const packageMetadata: PackageMetadata = {
    packageName,
    supportedLocales,
    fallbackLocales,
    messages: {},
  };

  for (const locale of supportedLocales) {
    const localeVar = 'LOCALE_' + escapeJSIdentifier(locale).toUpperCase();

    localeVars[locale] = localeVar;
    localesJSCode += 'export const ' + localeVar + '=' + JSON.stringify(locale) + ';\n';
  }

  nextMessageKey: for (const messageKey of messageKeys) {
    // Locale group includes all locales for which the same message text is returned
    const localeGroups = [];

    // Pick locales supported by a message
    for (const locale of supportedLocales) {
      if (messages[locale][messageKey] !== undefined) {
        localeGroups.push([locale]);
      }
    }

    if (fallbackLocales !== undefined && localeGroups.length !== supportedLocales.length) {
      // Message doesn't support all locales, detect fallbacks and extend locale groups

      for (const locale of supportedLocales) {
        if (messages[locale][messageKey] !== undefined) {
          // No fallback required
          continue;
        }

        const visitedLocales = new Set<string>().add(locale);

        let fallbackLocale = locale;

        do {
          fallbackLocale = fallbackLocales[fallbackLocale];
        } while (
          fallbackLocale !== undefined &&
          supportedLocales.indexOf(fallbackLocale) !== -1 &&
          !visitedLocales.has(fallbackLocale) &&
          (visitedLocales.add(fallbackLocale), messages[fallbackLocale][messageKey] === undefined)
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
    const argumentTSTypes = new Map<string, Set<string>>();

    let messageJSCode = '';
    let docComment = formatMarkdownBold('Message key') + '\n' + formatMarkdownFence(messageKey, 'text');

    // Parse message text for each locale
    for (const localeGroup of localeGroups) {
      const baseLocale = localeGroup[0];

      let text = messages[baseLocale][messageKey];
      let messageNode;

      docComment +=
        '\n' +
        formatMarkdownBold(baseLocale) +
        (localeGroup.length === 1 ? '' : ' ← ' + localeGroup.slice(1).join(' ← ')) +
        '\n' +
        formatMarkdownFence(truncateMessage(text), 'html');

      try {
        if (preprocessors !== undefined) {
          for (const preprocessor of preprocessors) {
            text = await preprocessor({ messageKey, locale: baseLocale, text });
          }
        }

        messageNode = parser.parse(baseLocale, text);

        if (postprocessors !== undefined) {
          for (const postprocessor of postprocessors) {
            messageNode = await postprocessor({ messageKey, messageNode, locale: baseLocale, text });
          }
        }

        collectArgumentTSTypes(messageNode, getArgumentTSType, argumentTSTypes);
      } catch (error) {
        errors.push(new CompilerError(messageKey, baseLocale, error));
        continue nextMessageKey;
      }

      messageNodes.push(messageNode);
    }

    // Build a ternary that selects a message node depending on a requested locale
    for (let i = 0; i < localeGroups.length; ++i) {
      messageJSCode += localeGroups[i].map(locale => 'locale===' + localeVars[locale]).join('||');

      try {
        messageJSCode += '?' + compileNode(messageNodes[i]) + ':';
      } catch (error) {
        errors.push(new CompilerError(messageKey, localeGroups[i][0], error));
        continue nextMessageKey;
      }
    }

    // Return null from a message function for an unknown or unsupported locale
    messageJSCode += 'null;';

    let functionName;
    try {
      functionName = escapeJSIdentifier(renameMessageFunction(messageKey));
    } catch (error) {
      errors.push(new CompilerError(messageKey, localeGroups[0][0], error));
      continue;
    }

    const shadowedMessageKey = functionNames.get(functionName);

    if (shadowedMessageKey !== undefined) {
      const error = new Error(
        `The function name "${functionName}" is already used for the "${shadowedMessageKey}" message.`
      );

      errors.push(new CompilerError(messageKey, localeGroups[0][0], error));
      continue;
    }

    functionNames.set(functionName, messageKey);

    // Hash the message function body
    let messageHash = await toHashCode(packageName + messageJSCode, hashLength);

    if (messageHashes.has(messageHash)) {
      // Fallback to an existing message function
      const existingMessageHash = messageHash;

      messageHash = await toHashCode(packageName + messageJSCode + messageKey, hashLength);

      messageJSCode =
        'import fallback from"./' +
        existingMessageHash +
        '.js";\n\n' +
        formatJSDocComment(docComment) +
        '\nexport default function ' +
        functionName +
        '(locale){\nreturn fallback(locale);\n}';
    } else {
      // Add the new message function
      messageHashes.add(messageHash);

      messageJSCode =
        'import{M,E,A,V,R,O,C}from"mfml/dsl";\n' +
        'import{' +
        Object.values(localeVars).join(',') +
        '}from"./locales.js";\n\n' +
        formatJSDocComment(docComment) +
        '\nexport default function ' +
        functionName +
        '(locale){\nreturn ' +
        messageJSCode +
        '\n}';
    }

    messageJSCode += '\n' + functionName + '.h=' + JSON.stringify(messageHash) + ';\n';

    files[messageHash + '.js'] = messageJSCode;

    indexJSCode += 'export{default as ' + functionName + '}from"./' + messageHash + '.js";\n';

    indexTSCode +=
      '\n' +
      formatJSDocComment(docComment) +
      '\nexport declare function ' +
      functionName +
      '(locale:string):' +
      compileMessageTSType(argumentTSTypes) +
      ';\n';

    packageMetadata.messages[messageHash] = {
      messageKey,
      functionName,
      argumentNames: Array.from(argumentTSTypes.keys()),
      locales: localeGroups.map(localeGroup => localeGroup[0]),
    };
  }

  if (errors.length !== 0) {
    throw new AggregateError(errors);
  }

  const packageJSON = {
    name: packageName,
    type: 'module',
    main: './index.js',
    types: './index.d.ts',
    exports: {
      '.': './index.js',
      './metadata': './metadata.js',
      './package.json': './package.json',
    },
    sideEffects: false,
  };

  files['index.js'] = indexJSCode;

  files['index.d.ts'] = indexTSCode;

  files['locales.js'] = localesJSCode;

  files['metadata.js'] = 'export default ' + JSON.stringify(packageMetadata, null, 2) + ';\n';

  files['metadata.d.ts'] =
    'import{PackageMetadata}from"mfml";\n\n' +
    'declare const metadata:PackageMetadata;\n\n' +
    'export default metadata;\n';

  files['package.json'] = JSON.stringify(packageJSON, null, 2);

  return files;
}

/**
 * Returns the TypeScript type of an argument that matches the Intl format.
 *
 * | Argument type   | TypeScript type    |
 * | --------------- | ------------------ |
 * | `number`        | `number \| bigint` |
 * | `date`          | `number \| Date`   |
 * | `time`          | `number \| Date`   |
 * | `list`          | `string[]`         |
 * | `plural`        | `number`           |
 * | `selectOrdinal` | `number`           |
 * | `select`        | `'foo' \| 'bar'`   |
 *
 * @group Compiler
 */
export function getIntlArgumentTSType(argumentNode: ArgumentNode): string | undefined {
  switch (argumentNode.typeNode?.value) {
    case 'number':
      return 'number|bigint';

    case 'date':
    case 'time':
      return 'number|Date';

    case 'list':
      return 'string[]';

    case 'plural':
    case 'selectOrdinal':
      return 'number';

    case 'select':
      if (argumentNode.categoryNodes === null || argumentNode.categoryNodes.length === 0) {
        return 'string';
      }

      return argumentNode.categoryNodes
        .map(categoryNode =>
          categoryNode.name === 'other'
            ? '(string&{})'
            : JSON.stringify(categoryNode.name.startsWith('=') ? categoryNode.name.substring(1) : categoryNode.name)
        )
        .join('|');
  }
}

export function collectArgumentTSTypes(
  messageNode: MessageNode,
  getArgumentTSType: (argumentNode: ArgumentNode) => string | undefined,
  argumentTSTypes: Map<string, Set<string>>
): void {
  walkNode(messageNode, node => {
    if (node.nodeType !== 'argument') {
      return;
    }

    let tsTypes = argumentTSTypes.get(node.name);

    if (tsTypes === undefined) {
      tsTypes = new Set();
      argumentTSTypes.set(node.name, tsTypes);
    }

    const tsType = getArgumentTSType(node);

    if (tsType === undefined || tsType === null || tsType === '' || tsType === 'unknown') {
      return;
    }

    tsTypes.add(tsType);
  });
}

export function compileMessageTSType(argumentTSTypes: Map<string, Set<string>>): string {
  if (argumentTSTypes.size === 0) {
    return 'MessageNode<void>|null';
  }

  let tsCode = '';

  for (const [argumentName, tsTypes] of argumentTSTypes) {
    tsCode += JSON.stringify(argumentName) + ':';

    if (tsTypes.size === 0) {
      tsCode += 'unknown;';
      continue;
    }

    if (tsTypes.size === 1) {
      tsCode += tsTypes.values().next().value + ';';
      continue;
    }

    tsCode +=
      Array.from(tsTypes)
        .map(tsType => '(' + tsType + ')')
        .join('&') + ';';
  }

  return 'MessageNode<{' + tsCode + '}>|null';
}

export function compileNode(node: AnyNode): string {
  switch (node.nodeType) {
    case 'message':
      return 'M(locale' + compileNodes(node.childNodes) + ')';

    case 'text':
    case 'literal':
      return JSON.stringify(node.value);

    case 'element':
      return (
        'E(' + JSON.stringify(node.tagName) + compileNodes(node.attributeNodes) + compileNodes(node.childNodes) + ')'
      );

    case 'attribute':
      return 'A(' + JSON.stringify(node.name) + compileNodes(node.childNodes) + ')';

    case 'argument':
      return (
        'V(' +
        JSON.stringify(node.name) +
        compileOptionalNode(node.typeNode) +
        compileOptionalNode(node.styleNode) +
        compileNodes(node.optionNodes) +
        compileNodes(node.categoryNodes) +
        ')'
      );

    case 'octothorpe':
      return 'R()';

    case 'option':
      return 'O(' + JSON.stringify(node.name) + compileOptionalNode(node.valueNode) + ')';

    case 'category':
      return 'C(' + JSON.stringify(node.name) + compileNodes(node.childNodes) + ')';
  }
}

function compileNodes<T extends AnyNode[]>(nodes: T | null): string {
  if (nodes === null) {
    return '';
  }

  let jsCode = '';

  for (let i = 0; i < nodes.length; ++i) {
    jsCode += ',' + compileNode(nodes[i]);
  }

  return jsCode;
}

function compileOptionalNode(node: AnyNode | null): string {
  return node === null ? '' : ',' + compileNode(node);
}
