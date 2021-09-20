import {Adapter, IConfig} from './cli-types';
import {bold, die, fieldMessage, formatFilePath, isFunction, isString, requireOrDie, resolvePathOrDie} from './misc';
import localeFilesAdapter from './adapters/localeFilesAdapter';
import {logInfo} from './log-utils';
import path from 'path';

const adaptersDir = path.resolve(__dirname, './adapters');

/**
 * Loads the adapter function.
 */
export function loadAdapter(adapter: IConfig['adapter'], baseDir: string): Adapter<any> {

  if (adapter == null) {
    return localeFilesAdapter;
  }

  if (isString(adapter)) {
    const adapterPath = resolvePathOrDie(adapter, [adaptersDir, baseDir], `Cannot find adapter ${bold(adapter)} in ${formatFilePath(baseDir)}`);
    adapter = requireOrDie(adapterPath, `Failed to load adapter ${formatFilePath(adapterPath)}`);
    logInfo(`Loading adapter ${bold(adapterPath)}`);
  }

  if (isFunction(adapter)) {
    return adapter;
  }

  die(fieldMessage('adapter', 'must be a function or a path to a module that exports a function'));
}
