import {createProgram} from './createProgram';
import {resolveConfig} from './resolveConfig';
import {logError, logSuccess} from './log-utils';
import {bold} from './misc';

try {
  const program = createProgram();
  const cliOptions = program.parse(process.argv).opts();
  const config = resolveConfig(cliOptions, process.cwd());

  config.adapter(config);

  logSuccess(`Compiled ${bold(config.include.length)} files`);
} catch (error) {
  logError(error);
}
