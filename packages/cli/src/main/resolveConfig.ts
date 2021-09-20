import {CliOptionKey, ICliOptions, IConfig, IResolvedConfig} from './cli-types';
import {loadConfig} from './loadConfig';
import {applyPresets} from './applyPresets';
import {assertArray, assertFunction, assertString, defaults, die, isString} from './misc';
import {convertCliOptionsToConfig} from './convertCliOptionsToConfig';
import path from 'path';
import {loadAdapter} from './loadAdapter';
import {glob} from 'glob';

const configMethods: Array<keyof IConfig> = [
  'renameArgument',
  'renameFunction',
  'renameInterface',
  'renameMessageFunction',
  'rewriteTranslation',
  'renderMetadata',
  'extractComment',
  'provideDefaultLocale',
  'provideFunctionType',
  'onError',
];

/**
 * Returns fully resolved config that can be used for creating a compiler.
 *
 * @param cliOptions Options acquired from CLI.
 * @param baseDir The directory from which various paths is resolved.
 */
export function resolveConfig(cliOptions: ICliOptions, baseDir: string): IResolvedConfig {

  const config = defaults(convertCliOptionsToConfig(cliOptions), loadConfig(cliOptions[CliOptionKey.CONFIG], baseDir));

  applyPresets(config, baseDir);

  assertArray(config.include, 'include', isString);

  assertString(config.outDir, 'outDir');

  if (config.rootDir != null) {
    assertString(config.rootDir, 'rootDir');
  }

  for (const configMethod of configMethods) {
    if (config[configMethod] != null) {
      assertFunction(config[configMethod], configMethod);
    }
  }

  const rootDir = config.rootDir = config.rootDir != null ? path.resolve(baseDir, config.rootDir) : baseDir;

  config.outDir = path.resolve(baseDir, config.outDir);

  config.adapter = loadAdapter(config.adapter, baseDir);

  config.include = config.include.reduce<Array<string>>((includes, include) => includes.concat(glob.sync(include, {cwd: rootDir})), []);

  if (config.include.length === 0) {
    die('No files were included in the compilation');
  }

  return config as IResolvedConfig;
}
