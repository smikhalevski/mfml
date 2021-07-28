import {RuntimeMethod, runtimeMethods} from '../runtime';
import {createMap, Maybe} from '../misc';
import {compileDocComment, compilePropertyName, createVarNameProvider} from '@smikhalevski/codegen';
import {compileLocaleNodeMap, ILocaleNodeMap, ILocaleNodeMapCompilerOptions} from './compileLocaleNodeMap';

export interface IMessageMetadata {

  /**
   * The name of the TypeScript interface that describe the message arguments or `null` if message has no arguments.
   */
  interfaceName: string | null;

  /**
   * The name of the message rendering function.
   */
  functionName: string;

  /**
   * The list of argument names.
   */
  argumentNames: Array<string>;
}

export interface IMessageCompilerOptions extends Pick<ILocaleNodeMapCompilerOptions,
    | 'nullable'
    | 'otherSelectCaseKey'
    | 'indexVarName'
    | 'localeVarName'
    | 'defaultLocale'
    | 'locales'
    | 'localesVarName'> {

  /**
   * The name of the TypeScript interface that describe the message arguments.
   */
  interfaceName: string;

  /**
   * The name of the message rendering function.
   */
  functionName: string;

  /**
   * The name of the variable that holds the runtime object.
   */
  runtimeVarName: string;

  /**
   * The name of the variable that holds the arguments object.
   */
  argsVarName: string;

  /**
   * The doc comment of the rendering function.
   */
  comment: Maybe<string>;

  /**
   * Returns the TypeScript type of the argument that a function expects.
   *
   * @param functionName The name of the function.
   */
  provideFunctionType?(functionName: string): Maybe<string>;

  /**
   * Returns arbitrary source code that is rendered after message function rendering is completed.
   */
  renderMetadata?(metadata: IMessageMetadata): Maybe<string>;
}

/**
 * Compiles a message function and an interface that describes its arguments.
 *
 * @param localeNodeMap The map from locale to an AST node.
 * @param options Compilation options.
 */
export function compileMessage(localeNodeMap: ILocaleNodeMap, options: IMessageCompilerOptions): string {

  const {
    nullable,
    otherSelectCaseKey,
    provideFunctionType,
    renderMetadata,
    interfaceName,
    functionName,
    localeVarName,
    runtimeVarName,
    argsVarName,
    indexVarName,
    comment,
    localesVarName,
    locales,
    defaultLocale,
  } = options;

  const varNameProvider = createVarNameProvider([
    localeVarName,
    runtimeVarName,
    argsVarName,
    indexVarName,
    localesVarName,
  ].concat(runtimeMethods));

  const argVarNameMap = createMap<string>();
  const argTypeMap = createMap<Array<string>>();
  const usedRuntimeMethods = new Set<RuntimeMethod>();

  let indexVarUsed = false;

  const resultSrc = compileLocaleNodeMap(localeNodeMap, {
    nullable,
    localeVarName,
    indexVarName,
    defaultLocale,
    locales,
    localesVarName,
    otherSelectCaseKey,

    provideArgumentVarName(name) {
      return argVarNameMap[name] ||= varNameProvider.next();
    },

    onFunctionUsed(node) {
      const tsType = provideFunctionType?.(node.name);
      if (tsType) {
        (argTypeMap[node.argumentName] ||= []).push(isIntersectionType(tsType) ? '(' + tsType + ')' : tsType);
      }
    },

    onSelectUsed(node) {
      (argTypeMap[node.argumentName] ||= []).push('number');
    },

    onRuntimeMethodUsed(runtimeMethod, varUsed) {
      usedRuntimeMethods.add(runtimeMethod);
      indexVarUsed ||= varUsed;
    },
  });

  const usedArgNames = Object.keys(argVarNameMap);
  const unusedArgNames = Object.keys(argTypeMap).filter((name) => !usedArgNames.includes(name));

  const interfaceUsed = usedArgNames.length || unusedArgNames.length;
  const argumentNames = usedArgNames.concat(unusedArgNames);

  let src = '';

  // Interface
  if (interfaceUsed) {
    src += `export interface ${interfaceName}{`;

    for (const name of argumentNames) {
      src += compilePropertyName(name)
          + ':'
          + (argTypeMap[name]?.join('&') || 'unknown')
          + ';';
    }
    src += '}';
  }

  // Comment
  src += compileDocComment(comment);

  // Function
  src += `let ${functionName}=<T>(`
      + localeVarName + ':string,'
      + runtimeVarName + ':IRuntime<T>'
      + (interfaceUsed ? `,${argsVarName}:${interfaceName}` : '')
      + '):T|string'
      + (nullable ? '|null' : '')
      + '=>{';

  // Index var
  if (indexVarUsed) {
    src += `let ${indexVarName};`;
  }

  // Runtime method vars
  if (usedRuntimeMethods.size) {
    src += 'const{' + Array.from(usedRuntimeMethods).join(',') + '}=' + runtimeVarName + ';';
  }

  // Used argument vars
  if (usedArgNames.length) {
    src += 'const{'
        + usedArgNames.map((name) =>
            compilePropertyName(name)
            + ':'
            + argVarNameMap[name],
        ).join(',')
        + '}='
        + argsVarName
        + ';';
  }

  src += `return ${resultSrc}}`;

  // Metadata
  src += renderMetadata?.({
    interfaceName: interfaceUsed ? interfaceName : null,
    functionName,
    argumentNames,
  }) || '';

  return src;
}

function isIntersectionType(tsType: string): boolean {
  return tsType.indexOf('|') !== -1;
}
