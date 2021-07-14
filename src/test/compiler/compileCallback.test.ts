import {createMfmlParser} from '../../main/parser/createMfmlParser';
import {compileMessage} from '../../main/compiler/compileMessage';

describe('compileCallback', () => {

  const parse = createMfmlParser();

  test('compiles empty function', () => {
    const source = compileMessage({}, {
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
    const source = compileMessage({en: parse('AAA'), ru: parse('BBB')}, {
      functionName: 'aaa',
      interfaceName: 'IAaa',
    });

    expect(source).toBe(
        'export function aaa(runtime:IRuntime<any>,locale:string):string{' +
        'const {l}=runtime;const li=l(locale,"en","ru","es");' +
        'return li===0?"AAA":li===1?"BBB":"CCC"})' +
        '}',
    );
  });

  test('compiles function with text', () => {
    const source = compileMessage({'en': parse('aaa')}, {
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
    const source = compileMessage({'en': parse('aaa{foo}bbb')}, {
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
    const source = compileMessage({'en': parse('{foo,plural,one{AAA} many{BBB}}')}, {
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
    const source = compileMessage({'en': parse('<foo>')}, {
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
