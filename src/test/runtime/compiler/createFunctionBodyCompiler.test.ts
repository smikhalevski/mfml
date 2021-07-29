// import {
//   createFunctionBodyCompiler,
//   FunctionBodyCompiler,
//   IFunctionBodyCompilerOptions,
// } from '../../../main/runtime/compiler/createFunctionBodyCompiler';
// import {parseTranslations} from '../../../main/compiler/parseTranslations';
// import {createMfmlParser} from '../../../main/parser/createMfmlParser';
// import {ILocaleNodeMap, ITranslations} from '../../../main/compiler/compiler-types';
//
// describe('createFunctionBodyCompiler', () => {
//
//   let compileFunctionBody: FunctionBodyCompiler;
//   let options: IFunctionBodyCompilerOptions;
//   let parse: (translations: ITranslations) => ILocaleNodeMap;
//
//   beforeEach(() => {
//     options = {
//       defaultLocale: 'en',
//       nullable: true,
//       argsVarName: 'args',
//       runtimeVarName: 'runtime',
//       indexVarName: 'i',
//       localesVarName: 'locales',
//       localeVarName: 'locale',
//       otherSelectCaseKey: 'other',
//     };
//
//     compileFunctionBody = createFunctionBodyCompiler(options);
//
//     const parseMfml = createMfmlParser();
//     parse = (translations: ITranslations) => parseTranslations(parseMfml, translations);
//   });
//
//   test('compiles a function body', () => {
//     expect(compileFunctionBody(parse({en: 'foo', ru: 'bar'}))).toBe(
//         'var i,' +
//         'l=runtime.l,' +
//         'f=runtime.f,' +
//         'a=runtime.a,' +
//         'e=runtime.e,' +
//         'E=runtime.E,' +
//         'c=runtime.c,' +
//         'p=runtime.p,' +
//         's=runtime.s,' +
//         'o=runtime.o,' +
//         'locales=["en","ru"];' +
//         'return l(locale,locales)===1?"bar":"foo"',
//     );
//   });
// });
