import {createIcuDomParser} from '../../main/parser/createIcuDomParser';
import {compileCallback} from '../../main/compiler/compileCallback';

describe('compileCallback', () => {

  const parse = createIcuDomParser();

  test('compiles empty function', () => {
    const source = compileCallback({}, {
      functionName: 'aaa',
      interfaceName: 'IAaa',
    });

    expect(source).toBe(
        'export function aaa(runtime:IRuntime<any>,locale:string):string{' +
        'return ""' +
        '}',
    );
  });

  test('compiles function with multiple locales', () => {
    const source = compileCallback({en: parse('AAA'), ru: parse('BBB')}, {
      functionName: 'aaa',
      interfaceName: 'IAaa',
    });

    expect(source).toBe(
        'export function aaa(runtime:IRuntime<any>,locale:string):string{' +
        'const {l}=runtime;' +
        'return l({en:"AAA"ru:"BBB"})' +
        '}',
    );
  });

  test('compiles function with text', () => {
    const source = compileCallback({'en': parse('aaa')}, {
      functionName: 'aaa',
      interfaceName: 'IAaa',
    });

    expect(source).toBe(
        'export function aaa(runtime:IRuntime<any>,locale:string):string{' +
        'return "aaa"' +
        '}',
    );
  });

  test('compiles function with arguments', () => {
    const source = compileCallback({'en': parse('aaa{foo}bbb')}, {
      functionName: 'aaa',
      interfaceName: 'IAaa',
    });

    expect(source).toBe(
        'export interface IAaa<T>{foo:T;}' +
        'export function aaa<T>(runtime:IRuntime<T>,locale:string,args:IAaa):T{' +
        'const {f}=runtime;' +
        'return f("aaa",args.foo,"bbb")' +
        '}',
    );
  });

  test('compiles function with plural', () => {
    const source = compileCallback({'en': parse('{foo,plural,one{AAA} many{BBB}}')}, {
      functionName: 'aaa',
      interfaceName: 'IAaa',
    });

    expect(source).toBe(
        'export interface IAaa{foo:number;}' +
        'export function aaa(runtime:IRuntime<any>,locale:string,args:IAaa):string{' +
        'const {p}=runtime;' +
        'return p(locale,args.foo,{one:"AAA",many:"BBB"})' +
        '}',
    );
  });

  test('compiles function with an element', () => {
    const source = compileCallback({'en': parse('<foo>')}, {
      functionName: 'aaa',
      interfaceName: 'IAaa',
    });

    expect(source).toBe(
        'export function aaa(runtime:IRuntime<any>,locale:string):T{' +
        'const {e}=runtime;' +
        'return e("foo",null)' +
        '}',
    );
  });

});
