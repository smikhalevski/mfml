import {compileLocaleNodeMap, ILocaleNodeMapCompilerOptions} from '../../main/compiler/compileLocaleNodeMap';
import {createMfmlParser} from '../../main/parser/createMfmlParser';

describe('compileLocaleNodeMap', () => {

  const parse = createMfmlParser();

  let options: ILocaleNodeMapCompilerOptions;

  beforeEach(() => {
    options = {
      otherSelectCaseKey: 'other',
      indexVarName: 'i',
      localesVarName: 'locales',
      defaultLocale: 'en',
      localeVarName: 'locale',
      locales: ['en', 'ru'],
      provideArgumentVarName: (name) => name,
      onFunctionUsed: () => undefined,
      onRuntimeMethodUsed: () => undefined,
      onSelectUsed: () => undefined,
    };
  });

  test('compiles an empty map', () => {
    expect(compileLocaleNodeMap({}, options))
        .toBe('f()');
  });

  test('ignores unknown locales', () => {
    expect(compileLocaleNodeMap({
      en: parse('foo'),
      as: parse('bar'),
    }, options))
        .toBe('"foo"');
  });

  test('compiles a default', () => {
    expect(compileLocaleNodeMap({en: parse('foo')}, options))
        .toBe('"foo"');
  });

  test('compiles a non-default', () => {
    expect(compileLocaleNodeMap({ru: parse('foo')}, options))
        .toBe('l(locale,locales)===1?"foo":f()');
  });

  test('compiles a default and non-default', () => {
    expect(compileLocaleNodeMap({
      en: parse('foo'),
      ru: parse('bar'),
    }, options))
        .toBe('l(locale,locales)===1?"bar":"foo"');
  });

  test('compiles a default and blank non-default', () => {
    expect(compileLocaleNodeMap({
      en: parse('foo'),
      ru: parse(''),
    }, options))
        .toBe('l(locale,locales)===1?f():"foo"');
  });

  test('compiles a blank default and non-default', () => {
    expect(compileLocaleNodeMap({
      en: parse(''),
      ru: parse('bar'),
    }, options))
        .toBe('l(locale,locales)===1?"bar":f()');
  });

  test('compiles multiple non-default', () => {
    options.locales = ['en', 'es', 'ru'];

    expect(compileLocaleNodeMap({
      es: parse('foo'),
      ru: parse('bar'),
    }, options))
        .toBe('(i=l(locale,locales),i===1?"foo":i===2?"bar":f())');
  });

  test('compiles multiple blank non-default', () => {
    options.locales = ['en', 'es', 'ru'];

    expect(compileLocaleNodeMap({
      es: parse(''),
      ru: parse(''),
    }, options))
        .toBe('f()');
  });

  test('compiles default and multiple blank non-default', () => {
    options.locales = ['en', 'es', 'ru'];

    expect(compileLocaleNodeMap({
      en: parse('foo'),
      es: parse(''),
      ru: parse(''),
    }, options))
        .toBe('(i=l(locale,locales),i===1||i===2?f():"foo")');
  });

  test('compiles default, non-default and multiple blank non-default', () => {
    options.locales = ['en', 'pt', 'es', 'ru'];

    expect(compileLocaleNodeMap({
      en: parse('foo'),
      pt: parse('bar'),
      es: parse(''),
      ru: parse(''),
    }, options))
        .toBe('(i=l(locale,locales),i===1?"bar":i===2||i===3?f():"foo")');
  });

  test('compiles default, multiple non-default and multiple blank non-default', () => {
    options.locales = ['en', 'as', 'pt', 'es', 'ru'];

    expect(compileLocaleNodeMap({
      en: parse('foo'),
      as: parse('bar'),
      pt: parse('qux'),
      es: parse(''),
      ru: parse(''),
    }, options))
        .toBe('(i=l(locale,locales),i===1?"bar":i===2?"qux":i===3||i===4?f():"foo")');
  });

  test('compiles blank default, multiple non-default and multiple blank non-default', () => {
    options.locales = ['en', 'as', 'pt', 'es', 'ru'];

    expect(compileLocaleNodeMap({
      en: parse(''),
      as: parse('bar'),
      pt: parse('qux'),
      es: parse(''),
      ru: parse(''),
    }, options))
        .toBe('(i=l(locale,locales),i===1?"bar":i===2?"qux":f())');
  });

  test('compiles plural in default branch', () => {
    expect(compileLocaleNodeMap({
      en: parse('{foo,plural,one{1}}'),
      ru: parse('{foo,plural,one{1}}'),
    }, options))
        .toBe('l(locale,locales)===1?p(locale,foo)===1?"1":f():p("en",foo)===1?"1":f()');
  });
});
