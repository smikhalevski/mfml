import {createMfmlParser} from '../../main/parser/createMfmlParser';
import {compileMessage, IMessageCompilerOptions} from '../../main/compiler/compileMessage';

describe('compileCallback', () => {

  const parse = createMfmlParser();

  let options: IMessageCompilerOptions;

  beforeEach(() => {
    options = {
      supportedLocales: ['en', 'es'],
      supportedLocalesVarName: 'supportedLocales',
      defaultLocale: 'en',
      interfaceName: 'IGggArgs',
      functionName: 'ggg',
      localeVarName: 'locale',
      runtimeVarName: 'runtime',
      argsVarName: 'args',
      indexVarName: 'i',
      comment: undefined,
      otherSelectCaseKey: 'other',
      nullable: true,
      provideFunctionType: () => undefined,
    };
  });

  test('compiles message with no nodes', () => {
    expect(compileMessage({translationMap: {}}, options)).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{return null}',
    );
  });

  test('compiles message a blank non-default locale', () => {
    expect(compileMessage({translationMap: {es: parse('')}}, options)).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{return null}',
    );
  });

  test('compiles message a blank default locale', () => {
    expect(compileMessage({translationMap: {en: parse('')}}, options)).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{return null}',
    );
  });

  test('compiles message a non-blank non-default locale', () => {
    expect(compileMessage({translationMap: {es: parse('aaa')}}, options)).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'return "aaa"' +
        '}',
    );
  });

  test('compiles message a non-blank default locale', () => {
    expect(compileMessage({translationMap: {en: parse('aaa')}}, options)).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'return "aaa"' +
        '}',
    );
  });

  test('respects nullable', () => {
    expect(compileMessage({translationMap: {en: parse('')}}, {...options, nullable: false})).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string{' +
        'return ""' +
        '}',
    );
  });

  test('compiles select with a index variable', () => {
    const src = compileMessage({
      translationMap: {
        en: parse('{foo,select,aaa{AAA}bbb{BBB}}'),
      },
    }, options);

    expect(src).toBe(
        'export interface IGggArgs{foo:number;}' +
        'export function ggg<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string|null{' +
        'let i;const {s}=runtime,{foo:b}=args;' +
        'return (i=s(b,"aaa","bbb"),i===0?"AAA":i===1?"BBB":null)' +
        '}',
    );
  });

  test('compiles select without a index variable', () => {
    const src = compileMessage({
      translationMap: {
        en: parse('{foo,select,aaa{AAA}other{BBB}}'),
      },
    }, options);

    expect(src).toBe(
        'export interface IGggArgs{foo:number;}' +
        'export function ggg<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string|null{' +
        'const {s}=runtime,{foo:b}=args;' +
        'return s(b,"aaa","other")===0?"AAA":"BBB"' +
        '}',
    );
  });

  test('compiles variable used in both function and select', () => {
    const src = compileMessage({
      translationMap: {
        en: parse('{foo,select,aaa{AAA{foo,www}}}'),
      },
    }, {...options, provideFunctionType: () => 'Baz&Bar'});

    expect(src).toBe(
        'export interface IGggArgs{foo:Baz&Bar&number;}' +
        'export function ggg<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string|null{' +
        'const {f,c,s}=runtime,{foo:b}=args;' +
        'return s(b,"aaa")===0?f("AAA",c("www",b)):null' +
        '}',
    );
  });

  test('compiles variable used in both function and select with intersection type', () => {
    const src = compileMessage({
      translationMap: {
        en: parse('{foo,select,aaa{AAA{foo,www}}}'),
      },
    }, {...options, provideFunctionType: () => 'Baz|Bar'});

    expect(src).toBe(
        'export interface IGggArgs{foo:(Baz|Bar)&number;}' +
        'export function ggg<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string|null{' +
        'const {f,c,s}=runtime,{foo:b}=args;' +
        'return s(b,"aaa")===0?f("AAA",c("www",b)):null' +
        '}',
    );
  });

  test('compiles message with a display name', () => {
    const src = compileMessage({
      translationMap: {
        en: parse('{foo,select,aaa{AAA}other{BBB}}'),
      },
      displayName: '__ggg__',
    }, options);

    expect(src).toBe(
        'export interface IGggArgs{foo:number;}' +
        'function ggg<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string|null{' +
        'const {s}=runtime,{foo:b}=args;' +
        'return s(b,"aaa","other")===0?"AAA":"BBB"' +
        '}' +
        'ggg.displayName="__ggg__";' +
        'export{ggg};',
    );
  });

  test('compiles message with a single non-default locale', () => {
    const src = compileMessage({
      translationMap: {
        es: parse('Hola!'),
      },
    }, {...options, supportedLocales: ['es']});

    expect(src).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'return "Hola!"' +
        '}',
    );
  });

  test('compiles message with a single non-default locale', () => {
    const src = compileMessage({
      translationMap: {
        es: parse('Hola!'),
      },
    }, options);

    expect(src).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'return "Hola!"' +
        '}',
    );
  });

  test('compiles message with a multiple non-default locales', () => {
    const src = compileMessage({
      translationMap: {
        es: parse('Hola!'),
        ru: parse('Привет!'),
      },
    }, {...options, supportedLocales: ['es', 'ru', 'en']});

    expect(src).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'const {l}=runtime;' +
        'return l(locale,supportedLocales)===1?"Привет!":"Hola!"' +
        '}',
    );
  });

  test('compiles message with a blank non-default locale and a default locale', () => {
    const src = compileMessage({
      translationMap: {
        en: parse('Hello!'),
        es: parse(''),
      },
    }, options);

    expect(src).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'const {l}=runtime;' +
        'return l(locale,supportedLocales)===1?null:"Hello!"' +
        '}',
    );
  });

});
