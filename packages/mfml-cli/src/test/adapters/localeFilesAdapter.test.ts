import {compileModule, createMfmlParser, IMessageModule} from 'mfml-compiler';
import localeFilesAdapter, {ILocaleFilesAdapterOptions} from '../../main/adapters/localeFilesAdapter';
import path from 'path';

describe('localeFilesAdapter', () => {

  const parse = createMfmlParser();

  const compileModuleMock = jest.fn((messageModule: IMessageModule) => compileModule(messageModule, parse));

  const files: Record<string, string> = {
    './en.json': JSON.stringify({
      aaa: 'Hello!',
      bbb: 'Bye!',
    }),
    './es.json': JSON.stringify({
      aaa: 'Hola!',
      bbb: 'Adiós!',
    }),
  };

  let options: ILocaleFilesAdapterOptions;

  beforeEach(() => {
    options = {};
  });

  test('compiles files', () => {
    expect(localeFilesAdapter(files, compileModuleMock)).toEqual({
      './messages.ts':
          'import{IRuntime}from"mfml-runtime";' +
          'const b=["en","es"];' +

          'let aaa=<T>(locale:string,runtime:IRuntime<T>):T|string=>{' +
          'const{l}=runtime;' +
          'return l(locale,b)===1?"Hola!":"Hello!"' +
          '}' +

          'let bbb=<T>(locale:string,runtime:IRuntime<T>):T|string=>{' +
          'const{l}=runtime;' +
          'return l(locale,b)===1?"Adiós!":"Bye!"' +
          '}' +

          'export{aaa,bbb};\n',
    });
  });

  test('compiles a digest', () => {
    options.digestFilePath = './index.ts';

    expect(localeFilesAdapter(files, compileModuleMock, options)).toEqual({
      './index.ts': 'export*from"./messages.ts"',
      './messages.ts': expect.any(String),
    });
  });

  test('compiles a digest with a namespace', () => {
    options.digestFilePath = './index.ts';
    options.renameDigestNamespace = (filePath) => path.basename(filePath, '.ts');

    expect(localeFilesAdapter(files, compileModuleMock, options)).toEqual({
      './index.ts': 'export*as messages from"./messages.ts"',
      './messages.ts': expect.any(String),
    });
  });

  test('compiles an empty input', () => {
    expect(localeFilesAdapter({}, compileModuleMock, options)).toEqual({});
  });

  test('compiles an empty input map with digest', () => {
    options.digestFilePath = './index.ts';

    expect(localeFilesAdapter({}, compileModuleMock, options)).toEqual({});
  });
});