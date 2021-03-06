import {createMfmlParser} from '../../main/parser/createMfmlParser';
import {compileMessage, IMessageCompilerOptions} from '../../main/compiler/compileMessage';

describe('compileMessage', () => {

  const parse = createMfmlParser();

  let options: IMessageCompilerOptions;

  beforeEach(() => {
    options = {
      typingsEnabled: true,
      locales: ['en', 'es'],
      localesVarName: 'locales',
      defaultLocale: 'en',
      interfaceName: 'IGggValues',
      functionName: 'ggg',
      localeVarName: 'locale',
      runtimeVarName: 'runtime',
      argsVarName: 'values',
      indexVarName: 'i',
      defaultLocaleVarName: 'defaultLocale',
      comment: undefined,
      otherSelectCaseKey: 'other',
      provideFunctionType: () => undefined,
    };
  });

  test('compiles message without arguments', () => {
    expect(compileMessage({}, options)).toBe(
        'let ggg:MessageFunction<void>=(runtime,locale)=>{'
        + 'const{f}=runtime;'
        + 'return f()'
        + '};',
    );
  });

  test('compiles message with a single untyped argument', () => {
    expect(compileMessage({en: parse('{foo}')}, options)).toBe(
        'export interface IGggValues{'
        + 'foo:unknown;'
        + '}'
        + 'let ggg:MessageFunction<IGggValues>=(runtime,locale,values)=>{'
        + 'const{a}=runtime;'
        + 'const{foo:b}=values;'
        + 'return a(defaultLocale,b)'
        + '};',
    );
  });

  test('compiles message with a single typed argument', () => {
    options.provideFunctionType = () => 'string';

    expect(compileMessage({en: parse('{foo,aaa}')}, options)).toBe(
        'export interface IGggValues{'
        + 'foo:string;'
        + '}'
        + 'let ggg:MessageFunction<IGggValues>=(runtime,locale,values)=>{'
        + 'const{c}=runtime;'
        + 'const{foo:b}=values;'
        + 'return c(defaultLocale,b,"aaa")'
        + '};',
    );
  });

  test('compiles message with a single dual-typed argument', () => {
    options.provideFunctionType = (functionName) => functionName === 'aaa' ? 'string' : 'number';

    expect(compileMessage({en: parse('{foo,aaa}{foo,bbb}')}, options)).toBe(
        'export interface IGggValues{'
        + 'foo:string&number;'
        + '}'
        + 'let ggg:MessageFunction<IGggValues>=(runtime,locale,values)=>{'
        + 'const{f,c}=runtime;'
        + 'const{foo:b}=values;'
        + 'return f(c(defaultLocale,b,"aaa"),c(defaultLocale,b,"bbb"))'
        + '};',
    );
  });

  test('compiles message with a single dual-typed argument with an intersection type', () => {
    options.provideFunctionType = (functionName) => functionName === 'aaa' ? 'string' : 'Foo|Bar';

    expect(compileMessage({en: parse('{foo,aaa}{foo,bbb}')}, options)).toBe(
        'export interface IGggValues{'
        + 'foo:string&(Foo|Bar);'
        + '}'
        + 'let ggg:MessageFunction<IGggValues>=(runtime,locale,values)=>{'
        + 'const{f,c}=runtime;'
        + 'const{foo:b}=values;'
        + 'return f(c(defaultLocale,b,"aaa"),c(defaultLocale,b,"bbb"))'
        + '};',
    );
  });

  test('compiles message with a single argument with an intersection type', () => {
    options.provideFunctionType = () => 'Foo|Bar';

    expect(compileMessage({en: parse('{foo,aaa}')}, options)).toBe(
        'export interface IGggValues{'
        + 'foo:Foo|Bar;'
        + '}'
        + 'let ggg:MessageFunction<IGggValues>=(runtime,locale,values)=>{'
        + 'const{c}=runtime;'
        + 'const{foo:b}=values;'
        + 'return c(defaultLocale,b,"aaa")'
        + '};',
    );
  });

  test('compiles non-identifier argument names', () => {
    expect(compileMessage({en: parse('{123f}')}, options)).toBe(
        'export interface IGggValues{'
        + '"123f":unknown;'
        + '}'
        + 'let ggg:MessageFunction<IGggValues>=(runtime,locale,values)=>{'
        + 'const{a}=runtime;'
        + 'const{"123f":b}=values;'
        + 'return a(defaultLocale,b)'
        + '};',
    );
  });

  test('compiles select argument', () => {
    expect(compileMessage({en: parse('{foo,select,AAA{okay}}')}, options)).toBe(
        'export interface IGggValues{'
        + 'foo:number|string;'
        + '}'
        + 'let ggg:MessageFunction<IGggValues>=(runtime,locale,values)=>{'
        + 'const{s,f}=runtime;'
        + 'const{foo:b}=values;'
        + 'return s(b,"AAA")===0?"okay":f()'
        + '};',
    );
  });

  test('compiles selectordinal argument', () => {
    expect(compileMessage({en: parse('{foo,selectordinal,zero{okay}many{nope}}')}, options)).toBe(
        'export interface IGggValues{'
        + 'foo:number;'
        + '}'
        + 'let ggg:MessageFunction<IGggValues>=(runtime,locale,values)=>{'
        + 'let i;'
        + 'const{o,f}=runtime;'
        + 'const{foo:b}=values;'
        + 'return (i=o(defaultLocale,b),i===0?"okay":i===4?"nope":f())'
        + '};',
    );
  });

  test('compiles an interface for unused var', () => {
    expect(compileMessage({en: parse('{foo,select,}')}, options)).toBe(
        'export interface IGggValues{'
        + 'foo:number|string;'
        + '}'
        + 'let ggg:MessageFunction<IGggValues>=(runtime,locale,values)=>{'
        + 'const{f}=runtime;'
        + 'return f()'
        + '};',
    );
  });

  test('compiles plural', () => {
    expect(compileMessage({en: parse('{foo,plural,one{okay}}')}, options)).toBe(
        'export interface IGggValues{'
        + 'foo:number;'
        + '}'
        + 'let ggg:MessageFunction<IGggValues>=(runtime,locale,values)=>{'
        + 'const{p,f}=runtime;'
        + 'const{foo:b}=values;'
        + 'return p(defaultLocale,b)===1?"okay":f()'
        + '};',
    );
  });

  test('compiles a message without typings', () => {
    options.typingsEnabled = false;

    expect(compileMessage({en: parse('{foo}')}, options)).toBe(
        'let ggg=(runtime,locale,values)=>{'
        + 'const{a}=runtime;'
        + 'const{foo:b}=values;'
        + 'return a(defaultLocale,b)'
        + '};',
    );
  });

  test('compiles comment', () => {
    options.comment = 'hello!';

    expect(compileMessage({}, options)).toBe(
        '/**\n * hello!\n */'
        + 'let ggg:MessageFunction<void>=(runtime,locale)=>{'
        + 'const{f}=runtime;'
        + 'return f()'
        + '};',
    );
  });
});
