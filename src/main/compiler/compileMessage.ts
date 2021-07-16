import {isBlankNode, Node} from '../parser';
import {compileDefaultValue, compileNode, INodeCompilerDialectOptions, INodeCompilerOptions} from './compileNode';
import {RuntimeMethod} from '../runtime';
import {createMap, jsonStringify, Maybe} from '../misc';
import {compileDocComment, compilePropertyName, createVarNameProvider} from '@smikhalevski/codegen';

export interface IMessageCompilerDialectOptions extends INodeCompilerDialectOptions {

  /**
   * The default locale from {@link supportedLocales}.
   */
  defaultLocale: string;

  /**
   * Returns the TypeScript type of the argument that a function expects.
   *
   * @param functionName The name of the function.
   */
  provideFunctionType: (functionName: string) => Maybe<string>;
}

export interface IMessageCompilerOptions extends IMessageCompilerDialectOptions {

  /**
   * The name of the TypeScript interface that describes arguments.
   */
  interfaceName: string;

  /**
   * The name of the rendering function.
   */
  functionName: string;

  /**
   * The name of the variable that holds the locale.
   */
  localeVarName: string;

  /**
   * The name of the variable that holds the runtime object.
   */
  runtimeVarName: string;

  /**
   * The name of the variable that holds the arguments object.
   */
  argsVarName: string;

  /**
   * The name of the variable that holds temporary index result returned by runtime methods.
   */
  indexVarName: string;

  /**
   * The doc comment of the rendering function.
   */
  comment: Maybe<string>;

  /**
   * The list of all supported locales stored in {@link supportedLocalesVarName}.
   */
  supportedLocales: Array<string>;

  /**
   * The name of the variable that holds an array of locales supported by the message.
   */
  supportedLocalesVarName: string;
}

/**
 * The mapping from a locale to an AST node.
 */
export interface ITranslationMap {
  [locale: string]: Node;
}

/**
 * Holds all information about the message.
 */
export interface IMessage {
  translationMap: ITranslationMap;
  displayName?: string;
}

/**
 * Compiles a message function and an interface that describes its arguments.
 *
 * @param message The mapping from locale to a parsed AST node.
 * @param options Compilation options.
 */
export function compileMessage(message: IMessage, options: IMessageCompilerOptions): string {

  const {
    nullable,
    otherSelectCaseKey,
    provideFunctionType,
    interfaceName,
    functionName,
    localeVarName,
    runtimeVarName,
    argsVarName,
    indexVarName,
    comment,
    supportedLocalesVarName,
  } = options;

  const nextVarName = createVarNameProvider([
    localeVarName,
    runtimeVarName,
    argsVarName,
    indexVarName,
    supportedLocalesVarName,
    RuntimeMethod.LOCALE,
    RuntimeMethod.FRAGMENT,
    RuntimeMethod.ARGUMENT,
    RuntimeMethod.ELEMENT,
    RuntimeMethod.SHORT_ELEMENT,
    RuntimeMethod.FUNCTION,
    RuntimeMethod.PLURAL,
    RuntimeMethod.SELECT,
    RuntimeMethod.SELECT_ORDINAL,
  ]);

  const {translationMap, displayName} = message;

  let indexVarUsed = false;

  const argVarNameMap = createMap<string>();
  const argTypeMap = createMap<Array<string>>();
  const usedRuntimeMethods = new Set<RuntimeMethod>();

  const nodeCompilerOptions: INodeCompilerOptions = {
    nullable,
    otherSelectCaseKey,
    indexVarName,
    provideArgVarName: (name) => argVarNameMap[name] ||= nextVarName(),

    onFunctionUsed(node) {
      const tsType = provideFunctionType(node.name);
      if (tsType) {
        (argTypeMap[node.argName] ||= []).push(isIntersectionType(tsType) ? '(' + tsType + ')' : tsType);
      }
    },
    onSelectUsed(node) {
      (argTypeMap[node.argName] ||= []).push('number');
    },
    onRuntimeMethodUsed(runtimeMethod, varUsed) {
      usedRuntimeMethods.add(runtimeMethod);
      indexVarUsed ||= varUsed;
    },
  };

  const resultSrc = compileTranslationMap(translationMap, options, nodeCompilerOptions);

  const argEntries = Object.entries(argVarNameMap);
  const argRequired = argEntries.length !== 0;

  let src = '';

  if (argRequired) {
    src += `export interface ${interfaceName}{`;
    for (const [argName] of argEntries) {
      src += compilePropertyName(argName) + ':' + (argTypeMap[argName]?.join('&') || 'unknown') + ';';
    }
    src += '}';
  }

  src += compileDocComment(comment);

  if (!displayName) {
    src += 'export ';
  }

  src += `function ${functionName}<T>(`
      + localeVarName + ':string,'
      + runtimeVarName + ':IRuntime<T>'
      + (argRequired ? `,${argsVarName}:${interfaceName}` : '')
      + `):T|string${nullable ? '|null' : ''}{`;

  if (indexVarUsed) {
    src += `let ${indexVarName};`;
  }

  const constSrcs: Array<string> = [];

  if (usedRuntimeMethods.size !== 0) {
    constSrcs.push('{' + Array.from(usedRuntimeMethods).join(',') + '}=' + runtimeVarName);
  }
  if (argRequired) {
    constSrcs.push('{' + argEntries.map(([argName, argVar]) => compilePropertyName(argName) + ':' + argVar).join(',') + '}=' + argsVarName);
  }
  if (constSrcs.length !== 0) {
    src += `const ${constSrcs.join(',')};`;
  }

  src += `return ${resultSrc}}`;

  if (displayName) {
    src += functionName + '.displayName=' + jsonStringify(displayName) + ';'
        + `export{${functionName}};`;
  }

  return src;
}

function compileTranslationMap(translationMap: ITranslationMap, options: IMessageCompilerOptions, nodeCompilerOptions: INodeCompilerOptions): string {
  const {
    localeVarName,
    indexVarName,
    supportedLocales,
    defaultLocale,
    nullable,
    supportedLocalesVarName,
  } = options;

  const {onRuntimeMethodUsed} = nodeCompilerOptions;

  const defaultValueSrc = compileDefaultValue(nullable);

  if (Object.values(translationMap).every(isBlankNode)) {
    return defaultValueSrc;
  }

  let defaultLocaleIndex = translationMap[defaultLocale] ? supportedLocales.indexOf(defaultLocale) : -1;
  let src = '';
  let childrenSrc = '';
  let childrenCount = 0;

  for (let i = 0; i < supportedLocales.length; i++) {
    const node = translationMap[supportedLocales[i]];

    if (i === defaultLocaleIndex || !node) {
      continue;
    }
    if (defaultLocaleIndex === -1) {
      defaultLocaleIndex = i;
      continue;
    }
    if (childrenCount !== 0) {
      childrenSrc += ':' + indexVarName;
    }
    childrenSrc += `===${i}?` + (compileNode(node, nodeCompilerOptions) || defaultValueSrc);
    childrenCount++;
  }

  const defaultResultSrc = compileNode(translationMap[supportedLocales[defaultLocaleIndex]], nodeCompilerOptions) || defaultValueSrc;

  if (childrenCount === 0) {
    return defaultResultSrc;
  }
  if (childrenCount > 1) {
    src += `(${indexVarName}=`;
  }

  onRuntimeMethodUsed(RuntimeMethod.LOCALE, childrenCount > 1);
  src += RuntimeMethod.LOCALE + `(${localeVarName},${supportedLocalesVarName})`;

  src += childrenCount > 1 ? `,${indexVarName}${childrenSrc}:${defaultResultSrc})` : childrenSrc + ':' + defaultResultSrc;
  return src;
}

function isIntersectionType(tsType: string): boolean {
  return tsType.indexOf('|') !== -1;
}
