import {IMfmlParserOptions, IModuleCompilerOptions} from 'mfml-compiler';

export const enum CliOptionKey {
  CONFIG = 'config',
  INCLUDE = 'include',
  OUT_DIR = 'outDir',
  ROOT_DIR = 'rootDir',
  PRESET = 'preset',
  ADAPTER = 'adapter',
  TS = 'ts',
  DEFAULT_LOCALE = 'defaultLocale',
}

/**
 * Params provided to the CLI utility.
 */
export interface ICliOptions {
  [CliOptionKey.CONFIG]?: string;
  [CliOptionKey.OUT_DIR]?: string;
  [CliOptionKey.ROOT_DIR]?: string;
  [CliOptionKey.INCLUDE]?: Array<string>;
  [CliOptionKey.PRESET]?: Array<string>;
  [CliOptionKey.ADAPTER]?: string;
  [CliOptionKey.TS]?: boolean;
  [CliOptionKey.DEFAULT_LOCALE]?: string;
}

/**
 * An adapter that receives a `files` that were included in the compilation, compiles them with `compileModule` and
 * returns a map from relative file path to a corresponding compile source.
 *
 * @param config The fully resolved compilation config.
 */
export type Adapter<Options> = (config: IResolvedConfig & Partial<Options>) => void;

/**
 * The config that must be exported from a module. By default, it should be located in `mfml.config.js` or
 * `mfml.config.json`.
 */
export interface ICompilationOptions extends IMfmlParserOptions, IModuleCompilerOptions {

  /**
   * The list of file paths included in the compilation.
   */
  include: Array<string>;

  /**
   * The output folder for all emitted files.
   */
  outDir: string;

  /**
   * The root folder from which {@link include} are resolved.
   */
  rootDir: string;

  /**
   * Any additional adapter options.
   */
  [adapterOptionKey: string]: any;
}

export interface IResolvedConfig extends ICompilationOptions {

  /**
   * The configuration presets that must be used as a fallback.
   */
  presets: Array<IConfig>;

  /**
   * The compilation adapter that should be used or a path from which adapter should be loaded.
   */
  adapter: Adapter<any>;
}

export interface IConfig extends Partial<ICompilationOptions> {

  /**
   * The configuration presets that must be used as a fallback.
   */
  presets?: Array<string | IConfig>;

  /**
   * The compilation adapter that should be used or a path from which adapter should be loaded.
   *
   * @default `"mfml-cli/lib/adapters/localeFilesAdapter"`
   */
  adapter?: string | Adapter<any>;
}
