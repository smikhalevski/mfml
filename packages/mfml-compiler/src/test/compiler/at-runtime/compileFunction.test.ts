import {compileFunctionBody} from '../../../main/compiler/at-runtime/compileFunctionBody';
import {createMfmlParser} from '../../../main/parser/createMfmlParser';
import {compileFunction, IFunctionCompilerOptions} from '../../../main/compiler/at-runtime/compileFunction';
import {createStringRuntime} from 'mfml-runtime';

describe('compileFunctionBody', () => {

  const runtime = createStringRuntime();
  const parse = createMfmlParser();

  let options: IFunctionCompilerOptions;

  beforeEach(() => {
    options = {
      defaultLocale: 'en',
      otherSelectCaseKey: 'other',
    };
  });

  test('compiles a function', () => {
    const message = compileFunction({en: 'foo', ru: 'bar'}, parse, options);

    expect(message(runtime, 'en')).toBe('foo');
    expect(message(runtime, 'ru')).toBe('bar');
  });

  test('compiles a function with arguments', () => {
    const message = compileFunction({en: 'foo {qux}', ru: 'bar'}, parse, options);

    expect(message(runtime, 'en', {qux: 'abc'})).toBe('foo abc');
    expect(message(runtime, 'ru', {})).toBe('bar');
  });
});
