import {createStringRuntime, MessageFunction} from '@mfml/runtime';
import {createAtRuntimeCompiler, IAtRuntimeCompilerOptions} from '../../../main/compiler/at-runtime/createAtRuntimeCompiler';

describe('createAtRuntimeCompiler', () => {

  const runtime = createStringRuntime();

  let options: IAtRuntimeCompilerOptions;
  let compile: (translations: Record<string, any>) => MessageFunction<object | void>;

  beforeEach(() => {
    options = {
      defaultLocale: 'en',
      otherSelectCaseKey: 'other',
    };
    compile = createAtRuntimeCompiler(options);
  });

  test('compiles a function', () => {
    const message = compile({en: 'foo', ru: 'bar'});

    expect(message(runtime, 'en')).toBe('foo');
    expect(message(runtime, 'ru')).toBe('bar');
  });

  test('compiles a function with arguments', () => {
    const message = compile({
      en: '{foo,date}__{bar,number}',
      ru: '{bar,date}__{foo,number}',
    });

    const values = {
      foo: 'abc',
      bar: 123123.123,
    };

    expect(message(runtime, 'en', values)).toBe('abc__123123.123');
  });
});
