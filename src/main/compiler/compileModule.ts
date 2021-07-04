import {compileCallback} from './compileCallback';
import {INodeCompilerOptions} from './compileNode';

export interface ICompileModuleOptions extends INodeCompilerOptions {
  renameFunction: (translationKey: string) => string;
  renameInterface: (translationKey: string) => string;
}

export function compileModule(translations: { [translationKey: string]: string }, options: ICompileModuleOptions): string {
  const {
    renameFunction,
    renameInterface,
    renameArgument,
  } = options;

  let source = 'import {IRuntime} from "@smikhalevski/icuc/lib/runtime";';

  for (const key in translations) {
    // source += compileCallback(parseIcuTagSoup(translations[key]), {
    //   interfaceName: renameInterface(key),
    //   functionName: renameFunction(key),
    //   renameArgument,
    // });
  }

  return source;
}
