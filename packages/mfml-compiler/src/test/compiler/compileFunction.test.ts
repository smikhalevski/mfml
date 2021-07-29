import {compileFunctionBody, IFunctionBodyCompilerOptions} from '../../main/compiler/compileFunctionBody';
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

  test('compiles a function body', () => {
    const fn = compileFunction({en: 'foo', ru: 'bar'}, parse, options);

    expect(fn(stringRuntime, 'en', undefined)).toBe('foo');
    expect(fn(stringRuntime, 'ru', undefined)).toBe('bar');
  });
});
