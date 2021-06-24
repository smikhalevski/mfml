import {Node} from './ast-types';
import {compileAst, ICompileAstOptions} from './compileAst';

export interface ICompileCallbackOptions extends ICompileAstOptions {
  functionName: string;
  interfaceName: string;
}

export function compileCallback(node: Node, options: ICompileCallbackOptions): string {
  const args: Array<[string, unknown]> = [];
  let source = '';
  if (args.length) {
    source += `export interface ${options.interfaceName}<Result>{`;
    for (let i = 0; i < args.length; i++) {
      source += args[i][0] + ':Result;'
    }
    source += '}';
  }
  source += `export function ${options.functionName}<Result>(runtime:IRuntime<Result>,locale:string`;
  if (args.length) {
    source += `,args:${options.interfaceName}<Result>`;
  }
  source += '):Result{'
      + 'return ' + compileAst(node, options).slice(0, -1)
      + '}';
  return source;
}
