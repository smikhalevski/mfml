import {compileFunctionBody, IFunctionBodyCompilerOptions} from '../../main/compiler/compileFunctionBody';
import {createMfmlParser} from '../../main/parser/createMfmlParser';

describe('compileFunctionBody', () => {

  const parse = createMfmlParser();

  let options: IFunctionBodyCompilerOptions;

  beforeEach(() => {
    options = {
      defaultLocale: 'en',
      argsVarName: 'values',
      runtimeVarName: 'runtime',
      indexVarName: 'i',
      localesVarName: 'locales',
      localeVarName: 'locale',
      otherSelectCaseKey: 'other',
    };
  });

  test('compiles a function body', () => {
    expect(compileFunctionBody({en: parse('foo'), ru: parse('bar')}, options)).toBe(
        'var i,' +
        'l=runtime.l,' +
        'f=runtime.f,' +
        'a=runtime.a,' +
        'e=runtime.e,' +
        'c=runtime.c,' +
        'p=runtime.p,' +
        's=runtime.s,' +
        'o=runtime.o,' +
        'locales=["en","ru"];' +
        'return l(locale,locales)===1?"bar":"foo"',
    );
  });
});
