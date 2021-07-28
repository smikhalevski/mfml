import {createMfmlParser} from '../../main/parser/createMfmlParser';
import {compileModule, IModuleCompilerOptions} from '../../main/compiler/compileModule';
import {IMessageModule} from '../../main/compiler/compiler-types';

describe('c', () => {

  const parse = createMfmlParser();

  let options: IModuleCompilerOptions;

  beforeEach(() => {
    options = {};
  });

  test('compiles an empty module', () => {
    expect(compileModule({messages: {}}, parse, options)).toBe(
        'import{IRuntime}from"mfml/lib/runtime";',
    );
  });

  test('compiles a module with multiple messages that share same locales', () => {
    const messageModule: IMessageModule = {
      messages: {
        sayHello: {
          translations: {
            en: 'Hello!',
            es: 'Hola!',
          },
        },
        sayBye: {
          translations: {
            en: 'Bye!',
            es: 'Adiós!',
          },
        },
      },
    };

    expect(compileModule(messageModule, parse, options)).toBe(
        'import{IRuntime}from"mfml/lib/runtime";' +
        'const b=["en","es"];' +

        'let sayHello=<T>(locale:string,runtime:IRuntime<T>):T|string=>{' +
        'const{l}=runtime;' +
        'return l(locale,b)===1?"Hola!":"Hello!"' +
        '}' +

        'let sayBye=<T>(locale:string,runtime:IRuntime<T>):T|string=>{' +
        'const{l}=runtime;' +
        'return l(locale,b)===1?"Adiós!":"Bye!"' +
        '}' +

        'export{sayHello,sayBye};',
    );
  });

  test('compiles a module with multiple messages that use different locales', () => {
    const messageModule: IMessageModule = {
      messages: {
        sayHello: {
          translations: {
            en: 'Hello!',
            ru: 'Привет!',
          },
        },
        sayBye: {
          translations: {
            en: 'Bye!',
            es: 'Adiós!',
          },
        },
      },
    };

    expect(compileModule(messageModule, parse, options)).toBe(
        'import{IRuntime}from"mfml/lib/runtime";' +
        'const b=["en","ru"];' +
        'const d=["en","es"];' +

        'let sayHello=<T>(locale:string,runtime:IRuntime<T>):T|string=>{' +
        'const{l}=runtime;' +
        'return l(locale,b)===1?"Привет!":"Hello!"' +
        '}' +

        'let sayBye=<T>(locale:string,runtime:IRuntime<T>):T|string=>{' +
        'const{l}=runtime;' +
        'return l(locale,d)===1?"Adiós!":"Bye!"' +
        '}' +

        'export{sayHello,sayBye};',
    );
  });

  test('function names are excluded from locales var names', () => {
    const messageModule: IMessageModule = {
      messages: {
        a: {
          translations: {
            en: '{foo}',
            es: '{foo}',
          },
        },
      },
    };

    expect(compileModule(messageModule, parse, options)).toBe(
        'import{IRuntime}from"mfml/lib/runtime";' +
        'const b=["en","es"];' +

        'export interface A{' +
        'foo:unknown;' +
        '}' +

        'let a=<T>(locale:string,runtime:IRuntime<T>,args:A):T|string=>{' +
        'const{a,l}=runtime;' +
        'const{foo:d}=args;' +
        'return l(locale,b)===1?a(d):a(d)' +
        '}' +

        'export{a};',
    );
  });

  test('renders metadata', () => {
    const messageModule: IMessageModule = {
      messages: {
        ___a: {
          translations: {
            en: '{foo}',
          },
        },
      },
    };

    options.renderMetadata = (messageName, message, metadata) => {
      return metadata.functionName + '.displayName=' + JSON.stringify(messageName) + ';';
    };

    expect(compileModule(messageModule, parse, options)).toBe(
        'import{IRuntime}from"mfml/lib/runtime";' +

        'export interface A{' +
        'foo:unknown;' +
        '}' +

        'let a=<T>(locale:string,runtime:IRuntime<T>,args:A):T|string=>{' +
        'const{a}=runtime;' +
        'const{foo:b}=args;' +
        'return a(b)' +
        '}' +

        'a.displayName="___a";' +

        'export{a};',
    );
  });

});
