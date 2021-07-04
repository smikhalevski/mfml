import {Node} from '../parser';
import {compileNode, INodeCompilerOptions, trimComma} from './compileNode';
import {RuntimeMethod} from '../runtime';

export interface ICallbackCompilerOptions extends INodeCompilerOptions {
  functionName: string;
  interfaceName: string;
}

export function compileCallback(nodesByLocale: Record<string, Node>, options: ICallbackCompilerOptions): string {

  const {
    argsVarName = 'args',
    localeVarName = 'locale',
    functionName,
    interfaceName,
  } = options;

  const argMap: Record<string, string | undefined> = Object.create(null);
  const usedMethods = new Set<RuntimeMethod>();

  let returnedSource = '';

  const locales = Object.keys(nodesByLocale);

  if (locales.length === 0) {
    returnedSource = JSON.stringify('');
  }
  if (locales.length === 1) {
    returnedSource = compileNode(nodesByLocale[locales[0]], argMap, usedMethods, options);
  }
  if (locales.length > 1) {
    usedMethods.add(RuntimeMethod.LOCALE);
    returnedSource = RuntimeMethod.LOCALE + '({';

    for (let i = 0; i < locales.length; i++) {
      returnedSource += locales[i] + ':' + compileNode(nodesByLocale[locales[i]], argMap, usedMethods, options);
    }
    returnedSource = trimComma(returnedSource) + '})';
  }

  let argsRequired = false;
  let genericRequired = false;
  let source = '';

  for (const key in argMap) {
    argsRequired = true;

    const type = argMap[key];
    genericRequired ||= type === undefined;
    source += key + ':' + (type === undefined ? 'T' : type) + ';';
  }

  if (argsRequired) {
    source = `export interface ${interfaceName}${genericRequired ? '<T>' : ''}{${source}}`;
  }

  source += `export function ${functionName}${genericRequired ? '<T>' : ''}(`;

  source += `runtime:IRuntime<${genericRequired ? 'T' : 'any'}>,${localeVarName}:string`;

  if (argsRequired) {
    source += `,${argsVarName}:${interfaceName}`;
  }

  source += `):${genericRequired || usedMethods.has(RuntimeMethod.ELEMENT) || usedMethods.has(RuntimeMethod.FRAGMENT) || usedMethods.has(RuntimeMethod.FUNCTION) ? 'T' : 'string'}{`;

  if (usedMethods.size) {
    source += `const {${Array.from(usedMethods).join(',')}}=runtime;`;
  }

  source += `return ${returnedSource}}`;

  return source;
}
