import {isBlankNode, Node} from '../parser';
import {compileDefaultValue, compileNode, INodeCompilerOptions, TEMP_VAR_NAME} from './compileNode';
import {RuntimeMethod} from '../runtime';
import {createMap, die} from '../misc';
import {compilePropertyName, createVarNameProvider} from '@smikhalevski/codegen';

const LOCALE_VAR_NAME = 'locale';
const RUNTIME_VAR_NAME = 'runtime';
const ARGS_VAR_NAME = 'args';

const excludedVarNames = [
  LOCALE_VAR_NAME,
  RUNTIME_VAR_NAME,
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
];

export interface IMessageCompilerOptions {

  renameTag: (name: string) => string;
  renameAttribute: (name: string) => string;
  renameFunction: (name: string) => string;

  /**
   * If `true` then `plural`, `select` and `selectordinal` are allowed to render `null` if no cased matched. Otherwise
   * an empty string is rendered.
   */
  nullable: boolean;

  /**
   * Returns the type of an argument that a formatting function accepts.
   */
  getFunctionArgumentType: (name: string) => string | undefined;

  // ----------------------

  renameArgument: (name: string) => string;

  interfaceName: string;

  functionName: string;

  displayName: string | undefined;

  /**
   * The list of all supported locales stored in {@link supportedLocalesVarName}.
   */
  supportedLocales: Array<string>;

  /**
   * The name of the variable that holds an array of locales supported by the message.
   */
  supportedLocalesVarName: string;

  /**
   * The default locale from {@link supportedLocales}.
   */
  defaultLocale: string;
}

export function compileMessage(nodeMap: Record<string, Node>, options: IMessageCompilerOptions): string {

  const {
    renameTag,
    renameAttribute,
    renameFunction,
    nullable,
    getFunctionArgumentType,
    renameArgument,
    interfaceName,
    functionName,
    displayName,
  } = options;

  const argVarMap: Record<string, string> = createMap();
  const argTypeMap: Record<string, string | undefined> = createMap();
  const usedMethods = new Set<RuntimeMethod>();
  const nextVarName = createVarNameProvider(excludedVarNames);

  const nodeCompilerOptions: INodeCompilerOptions = {
    renameTag,
    renameAttribute,
    renameFunction,
    nullable,
    getFunctionArgumentType,
    getArgumentVarName: (argName) => argVarMap[argName] ||= nextVarName(),
    onArgumentTypeChanged: (argName, argType) => {
      if (argTypeMap[argName] == null || argTypeMap[argName] === argType) {
        argTypeMap[argName] = argType;
      } else {
        die(`Incompatible types ${argType} and ${argTypeMap[argName]} used for argument ${argName}`);
      }
    },
    onRuntimeMethodUsed: (method) => usedMethods.add(method),
  };

  const resultSrc = compileReturnedResult(nodeMap, options, nodeCompilerOptions);

  const argNames = Object.keys(argVarMap);
  const argCount = argNames.length;
  const genericRequired = argNames.some((argName) => !argTypeMap[argName]);

  let src = '';

  if (argCount !== 0) {
    src += `export interface ${interfaceName}${genericRequired ? '<T>' : ''}{`;

    for (const argName of argNames) {
      src += compilePropertyName(renameArgument(argName)) + ':'
          + (argTypeMap[argName] || 'T')
          + ';';
    }
    src += '}';
  }

  if (!displayName) {
    src += 'export ';
  }
  src += `function ${functionName}<T>(`
      + LOCALE_VAR_NAME + ':string,'
      + RUNTIME_VAR_NAME + ':IRuntime<T>'
      + (argCount === 0 ? '' : `,${ARGS_VAR_NAME}:${interfaceName}${genericRequired ? '<T>' : ''}`)
      + `):T|string${nullable ? '|null' : ''}=>{`
      + `const ${TEMP_VAR_NAME}`;

  if (usedMethods.size !== 0) {
    src += ',{' + Array.from(usedMethods).join(',') + '}=' + RUNTIME_VAR_NAME;
  }
  if (argCount !== 0) {
    src += ',{' + Object.entries(argVarMap).map(([argName, argVar]) => renameArgument(argName) + ' as ' + argVar).join(',') + '}=' + ARGS_VAR_NAME;
  }
  src += `;return ${resultSrc}}`;

  if (displayName) {
    src += functionName + '.displayName=' + JSON.stringify(displayName) + ';'
        + `export{${functionName}};`;
  }
  return src;
}

function compileReturnedResult(nodeMap: Record<string, Node>, options: IMessageCompilerOptions, nodeCompilerOptions: INodeCompilerOptions): string {
  const {
    supportedLocales,
    supportedLocalesVarName,
    defaultLocale,
  } = options;

  const {
    nullable,
    onRuntimeMethodUsed,
  } = nodeCompilerOptions;

  const defaultValueSrc = compileDefaultValue(nullable);

  if (Object.values(nodeMap).every(isBlankNode)) {
    return defaultValueSrc;
  }

  const defaultLocaleIndex = nodeMap[defaultLocale] ? supportedLocales.indexOf(defaultLocale) : 0;

  let src = '';
  let childrenSrc = '';
  let j = 0;

  for (let i = 0; i < supportedLocales.length; i++) {
    const node = nodeMap[supportedLocales[i]];

    if (i === defaultLocaleIndex) {
      continue;
    }
    if (j !== 0) {
      childrenSrc += ':' + TEMP_VAR_NAME;
    }
    childrenSrc += `===${i}?` + (compileNode(node, nodeCompilerOptions) || defaultValueSrc);
    j++;
  }

  const defaultLocaleSrc = compileNode(nodeMap[supportedLocales[defaultLocaleIndex]], nodeCompilerOptions) || defaultValueSrc;

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
