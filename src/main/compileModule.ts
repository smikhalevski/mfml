import {compileCallback} from './compileCallback';
import {parseToAst} from './parseToAst';
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

  let source = 'import {IRuntime} from "@smikhalevski/typed-i18n/lib/runtime";';

  for (const key in translations) {
    source += compileCallback(parseToAst(translations[key]), {
      interfaceName: renameInterface(key),
      functionName: renameFunction(key),
      renameArgument,
    });
  }

  return source;
}
