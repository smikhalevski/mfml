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
      displayName: undefined,
      otherSelectCaseKey: 'other',
      renameArgument: (name) => name,
      renameTag: (name) => name,
      renameAttribute: (name) => name,
      renameFunction: (name) => name,
      nullable: true,
      getFunctionArgumentType: () => undefined,
    };
  });

  test('compiles message with no nodes', () => {
    expect(compileMessage({}, options)).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{return null}',
    );
  });

  test('compiles message a blank non-default locale', () => {
    expect(compileMessage({es: parse('')}, options)).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{return null}',
    );
  });

  test('compiles message a blank default locale', () => {
    expect(compileMessage({en: parse('')}, options)).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{return null}',
    );
  });

  test('compiles message a non-blank non-default locale', () => {
    expect(compileMessage({es: parse('aaa')}, options)).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'return "aaa"' +
        '}',
    );
  });

  test('compiles message a non-blank default locale', () => {
    expect(compileMessage({en: parse('aaa')}, options)).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'return "aaa"' +
        '}',
    );
  });

  test('respects nullable', () => {
    expect(compileMessage({en: parse('')}, {...options, nullable: false})).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string{' +
        'return ""' +
        '}',
    );
  });

  test('compiles select with a temp variable', () => {
    const src = compileMessage({
      en: parse('{foo,select,aaa{AAA}bbb{BBB}}'),
    }, options);

    expect(src).toBe(
        'export interface IGggArgs{foo:number;}' +
        'export function ggg<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string|null{' +
        'const i,{s}=runtime,{foo as b}=args;' +
        'return (i=s(b,"aaa","bbb"),i===0?"AAA":i===1?"BBB":null)' +
        '}',
    );
  });

  test('compiles select without a temp variable', () => {
    const src = compileMessage({
      en: parse('{foo,select,aaa{AAA}other{BBB}}'),
    }, options);

    expect(src).toBe(
        'export interface IGggArgs{foo:number;}' +
        'export function ggg<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string|null{' +
        'const {s}=runtime,{foo as b}=args;' +
        'return s(b,"aaa")===0?"AAA":"BBB"' +
        '}',
    );
  });

  test('compiles message with a display name', () => {
    const src = compileMessage({
      en: parse('{foo,select,aaa{AAA}other{BBB}}'),
    }, {...options, displayName: '__ggg__'});

    expect(src).toBe(
        'export interface IGggArgs{foo:number;}' +
        'function ggg<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string|null{' +
        'const {s}=runtime,{foo as b}=args;' +
        'return s(b,"aaa")===0?"AAA":"BBB"' +
        '}' +
        'ggg.displayName="__ggg__";' +
        'export{ggg};',
    );
  });

  test('compiles message with a single non-default locale', () => {
    const src = compileMessage({
      es: parse('Ola!'),
    }, {...options, supportedLocales: ['es']});

    expect(src).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'return "Ola!"' +
        '}',
    );
  });

  test('compiles message with a single non-default locale', () => {
    const src = compileMessage({
      es: parse('Ola!'),
    }, options);

    expect(src).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'return "Ola!"' +
        '}',
    );
  });

  test('compiles message with a multiple non-default locales', () => {
    const src = compileMessage({
      es: parse('Ola!'),
      ru: parse('Привет!'),
    }, {...options, supportedLocales: ['es', 'ru', 'en']});

    expect(src).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'const {l}=runtime;' +
        'return l(locale,supportedLocales)===1?"Привет!":"Ola!"' +
        '}',
    );
  });

  test('compiles message with a blank non-default locale and a default locale', () => {
    const src = compileMessage({
      en: parse('Hello!'),
      es: parse(''),
    }, options);

    expect(src).toBe(
        'export function ggg<T>(locale:string,runtime:IRuntime<T>):T|string|null{' +
        'const {l}=runtime;' +
        'return l(locale,supportedLocales)===1?null:"Hello!"' +
        '}',
    );
  });

});
