import {Node} from '../parser';
import {compileNode, INodeCompilerOptions, IRenameOptions} from './compileNode';
import {RuntimeMethod} from '../runtime';
import {die} from '../misc';

export interface IMessageCompilerOptions extends IRenameOptions {
  functionName: string;
  interfaceName: string;
  defaultLocale: string;
}

export function compileMessage(nodeMap: Record<string, Node>, options: IMessageCompilerOptions): string {

  const {
    functionName,
    interfaceName,
  } = options;


  let src = '';

  const argumentTypes: Record<string, string | undefined> = Object.create(null);
  const usedMethods = new Set<RuntimeMethod>();

  const nodeOptions: INodeCompilerOptions = {
    ...options,
    resolveArgumentVarName() {
      return 'a';
    },
    onArgumentTypeChanged(argName, argType) {
      argumentTypes[argName] = argumentTypes[argName] === undefined || argumentTypes[argName] === argType ? argType : die(0);
    },
    onRuntimeMethodUsed(method) {
      usedMethods.add(method);
    },
  };

  for (const locale of Object.keys(nodeMap)) {
    compileNode(nodeMap[locale], nodeOptions);
  }

  return src;
}
