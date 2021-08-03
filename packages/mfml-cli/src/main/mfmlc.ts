import {program} from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import {Adapter, IConfig} from './cli-types';
import {compileModule, createMfmlParser, IMessage, IMessageModule} from 'mfml-compiler';

const CONFIG_PATH = 'mfml.config.js';
const ADAPTER_PATH = './adapters/localeFilesAdapter';

const packageJson = require('../package.json');

program.name('mfmlc');
program.version(packageJson.version);
program.description(packageJson.description);

program.requiredOption('-i, --includes <path...>', 'file paths of type definitions');
program.requiredOption('-o, --outDir <dir>', 'an output folder for all emitted files');
program.option('-c, --config <path>', 'config path', CONFIG_PATH);
program.option('-d, --rootDir <dir>', 'the root folder within your source files', '.');
program.option('-f, --force', 'overwrite files');

const options = program.parse(process.argv).opts();

const dir = process.cwd();

const outDir = path.resolve(dir, options.outDir);
const rootDir = path.resolve(dir, options.rootDir);
const configPath = path.join(dir, options.config);

let config: IConfig = {};

if (fs.existsSync(configPath)) {
  config = require(configPath);
} else if (options.config !== CONFIG_PATH) {
  console.log('error: Config not found ' + configPath);
  process.exit(1);
}

const filePaths = Array.prototype.concat.apply([], options.includes.map((include: string) => glob.sync(include, {cwd: rootDir})));

if (filePaths.length === 0) {
  console.log('error: No files to compile');
  process.exit(1);
}

const files = filePaths.reduce((files, filePath) => {
  files[filePath] = fs.readFileSync(path.resolve(rootDir, filePath), 'utf-8');
  return files;
}, {});

const parseMfml = createMfmlParser(config);
const moduleCompiler = (messageModule: IMessageModule, onError?: (error: unknown, messageName: string, message: IMessage) => void) => compileModule(messageModule, parseMfml, Object.assign({}, config, {onError}));

const adapterPath = config.adapterPath || ADAPTER_PATH;
const adapter: Adapter<unknown> = require(adapterPath);

if (typeof adapter !== 'function') {
  console.log('error: Expected a function as a default export: ' + adapterPath);
  process.exit(1);
}

const outputEntries = Object.entries(adapter(files, moduleCompiler, config.adapterOptions));

for (const entry of outputEntries) {
  const filePath = entry[0] = path.resolve(outDir, entry[0]);

  if (fs.existsSync(filePath) && !options.force) {
    console.log('error: File already exists: ' + filePath);
    process.exit(1);
  }
}

for (const [filePath, source] of outputEntries) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, source, {encoding: 'utf8'});
}
