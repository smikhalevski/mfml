import {IMfmlParserOptions, IModuleCompilerOptions} from 'mfml-compiler';

/**
 * The compilation config.
 */
export interface IConfig extends IMfmlParserOptions, IModuleCompilerOptions {

  /**
   * The path to the compilation adapter.
   *
   * @default 'mfml/lib/adapter/localeFilesAdapter'
   * @see {@link Adapter}
   */
  adapterPath?: string;

  /**
   * Options passed to adapter.
   */
  adapterOptions?: any;
}