import {createMfmlParser, MfmlParser} from '../../main/parser/createMfmlParser';
import {compileModule, IModuleCompilerOptions} from '../../main/compiler/compileModule';
import {IMessageModule} from '../../main/compiler/compiler-types';

describe('compileModule', () => {

  let parse: MfmlParser;
  let options: IModuleCompilerOptions;

  beforeEach(() => {
    parse = createMfmlParser();
    options = {typingsEnabled: true};
  });

  test('compiles an empty module', () => {
    expect(compileModule({messages: {}}, parse, options)).toBe('');
  });

  test('compiles an empty module without typings', () => {
    options.typingsEnabled = false;
    expect(compileModule({messages: {}}, parse, options)).toBe('');
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
        'import{MessageFunction}from"mfml-runtime";'
        + 'const b="en";'
        + 'const d=[b,"es"];'
        + 'let sayHello:MessageFunction<void>=(runtime,locale)=>{'
        + 'const{l}=runtime;'
        + 'return l(locale,d)===1?"Hola!":"Hello!"'
        + '};'
        + 'let sayBye:MessageFunction<void>=(runtime,locale)=>{'
        + 'const{l}=runtime;'
        + 'return l(locale,d)===1?"Adiós!":"Bye!"'
        + '};'
        + 'export{sayHello,sayBye};',
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
        'import{MessageFunction}from"mfml-runtime";'
        + 'const b="en";'
        + 'const d=[b,"ru"];'
        + 'const g=[b,"es"];'
        + 'let sayHello:MessageFunction<void>=(runtime,locale)=>{'
        + 'const{l}=runtime;'
        + 'return l(locale,d)===1?"Привет!":"Hello!"'
        + '};'
        + 'let sayBye:MessageFunction<void>=(runtime,locale)=>{'
        + 'const{l}=runtime;'
        + 'return l(locale,g)===1?"Adiós!":"Bye!"'
        + '};'
        + 'export{sayHello,sayBye};',
    );
  });

  test('function names are excluded from locales var names', () => {
    const messageModule: IMessageModule = {
      messages: {
        b: {
          translations: {
            en: '{foo}',
            es: '{foo}',
          },
        },
      },
    };

    expect(compileModule(messageModule, parse, options)).toBe(
        'import{MessageFunction}from"mfml-runtime";'
        + 'const d="en";'
        + 'const g=[d,"es"];'
        + 'export interface BValues{foo:unknown;}'
        + 'let b:MessageFunction<BValues>=(runtime,locale,values)=>{'
        + 'const{a,l}=runtime;'
        + 'const{foo:b}=values;'
        + 'return l(locale,g)===1?a(locale,b):a(d,b)'
        + '};'
        + 'export{b};',
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
        'import{MessageFunction}from"mfml-runtime";'
        + 'const b="en";'
        + 'export interface AValues{'
        + 'foo:unknown;'
        + '}'
        + 'let a:MessageFunction<AValues>=(runtime,locale,values)=>{'
        + 'const{a}=runtime;'
        + 'const{foo:d}=values;'
        + 'return a(b,d)'
        + '};'
        + 'a.displayName="___a";'
        + 'export{a};',
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
        'import{MessageFunction}from"mfml-runtime";'
        + 'const b="en";'
        + 'let a:MessageFunction<void>=(runtime,locale)=>{'
        + 'return "AAA"'
        + '};'
        + 'export{a};',
    );
  });

  test('compiles message with a single non-default locale', () => {
    const messageModule: IMessageModule = {
      messages: {
        a: {
          translations: {
            ru: 'aaa',
          },
        },
      },
    };

    options.provideDefaultLocale = () => 'en';

    expect(compileModule(messageModule, parse, options)).toBe(
        'import{MessageFunction}from"mfml-runtime";'
        + 'const b="en";'
        + 'const d=[b,"ru"];'
        + 'let a:MessageFunction<void>=(runtime,locale)=>{'
        + 'const{l,f}=runtime;'
        + 'return l(locale,d)===1?"aaa":f()'
        + '};'
        + 'export{a};',
    );
  });

  test('captures errors during compilation', () => {
    const messageModule: IMessageModule = {
      messages: {
        a: {
          translations: {en: '{aaa}'},
        },
        b: {
          translations: {en: '{bbb}'},
        },
      },
    };

    const onErrorMock = jest.fn();

    options.onError = onErrorMock;

    parse = createMfmlParser({
      renameArgument() {
        throw new Error('wow');
      },
    });

    expect(compileModule(messageModule, parse, options)).toBe(
        'import{MessageFunction}from"mfml-runtime";' +
        'const d="en";' +
        'let a=/*ERROR*/undefined;' +
        'let b=/*ERROR*/undefined;' +
        'export{a,b};',
    );

    expect(onErrorMock).toHaveBeenCalledTimes(2);
    expect(onErrorMock).toHaveBeenNthCalledWith(1, expect.any(Error), 'a', {translations: {en: '{aaa}'}})
    expect(onErrorMock).toHaveBeenNthCalledWith(2, expect.any(Error), 'b', {translations: {en: '{bbb}'}})
  });

});
