import {createMfmlParser} from '../../main/parser/createMfmlParser';
import {compileModule, IModuleCompilerOptions} from '../../main/compiler/compileModule';
import {camelCase, pascalCase} from '@smikhalevski/codegen';

describe('c', () => {

  const parse = createMfmlParser();

  let options: IModuleCompilerOptions;

  beforeEach(() => {
    options = {
      defaultLocale: 'en',
      nullable: false,
      otherSelectCaseKey: 'other',
      renameInterface: (messageKey) => 'I' + pascalCase(messageKey),
      renameFunction: (messageKey) => camelCase(messageKey),
      extractComment: () => null,
      provideFunctionType: () => undefined,
    };
  });

  test('compiles a module with multiple messages that share same locales', () => {
    expect(compileModule({
      sayHello: {
        translationMap: {
          en: parse('Hello!'),
          es: parse('Hola!'),
        },
        displayName: 'say_hello',
      },
      sayBye: {
        translationMap: {
          en: parse('Bye!'),
          es: parse('Adiós!'),
        },
      },
    }, options)).toBe(
        'import {IRuntime} from "mfml/lib/runtime";' +

        'const b=["en","es"];' +

        'function sayHello<T>(locale:string,runtime:IRuntime<T>):T|string{' +
        'const {l}=runtime;' +
        'return l(locale,b)===1?"Hola!":"Hello!"' +
        '}' +
        'sayHello.displayName="say_hello";' +
        'export{sayHello};' +

        'export function sayBye<T>(locale:string,runtime:IRuntime<T>):T|string{' +
        'const {l}=runtime;' +
        'return l(locale,b)===1?"Adiós!":"Bye!"' +
        '}',
    );
  });

  test('compiles a module with multiple messages that use different locales', () => {
    expect(compileModule({
      sayHello: {
        translationMap: {
          en: parse('Hello!'),
          ru: parse('Привет!'),
        },
      },
      sayBye: {
        translationMap: {
          es: parse('Adiós!'),
          pt: parse('Tchau!'),
        },
      },
    }, options)).toBe(
        'import {IRuntime} from "mfml/lib/runtime";' +

        'const b=["en","ru"],d=["es","pt"];' +

        'export function sayHello<T>(locale:string,runtime:IRuntime<T>):T|string{' +
        'const {l}=runtime;' +
        'return l(locale,b)===1?"Привет!":"Hello!"' +
        '}' +

        'export function sayBye<T>(locale:string,runtime:IRuntime<T>):T|string{' +
        'const {l}=runtime;' +
        'return l(locale,d)===1?"Tchau!":"Adiós!"' +
        '}',
    );
  });

});
