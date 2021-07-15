import {isBlankNode, Node} from '../parser';
import {
  compileDefaultValue,
  compileNode,
  INodeCompilerOptions,
  INodeCompilerPublicOptions,
  TEMP_VAR_NAME,
} from './compileNode';
import {RuntimeMethod} from '../runtime';
import {createMap, die, jsonStringify} from '../misc';
import {compilePropertyName, createVarNameProvider} from '@smikhalevski/codegen';

const RUNTIME_VAR_NAME = 'runtime';
const LOCALE_VAR_NAME = 'locale';
const ARGS_VAR_NAME = 'args';

export {RUNTIME_VAR_NAME, LOCALE_VAR_NAME, ARGS_VAR_NAME};

export interface IMessageCompilerPublicOptions extends INodeCompilerPublicOptions {
  renameArgument: (name: string) => string;

  /**
   * The default locale from {@link supportedLocales}.
   */
  defaultLocale: string;
}

export interface IMessageCompilerOptions extends IMessageCompilerPublicOptions {

  /**
   * The name of the TypeScript interface that describes arguments.
   */
  interfaceName: string;

  /**
   * The name of the rendering function.
   */
  functionName: string;

  /**
   * The display name that must be assigned to the rendering function.
   */
  displayName: string | undefined;

  /**
   * The list of all supported locales stored in {@link supportedLocalesVarName}.
   */
  supportedLocales: Array<string>;

  /**
   * The name of the variable that holds an array of locales supported by the message.
   */
  supportedLocalesVarName: string;
}

export interface IMessage {
  [locale: string]: Node;
}

/**
 * Compiles a message function and an interface that describes arguments.
 *
 * @param message The mapping from locale to a parsed AST node.
 * @param options Compilation options.
 */
export function compileMessage(message: IMessage, options: IMessageCompilerOptions): string {

  const {
    renameTag,
    renameAttribute,
    renameFunction,
    nullable,
    getFunctionArgumentType,
    otherSelectCaseKey,
    renameArgument,
    interfaceName,
    functionName,
    displayName,
    supportedLocalesVarName,
  } = options;

  const argVarMap = createMap<string>();
  const argTypeMap = createMap<string | undefined>();
  const usedMethods = new Set<RuntimeMethod>();
  const nextVarName = createVarNameProvider([
    supportedLocalesVarName,
    RUNTIME_VAR_NAME,
    LOCALE_VAR_NAME,
    ARGS_VAR_NAME,
    TEMP_VAR_NAME,
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

  let tempVarUsed = false;

  const nodeCompilerOptions: INodeCompilerOptions = {
    renameTag,
    renameAttribute,
    renameFunction,
    nullable,
    getFunctionArgumentType,
    otherSelectCaseKey,
    getArgumentVarName: (argName) => argVarMap[argName] ||= nextVarName(),
    onArgumentTypeChanged(argName, argType) {
      if (argTypeMap[argName] == null || argTypeMap[argName] === argType) {
        argTypeMap[argName] = argType;
      } else {
        die(`Incompatible types ${argType} and ${argTypeMap[argName]} are used for an argument ${argName}`);
      }
    },
    onRuntimeMethodUsed: (method) => usedMethods.add(method),
    onTempVarUsed: () => tempVarUsed = true,
  };

  const resultSrc = compileResult(message, options, nodeCompilerOptions);

  const argNames = Object.keys(argVarMap);
  const argCount = argNames.length;
  const generic = argCount !== 0 && argNames.some((argName) => !argTypeMap[argName]);

  let src = '';

  if (argCount !== 0) {
    src += `export interface ${interfaceName}${generic ? '<T>' : ''}{`;

    for (const argName of argNames) {
      src += compilePropertyName(renameArgument(argName)) + ':' + (argTypeMap[argName] || 'T') + ';';
    }
    src += '}';
  }

  const varSrcs: Array<string> = [];

  if (tempVarUsed) {
    varSrcs.push(TEMP_VAR_NAME);
  }
  if (usedMethods.size !== 0) {
    varSrcs.push('{' + Array.from(usedMethods).join(',') + '}=' + RUNTIME_VAR_NAME);
  }
  if (argCount !== 0) {
    varSrcs.push('{' + Object.entries(argVarMap).map(([argName, argVar]) => renameArgument(argName) + ':' + argVar).join(',') + '}=' + ARGS_VAR_NAME);
  }

  if (!displayName) {
    src += 'export ';
  }
  src += `function ${functionName}<T>(`
      + LOCALE_VAR_NAME + ':string,'
      + RUNTIME_VAR_NAME + ':IRuntime<T>'
      + (argCount === 0 ? '' : `,${ARGS_VAR_NAME}:${interfaceName}${generic ? '<T>' : ''}`)
      + `):T|string${nullable ? '|null' : ''}{`;

  if (varSrcs.length) {
    src += `let ${varSrcs.join(',')};`;
  }
  src += `return ${resultSrc}}`;

  if (displayName) {
    src += functionName + '.displayName=' + jsonStringify(displayName) + ';'
        + `export{${functionName}};`;
  }
  return src;
}

function compileResult(message: IMessage, options: IMessageCompilerOptions, nodeCompilerOptions: INodeCompilerOptions): string {
  const {
    supportedLocales,
    defaultLocale,
    nullable,
    supportedLocalesVarName,
  } = options;

  const {onRuntimeMethodUsed} = nodeCompilerOptions;

  const defaultValueSrc = compileDefaultValue(nullable);

  if (Object.values(message).every(isBlankNode)) {
    return defaultValueSrc;
  }

  let defaultLocaleIndex = message[defaultLocale] ? supportedLocales.indexOf(defaultLocale) : -1;
  let src = '';
  let childrenSrc = '';
  let j = 0;

  for (let i = 0; i < supportedLocales.length; i++) {
    const node = message[supportedLocales[i]];

    if (i === defaultLocaleIndex || !node) {
      continue;
    }
    if (defaultLocaleIndex === -1) {
      defaultLocaleIndex = i;
      continue;
    }
    if (j !== 0) {
      childrenSrc += ':' + TEMP_VAR_NAME;
    }
    childrenSrc += `===${i}?` + (compileNode(node, nodeCompilerOptions) || defaultValueSrc);
    j++;
  }

  const defaultLocaleSrc = compileNode(message[supportedLocales[defaultLocaleIndex]], nodeCompilerOptions) || defaultValueSrc;

  if (j === 0) {
    return defaultLocaleSrc;
  }
  if (j !== 1) {
    src += `(${TEMP_VAR_NAME}=`;
  }

  onRuntimeMethodUsed(RuntimeMethod.LOCALE);
  src += RuntimeMethod.LOCALE + `(${LOCALE_VAR_NAME},${supportedLocalesVarName})`;

  src += j === 1 ? childrenSrc + ':' + defaultLocaleSrc : `,${TEMP_VAR_NAME}${childrenSrc}:${defaultLocaleSrc})`;
  return src;
}
