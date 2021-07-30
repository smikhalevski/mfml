import {compileFunctionBody} from '../../main/compiler/compileFunctionBody';
import {createMfmlParser} from '../../main/parser/createMfmlParser';
import {compileFunction, IFunctionCompilerOptions} from '../../main/compiler/compileFunction';
import {createMessageRuntime} from 'mfml-runtime';

describe('compileFunctionBody', () => {

  const runtime = createMessageRuntime<string>({
    renderFragment: (...children) => children.join(''),
    renderElement: (tagName, attributes, ...children) => children.join(''),
    renderFunction: (name, value) => String(value),
    renderArgument: (value) => String(value),
  });

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

    expect(fn(runtime, 'en', undefined)).toBe('foo');
    expect(fn(runtime, 'ru', undefined)).toBe('bar');
  });
});
