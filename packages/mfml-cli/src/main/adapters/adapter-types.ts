import {IMessageModule} from 'mfml-compiler';

/**
 * An adapter that receives a `files` that were included in the compilation, compiles them with `compileModule` and
 * returns a map from relative file path to a corresponding compile source.
 */
export type Adapter<Options> = (files: Record<string, string>, moduleCompiler: (messageModule: IMessageModule) => string, options: Options) => Record<string, string>;
