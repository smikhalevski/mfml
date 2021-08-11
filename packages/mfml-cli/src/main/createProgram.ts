import {Command} from 'commander';
import {logError} from './log-utils';
import {CliOptionKey} from './cli-types';

export function createProgram(): Command {

  const program = new Command();

  const packageJson = require('../package.json');

  program.name('mfmlc');
  program.version(packageJson.version);
  program.description(packageJson.description);

  program.option(`-c, --${CliOptionKey.CONFIG} <file>`, 'the config path');
  program.option(`-i, --${CliOptionKey.INCLUDE} <pattern...>`, 'the glob pattern of file paths that must be included in the compilation');
  program.option(`-o, --${CliOptionKey.OUT_DIR} <dir>`, 'the output folder for all emitted files');
  program.option(`-d, --${CliOptionKey.ROOT_DIR} <dir>`, 'the root folder from which included file paths are resolved');
  program.option(`-p, --${CliOptionKey.PRESET} <preset...>`, 'the path of a configuration preset');
  program.option(`-a, --${CliOptionKey.ADAPTER} <adapter>`, 'the path to a compilation adapter');
  program.option(`-l, --${CliOptionKey.DEFAULT_LOCALE} <locale>`, 'default locale');
  program.option(`-t, --${CliOptionKey.TS}`, 'produce TypeScript typings for message functions');

  program.exitOverride(logError);

  return program;
}
