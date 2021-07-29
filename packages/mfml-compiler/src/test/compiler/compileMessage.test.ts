import {createMfmlParser} from '../../main/parser/createMfmlParser';
import {compileMessage, IMessageCompilerOptions} from '../../main/compiler/compileMessage';

describe('compileMessage', () => {

  const parse = createMfmlParser();

  let options: IMessageCompilerOptions;

  beforeEach(() => {
    options = {
      locales: ['en', 'es'],
      localesVarName: 'locales',
      defaultLocale: 'en',
      interfaceName: 'IGggArgs',
      functionName: 'ggg',
      localeVarName: 'locale',
      runtimeVarName: 'runtime',
      argsVarName: 'args',
      indexVarName: 'i',
      comment: undefined,
      otherSelectCaseKey: 'other',
      provideFunctionType: () => undefined,
    };
  });

  test('compiles message without arguments', () => {
    expect(compileMessage({}, options)).toBe(
        'let ggg=<T>(locale:string,runtime:IRuntime<T>):T|string=>{' +
        'const{f}=runtime;' +
        'return f()' +
        '}',
    );
  });

  test('compiles message with a single untyped argument', () => {
    expect(compileMessage({en: parse('{foo}')}, options)).toBe(
        'export interface IGggArgs{' +
        'foo:unknown;' +
        '}' +
        'let ggg=<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string=>{' +
        'const{a}=runtime;' +
        'const{foo:b}=args;' +
        'return a(b)' +
        '}',
    );
  });

  test('compiles message with a single typed argument', () => {
    options.provideFunctionType = () => 'string';

    expect(compileMessage({en: parse('{foo,aaa}')}, options)).toBe(
        'export interface IGggArgs{' +
        'foo:string;' +
        '}' +
        'let ggg=<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string=>{' +
        'const{c}=runtime;' +
        'const{foo:b}=args;' +
        'return c("aaa",b)' +
        '}',
    );
  });

  test('compiles message with a single dual-typed argument', () => {
    options.provideFunctionType = (functionName) => functionName === 'aaa' ? 'string' : 'number';

    expect(compileMessage({en: parse('{foo,aaa}{foo,bbb}')}, options)).toBe(
        'export interface IGggArgs{' +
        'foo:string&number;' +
        '}' +
        'let ggg=<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string=>{' +
        'const{f,c}=runtime;' +
        'const{foo:b}=args;' +
        'return f(c("aaa",b),c("bbb",b))' +
        '}',
    );
  });

  test('compiles message with a single dual-typed argument with intersection type', () => {
    options.provideFunctionType = (functionName) => functionName === 'aaa' ? 'string' : 'Foo|Bar';

    expect(compileMessage({en: parse('{foo,aaa}{foo,bbb}')}, options)).toBe(
        'export interface IGggArgs{' +
        'foo:string&(Foo|Bar);' +
        '}' +
        'let ggg=<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string=>{' +
        'const{f,c}=runtime;' +
        'const{foo:b}=args;' +
        'return f(c("aaa",b),c("bbb",b))' +
        '}',
    );
  });

  test('compiles non-identifier argument names', () => {
    expect(compileMessage({en: parse('{123f}')}, options)).toBe(
        'export interface IGggArgs{' +
        '"123f":unknown;' +
        '}' +
        'let ggg=<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string=>{' +
        'const{a}=runtime;' +
        'const{"123f":b}=args;' +
        'return a(b)' +
        '}',
    );
  });

  test('compiles select argument', () => {
    expect(compileMessage({en: parse('{foo,select,AAA{okay}}')}, options)).toBe(
        'export interface IGggArgs{' +
        'foo:number;' +
        '}' +
        'let ggg=<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string=>{' +
        'const{s,f}=runtime;' +
        'const{foo:b}=args;' +
        'return s(b,"AAA")===0?"okay":f()' +
        '}',
    );
  });

  test('compiles an interface for unused var', () => {
    expect(compileMessage({en: parse('{foo,select,}')}, options)).toBe(
        'export interface IGggArgs{' +
        'foo:number;' +
        '}' +
        'let ggg=<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string=>{' +
        'const{f}=runtime;' +
        'return f()' +
        '}',
    );
  });

  test('compiles plural', () => {
    expect(compileMessage({en: parse('{foo,plural,one{okay}}')}, options)).toBe(
        'export interface IGggArgs{' +
        'foo:number;' +
        '}' +
        'let ggg=<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs):T|string=>{' +
        'const{p,f}=runtime;' +
        'const{foo:b}=args;' +
        'return p("en",b)===1?"okay":f()' +
        '}',
    );
  });

  test('compiles comment', () => {
    options.comment = 'hello!';

    expect(compileMessage({}, options)).toBe(
        '/**\n * hello!\n */' +
        'let ggg=<T>(locale:string,runtime:IRuntime<T>):T|string=>{' +
        'const{f}=runtime;' +
        'return f()' +
        '}',
    );
  });
});
