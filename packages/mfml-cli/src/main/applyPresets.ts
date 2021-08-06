import {IConfig} from './cli-types';
import {
  assertArray,
  bold,
  defaults,
  die,
  fieldMessage,
  formatFilePath,
  isObject,
  isString,
  requireOrDie,
  resolvePathOrDie,
} from './misc';
import path from 'path';

/**
 * Loads presets and applies them to the `config`.
 *
 * **Note:** This method updates `config` and presets that were processed.
 *
 * @param config The config to which presets are applied.
 * @param baseDir The absolute directory from which preset paths are resolved.
 * @param configPath The path from which `config` was read.
 */
export function applyPresets(config: IConfig, baseDir: string, configPath = '<root>'): void {
  const presets = config.presets;

  if (presets == null) {
    return;
  }

  assertArray(presets, 'presets');

  config.presets = undefined;

  for (let preset of presets) {

    let presetPath = configPath;

    if (isString(preset)) {
      presetPath = resolvePathOrDie(preset, [baseDir], `Cannot find preset ${bold(preset)} in ${formatFilePath(baseDir)}`);
      baseDir = path.dirname(presetPath);
      preset = requireOrDie(presetPath, `Failed to load preset ${formatFilePath(presetPath)}`);
    }

    if (isObject(preset)) {
      applyPresets(preset, baseDir, presetPath);
      defaults(config, preset);
      continue;
    }

    die(fieldMessage('presets[i]', 'must be a config object or a path of a module that exports a config object' + (configPath ? ' in ' + formatFilePath(configPath) : '')));
  }
}
