/**
 * Compiler that converts MFML to a source code.
 *
 * @module mfml/compiler
 */

export {
  createCompiler,
  CompilerError,
  type Compiler,
  type CompilerOptions,
  type Preprocessor,
  type Postprocessor,
  type PreprocessorOptions,
  type PostprocessorOptions,
} from './createCompiler.js';
export { defineConfig, type Config, type ResolvedConfig } from './defineConfig.js';
