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
      renameArgument: (name) => name,
      renameTag: (name) => name,
      renameAttribute: (name) => name,
      renameFunction: (name) => name,
      nullable: true,
      getFunctionArgumentType: () => undefined,
    };
  });

  test('compiles message', () => {
    const src = compileMessage({
      en: parse('Hello, <b>{name}</b>!'),
      es: parse('Ola, <b>{name}</b>!'),
    }, options);

    expect(src).toBe(
        'export interface IGggArgs<T>{name:T;}' +
        'export function ggg<T>(locale:string,runtime:IRuntime<T>,args:IGggArgs<T>):T|string|null=>{' +
        'const i,{f,E,a,l}=runtime,{name as b}=args;' +
        'return l(locale,supportedLocales)===1?f("Ola, ",E("b",a(b)),"!"):f("Hello, ",E("b",a(b)),"!")' +
        '}',
    );
  });

});
