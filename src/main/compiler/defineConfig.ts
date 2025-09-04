import {
  createParser,
  createTokenizer,
  htmlTokenizerOptions,
  ParserOptions,
  TokenizerOptions,
} from '../parser/index.js';
import { Compiler, CompilerOptions, createCompiler } from './createCompiler.js';
import { decodeXML } from 'speedy-entities';

/**
 * The user-facing compilation config.
 *
 * @group Config
 */
export interface Config extends Omit<ParserOptions, 'tokenizer'>, Omit<CompilerOptions, 'parser'> {
  /**
   * Messages arranged by a locale.
   */
  messages: { [locale: string]: { [messageKey: string]: string } };

  /**
   * The name of the package from to which compiled messages are written.
   *
   * @default "@mfml/messages"
   */
  packageName?: string;

  /**
   * The directory that contains node_modules.
   *
   * @default "."
   */
  outDir?: string;

  /**
   * Options that define how input text MFML messages are tokenized.
   *
   * By default, {@link htmlTokenizerOptions forgiving HTML tokenizer options} are used.
   */
  tokenizerOptions?: TokenizerOptions;
}

/**
 * Resolved compilation config used by MFML CLI tool.
 *
 * @group Config
 */
export interface ResolvedConfig {
  /**
   * Messages arranged by a locale.
   */
  messages: { [locale: string]: { [messageKey: string]: string } };

  /**
   * The compiler that transforms messages to source code.
   */
  compiler: Compiler;

  /**
   * The name of the package from to which compiled messages are written.
   */
  packageName: string;

  /**
   * The directory that contains node_modules.
   */
  outDir: string;
}

/**
 * Defines compilation config used by MFML CLI tool.
 *
 * @param config The user-facing compilation config.
 * @group Config
 */
export function defineConfig(config: Config): ResolvedConfig {
  const {
    messages,
    packageName = '@mfml/messages',
    outDir = '.',
    tokenizerOptions = htmlTokenizerOptions,
    decodeText = decodeXML,
  } = config;

  const tokenizer = createTokenizer(tokenizerOptions);
  const parser = createParser({ tokenizer, decodeText });
  const compiler = createCompiler({ ...config, parser });

  return {
    messages,
    compiler,
    packageName,
    outDir,
  };
}
