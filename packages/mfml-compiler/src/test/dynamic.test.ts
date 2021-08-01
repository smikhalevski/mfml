import {MessageFunction, stringRuntime} from 'mfml-runtime';
import {createDynamicCompiler, IDynamicCompilerOptions} from '../main/dynamic';

describe('createDynamicCompiler', () => {

  let options: IDynamicCompilerOptions;
  let compile: (translations: Record<string, any>) => MessageFunction<object | void>;

  beforeEach(() => {
    options = {
      defaultLocale: 'en',
      otherSelectCaseKey: 'other',
    };
    compile = createDynamicCompiler(options);
  });

  test('compiles a function', () => {
    const message = compile({en: 'foo', ru: 'bar'});

    expect(message(stringRuntime, 'en')).toBe('foo');
    expect(message(stringRuntime, 'ru')).toBe('bar');
  });

  test('compiles a function with arguments', () => {
    const message = compile({
      en: '{foo,date}__{bar,number}',
      ru: '{bar,date}__{foo,number}',
    });

    const values = {
      foo: 123456789,
      bar: 123123.123,
    };

    expect(message(stringRuntime, 'en', values)).toBe('1/2/1970__123,123.123');
    expect(message(stringRuntime, 'ru', values)).toBe('01.01.1970__123\u00a0456\u00a0789');
  });
});
