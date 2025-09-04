#!/usr/bin/env node
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ResolvedConfig } from '../compiler/index.js';
import { printError } from './utils.js';

const fallbackConfigPaths = ['mfml.config.ts', 'mfml.config.js', 'mfml.config.mts', 'mfml.config.mjs'];

try {
  const configPath = resolveConfigPath(process.cwd(), process.argv[2] ? [process.argv[2]] : fallbackConfigPaths);

  const { default: config } = await import(configPath);

  await build(config);
} catch (error) {
  printError(error);

  process.exit(1);
}

async function build(config: ResolvedConfig): Promise<void> {
  const { messages, compiler, packageName, outDir } = config;

  const files = await compiler.compile(messages);

  files['package.json'] = JSON.stringify({
    name: packageName,
    type: 'module',
    main: './index.js',
    types: './index.d.ts',
    exports: {
      '.': './index.js',
      './package.json': './package.json',
    },
    sideEffects: false,
  });

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
