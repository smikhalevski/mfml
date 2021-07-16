import {IMessageGroup} from '../compiler';
import {Node} from '../parser';

/**
 * An adapter that receives a `fileMap` with files that were included in compilation and a pre-configured parser and
 * returns a map from file path to a corresponding {@link IMessageGroup}.
 */
export type Adapter<O> = (fileMap: Record<string, string>, parse: (str: string) => Node, options: O) => Record<string, IMessageGroup>;
