import {compileFunctionBody} from '../../main/compiler/compileFunctionBody';
import {createMfmlParser} from '../../main/parser/createMfmlParser';
import {compileFunction, IFunctionCompilerOptions} from '../../main/compiler/compileFunction';
import {stringRuntime} from 'mfml-runtime';

describe('compileFunctionBody', () => {

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

    expect(message(stringRuntime, 'en')).toBe('foo');
    expect(message(stringRuntime, 'ru')).toBe('bar');
  });

  test('compiles a function with arguments', () => {
    const message = compileFunction({en: 'foo {qux}', ru: 'bar'}, parse, options);

    expect(message(stringRuntime, 'en', {qux: 'abc'})).toBe('foo abc');
    expect(message(stringRuntime, 'ru', {})).toBe('bar');
  });
});
