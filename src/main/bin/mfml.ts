#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ResolvedConfig } from '../compiler/index.js';
import { echoError, echoHelp } from './utils.js';
import { echo } from './echo.js';

echo.isColorized = process.stdout.isTTY && process.env.FORCE_COLOR !== '0';

const fallbackConfigPaths = ['mfml.config.ts', 'mfml.config.js', 'mfml.config.mts', 'mfml.config.mjs'];

let argvConfigPath;

for (let i = 2; i < process.argv.length; ++i) {
  switch (process.argv[i]) {
    case '--help':
      echo.isSilent = false;
      echoHelp();
      process.exit(0);
      break;

    case '--config':
      argvConfigPath = process.argv[++i];
      break;

    case '--silent':
      echo.isSilent = true;
      break;

    case '--color':
      echo.isColorized = true;
      break;
  }
}

try {
  const configPath = resolveConfigPath(process.cwd(), argvConfigPath ? [argvConfigPath] : fallbackConfigPaths);

  const { default: config } = await import(configPath);

  await build(path.dirname(configPath), config);
} catch (error) {
  echoError(error);
  process.exit(1);
}

async function build(baseDir: string, config: ResolvedConfig): Promise<void> {
  const { messages, compiler, packageName, outDir } = config;

  const startTimestamp = performance.now();

  const files = await compiler.compile(messages);

  const duration = (performance.now() - startTimestamp).toFixed(1);

  const packageDir = path.resolve(baseDir, outDir, 'node_modules', packageName);

  fs.mkdirSync(packageDir, { recursive: true });

  for (const file in files) {
    fs.writeFileSync(path.join(packageDir, file), files[file]);
  }

  echo(`Generated ${Object.keys(files).length} files in ${packageDir} (${duration}ms)`);
}

function resolveConfigPath(baseDir: string, configPaths: string[]): string {
  configPaths = configPaths.map(configPath => path.resolve(baseDir, configPath));

  const configPath = configPaths.find(configPath => fs.existsSync(configPath));

  if (configPath === undefined) {
    throw new Error('Config not found among paths:\n  ' + configPaths.join('\n  '));
  }

  return configPath;
}
