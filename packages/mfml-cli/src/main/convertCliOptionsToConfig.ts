import {CliOptionKey, ICliOptions, IConfig} from './cli-types';

/**
 * Maps CLI options to a config.
 *
 * @param cliOptions Options acquired from CLI.
 * @returns The config assembled from the CLI options.
 */
export function convertCliOptionsToConfig(cliOptions: ICliOptions): IConfig {
  const defaultLocale = cliOptions[CliOptionKey.DEFAULT_LOCALE];

  return {
    outDir: cliOptions[CliOptionKey.OUT_DIR],
    rootDir: cliOptions[CliOptionKey.ROOT_DIR],
    include: cliOptions[CliOptionKey.INCLUDE],
    presets: cliOptions[CliOptionKey.PRESET],
    adapter: cliOptions[CliOptionKey.ADAPTER],
    typingsEnabled: cliOptions[CliOptionKey.TYPINGS],
    provideDefaultLocale: defaultLocale ? () => defaultLocale : undefined,
  };
}
