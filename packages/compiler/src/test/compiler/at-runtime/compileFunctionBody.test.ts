import {compileFunctionBody, IFunctionBodyCompilerOptions} from '../../../main/compiler/at-runtime/compileFunctionBody';
import {createMfmlParser} from '../../../main/parser/createMfmlParser';

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
        'e=runtime.e,' +
        'f=runtime.f,' +
        'a=runtime.a,' +
        'c=runtime.c,' +
        'F=runtime.F,' +
        'A=runtime.A,' +
        'C=runtime.C,' +
        'l=runtime.l,' +
        'p=runtime.p,' +
        's=runtime.s,' +
        'o=runtime.o,' +
        'locales=["en","ru"];' +
        'return l(locale,locales)===1?"bar":"foo"',
    );
  });
});
