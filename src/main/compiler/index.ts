/**
 * Compiler that converts MFML to a source code.
 *
 * @module mfml/compiler
 */

export {
  createCompiler,
  getIntlArgumentTSType,
  CompilerError,
  type Compiler,
  type CompilerOptions,
  type Preprocessor,
  type Postprocessor,
  type PreprocessorParams,
  type PostprocessorParams,
} from './createCompiler.js';
export { defineConfig, type Config, type ResolvedConfig } from './defineConfig.js';
