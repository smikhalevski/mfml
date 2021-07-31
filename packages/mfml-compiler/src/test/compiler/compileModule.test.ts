import {createMfmlParser} from '../../main/parser/createMfmlParser';
import {compileModule, IModuleCompilerOptions} from '../../main/compiler/compileModule';
import {IMessageModule} from '../../main/compiler/compiler-types';

describe('compileModule', () => {

  const parse = createMfmlParser();

  let options: IModuleCompilerOptions;

  beforeEach(() => {
    options = {};
  });

  test('compiles an empty module', () => {
    expect(compileModule({messages: {}}, parse, options)).toBe(
        'import{MessageFunction}from"mfml-runtime";',
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
        'import{MessageFunction}from"mfml-runtime";' +
        'const b=["en","es"];' +

        'let sayHello:MessageFunction=(runtime,locale)=>{' +
        'const{l}=runtime;' +
        'return l(locale,b)===1?"Hola!":"Hello!"' +
        '};' +

        'let sayBye:MessageFunction=(runtime,locale)=>{' +
        'const{l}=runtime;' +
        'return l(locale,b)===1?"Adiós!":"Bye!"' +
        '};' +

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
        'import{MessageFunction}from"mfml-runtime";' +
        'const b=["en","ru"];' +
        'const d=["en","es"];' +

        'let sayHello:MessageFunction=(runtime,locale)=>{' +
        'const{l}=runtime;' +
        'return l(locale,b)===1?"Привет!":"Hello!"' +
        '};' +

        'let sayBye:MessageFunction=(runtime,locale)=>{' +
        'const{l}=runtime;' +
        'return l(locale,d)===1?"Adiós!":"Bye!"' +
        '};' +

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
        'import{MessageFunction}from"mfml-runtime";' +
        'const b=["en","es"];' +

        'export interface A{' +
        'foo:unknown;' +
        '}' +

        'let a:MessageFunction<A>=(runtime,locale,values)=>{' +
        'const{a,l}=runtime;' +
        'const{foo:d}=values;' +
        'return l(locale,b)===1?a(d):a(d)' +
        '};' +

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

    options.renderMetadata = (metadata, messageName, message) => {
      return metadata.functionName + '.displayName=' + JSON.stringify(messageName) + ';';
    };

    expect(compileModule(messageModule, parse, options)).toBe(
        'import{MessageFunction}from"mfml-runtime";' +

        'export interface A{' +
        'foo:unknown;' +
        '}' +

        'let a:MessageFunction<A>=(runtime,locale,values)=>{' +
        'const{a}=runtime;' +
        'const{foo:b}=values;' +
        'return a(b)' +
        '};' +

        'a.displayName="___a";' +

        'export{a};',
    );
  });

  test('rewrites translations', () => {
    const messageModule: IMessageModule = {
      messages: {
        ___a: {
          translations: {
            en: 'aaa',
          },
        },
      },
    };

    options.rewriteTranslation = (translation) => translation.toUpperCase();

    expect(compileModule(messageModule, parse, options)).toBe(
        'import{MessageFunction}from"mfml-runtime";' +
        'let a:MessageFunction=(runtime,locale)=>{' +
        'return "AAA"' +
        '};' +
        'export{a};',
    );
  });

});
