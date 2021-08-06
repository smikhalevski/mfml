import {Command} from 'commander';
import {logError} from './log-utils';
import {CliOptionKey} from './cli-types';

export function createProgram(): Command {

  const program = new Command();

  const packageJson = require('../package.json');

  program.name('mfmlc');
  program.version(packageJson.version);
  program.description(packageJson.description);

  program.option(`-c, --${CliOptionKey.CONFIG} <path>`, 'the config path');
  program.option(`-i, --${CliOptionKey.INCLUDE} <path...>`, 'the pattern of file paths that must be included in the compilation');
  program.option(`-o, --${CliOptionKey.OUT_DIR} <dir>`, 'the output folder for all emitted files');
  program.option(`-d, --${CliOptionKey.ROOT_DIR} <dir>`, 'the root folder from which included file paths are resolved');
  program.option(`-p, --${CliOptionKey.PRESET} <path...>`, 'the path of a configuration preset');
  program.option(`-a, --${CliOptionKey.ADAPTER} <path>`, 'the path to a compilation adapter');
  program.option(`-t, --${CliOptionKey.TYPINGS}`, 'produce TypeScript typings for message functions');

  program.exitOverride(logError);

  return program;
}
