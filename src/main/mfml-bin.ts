import {program} from 'commander';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import {createMap} from './misc';
import {compileModuleGroups, IModuleGroupsCompilerOptions} from './compiler';
import {parseMessageGroups} from './parser';

const CONFIG_PATH = 'mfml.config.js';

const packageJson = require('../package.json');

program.name('mfmlc');
program.version(packageJson.version);
program.description(packageJson.description);

program.requiredOption('-i, --includes <path...>', 'file paths of type definitions');
program.requiredOption('-o, --outDir <dir>', 'an output folder for all emitted files');
program.option('-c, --config <path>', 'config path', CONFIG_PATH);
program.option('-d, --rootDir <dir>', 'the root folder within your source files', '.');

const opts = program.parse(process.argv).opts();

const cwd = process.cwd();

const outDir = path.resolve(cwd, opts.outDir);
const rootDir = path.resolve(cwd, opts.rootDir);
const configPath = path.join(cwd, opts.config);

let config: Partial<IModuleGroupsCompilerOptions> = {};

if (fs.existsSync(configPath)) {
  config = require(configPath);
} else if (opts.config !== CONFIG_PATH) {
  console.log('error: Config not found ' + configPath);
  process.exit(1);
}

const filePaths = new Array<string>().concat(...opts.includes.map((include: string) => glob.sync(include, {cwd: rootDir})));

if (!filePaths.length) {
  console.log('error: No files to compile');
  process.exit(1);
}

const translationsByLocale = createMap();

for (const filePath of filePaths) {
  translationsByLocale[path.basename(filePath).replace(/\.[^.]*$/, '')] = require(path.resolve(rootDir, filePath));
}

const messageGroups = parseMessageGroups(translationsByLocale, {
  splitTranslationKey: (key) => {
    const i = key.indexOf('.');
    return i === -1 ? ['default', key] : [key.substr(0, i), key.substr(i + 1)];
  },
});

const fileMap = compileModuleGroups(messageGroups, config);

for (const [filePath0, src] of Object.entries(fileMap)) {
  const filePath = path.resolve(outDir, filePath0);

  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, src + '\n', {encoding: 'utf8'});
}
