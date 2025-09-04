#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ResolvedConfig } from '../compiler/index.js';
import { printHelp, printError } from './utils.js';

const fallbackConfigPaths = ['mfml.config.ts', 'mfml.config.js', 'mfml.config.mts', 'mfml.config.mjs'];

let userConfigPath;

for (let i = 2; i < process.argv.length; ++i) {
  if (process.argv[i] === '--config') {
    userConfigPath = process.argv[i + 1];
  }

  if (process.argv[i] === '--help') {
    printHelp();
    process.exit(0);
  }
}

try {
  const configPath = resolveConfigPath(process.cwd(), userConfigPath ? [userConfigPath] : fallbackConfigPaths);

  const { default: config } = await import(configPath);

  await build(config);
} catch (error) {
  printError(error);

  process.exit(1);
}

async function build(config: ResolvedConfig): Promise<void> {
  const { messages, compiler, packageName, outDir } = config;

  const files = await compiler.compile(messages);

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

  console.log('Generated ' + Object.keys(files).length + ' files in ' + packageDir);
}

function resolveConfigPath(basePath: string, configPaths: string[]): string {
  configPaths = configPaths.map(configPath => path.resolve(basePath, configPath));

  const configPath = configPaths.find(configPath => fs.existsSync(configPath));

  if (configPath === undefined) {
    throw new Error('Config not found among paths:\n  ' + configPaths.join('\n  ') + '\n');
  }

  return configPath;
}
