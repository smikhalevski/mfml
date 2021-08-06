import {IConfig} from './cli-types';
import fs from 'fs';
import path from 'path';
import {applyPresets} from './applyPresets';
import {assert, bold, formatFilePath, isObject, requireOrDie, resolvePathOrDie} from './misc';
import {logInfo} from './log-utils';

const CONFIG_FILE_NAME = 'mfml.config.js';

/**
 * Loads config from `configPath` that is resolved from `baseDir`. If `configPath` is undefined then we try to look up
 * a default config and if it's also not found the an empty config is returned.
 *
 * @param configPath The path to load config from.
 * @param baseDir The directory from which the `configPath` is resolved.
 */
export function loadConfig(configPath: string | undefined, baseDir: string): IConfig {

  let config: IConfig = {};

  if (configPath == null) {
    const defaultConfigPath = path.resolve(baseDir, CONFIG_FILE_NAME);

    if (fs.existsSync(defaultConfigPath)) {
      configPath = defaultConfigPath;
    }
  }

  if (configPath != null) {
    configPath = resolvePathOrDie(configPath, [baseDir], `Cannot find config ${bold(configPath)} in ${formatFilePath(baseDir)}`);
    config = requireOrDie(configPath, `Failed to load config ${formatFilePath(configPath)}`);

    assert(isObject(config), `Config must be an object ${formatFilePath(configPath)}`);

    logInfo(`Loading config ${formatFilePath(configPath)}`);
    applyPresets(config, baseDir, configPath);
  }

  return config;
}
