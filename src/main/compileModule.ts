import {compileCallback} from './compileCallback';
import {parseIcuTagSoup} from './parseAst';
import {ICompileAstOptions} from './compileAst';

export interface ICompileModuleOptions extends ICompileAstOptions {
  renameFunction: (translationKey: string) => string;
  renameInterface: (translationKey: string) => string;
  translations: { [translationKey: string]: string };
}

export function compileModule(options: ICompileModuleOptions): string {
  const {
    renameFunction,
    renameInterface,
    renameArgument,
    translations,
  } = options;

  let source = 'import {IRuntime} from "@smikhalevski/icuc/lib/runtime";';

  for (const key in translations) {
    source += compileCallback(parseIcuTagSoup(translations[key]), {
      interfaceName: renameInterface(key),
      functionName: renameFunction(key),
      renameArgument,
    });
  }

  return source;
}
