#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ResolvedConfig } from '../compiler/index.js';
import { print, printError, printHelp } from './utils.js';

print.isColorized = process.stdout.isTTY && process.env.FORCE_COLOR !== '0';

const fallbackConfigPaths = ['mfml.config.ts', 'mfml.config.js', 'mfml.config.mts', 'mfml.config.mjs'];

let argvConfigPath;

for (let i = 2; i < process.argv.length; ++i) {
  switch (process.argv[i]) {
    case '--help':
      print.isSilent = false;
      printHelp();
      process.exit(0);
      break;

    case '--config':
      argvConfigPath = process.argv[++i];
      break;

    case '--silent':
      print.isSilent = true;
      break;

    case '--color':
      print.isColorized = true;
      break;
  }
}

try {
  const configPath = resolveConfigPath(process.cwd(), argvConfigPath ? [argvConfigPath] : fallbackConfigPaths);

  const { default: config } = await import(configPath);

  await build(config);
} catch (error) {
  printError(error);
  process.exit(1);
}

async function build(config: ResolvedConfig): Promise<void> {
  const { messages, compiler, packageName, outDir } = config;

  const startTimestamp = performance.now();

  const files = await compiler.compile(messages);

  const duration = (performance.now() - startTimestamp).toFixed(1);

  const packageJSON = {
    name: packageName,
    type: 'module',
    main: './index.js',
    types: './index.d.ts',
    exports: {
      '.': './index.js',
      './metadata': './metadata.js',
      './package.json': './package.json',
    },
    sideEffects: false,
  };

  files['package.json'] = JSON.stringify(packageJSON, null, 2);

  const packageDir = path.join(process.cwd(), outDir, 'node_modules', packageName);

  fs.mkdirSync(packageDir, { recursive: true });

  for (const file in files) {
    fs.writeFileSync(path.join(packageDir, file), files[file]);
  }

  print('Generated ' + Object.keys(files).length + ' files in ' + packageDir + ' (' + duration + 'ms)');
}

function resolveConfigPath(basePath: string, configPaths: string[]): string {
  configPaths = configPaths.map(configPath => path.resolve(basePath, configPath));

  const configPath = configPaths.find(configPath => fs.existsSync(configPath));

  if (configPath === undefined) {
    throw new Error('Config not found among paths:\n  ' + configPaths.join('\n  ') + '\n');
  }

  return configPath;
}
