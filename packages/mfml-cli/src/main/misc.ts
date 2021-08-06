import chalk from 'chalk';
import path from 'path';
import fs from 'fs';

export const errorMessage = (error: unknown): unknown => error instanceof Error ? error.message : error != null ? error : '';

export const bold = (message: keyof any): string => chalk.bold(message);

export const formatFilePath = (filePath: string): string => {
  filePath = path.relative(process.cwd(), filePath);
  return bold(path.isAbsolute(filePath) ? filePath : '.' + path.sep + filePath);
};

export const fieldMessage = (name: keyof any, message: string) => bold(name) + ' ' + message;

export function assert(condition: unknown, message: string) {
  if (!condition) {
    die(message);
  }
}

export function assertString(value: unknown, name: keyof any): asserts value is string {
  assert(isString(value), fieldMessage(name, 'must be a string'));
}

export function assertFunction(value: unknown, name: keyof any): asserts value is Function {
  assert(isFunction(value), fieldMessage(name, 'must be a function'));
}

export function assertObject(value: unknown, name: keyof any): asserts value is object {
  assert(isObject(value), fieldMessage(name, 'must be an object'));
}

export function assertArray<T = any>(value: unknown, name: keyof any, elementChecker?: (value: unknown, index: number) => value is T): asserts value is Array<T> {
  assert(isArray(value, elementChecker), fieldMessage(name, 'must be an array'));
}

export function die(message: string, error?: any): never {
  let details = errorMessage(error);
  details = details ? ': ' + details : '';

  if (error instanceof Error) {
    error.message = message + details;
    throw error;
  }
  throw new Error(message + details);
}

export const createMap = <T>(): Record<string, T> => Object.create(null);

export const isString = (value: unknown): value is string => typeof value === 'string';

export const isObject = (value: unknown): value is object => value !== null && typeof value === 'object';

export const isFunction = (value: unknown): value is Function => typeof value === 'function';

export function isArray<T = any>(value: unknown, elementChecker?: (value: unknown, index: number) => value is T): value is Array<T> {
  return Array.isArray(value) && (!elementChecker || value.every(elementChecker));
}

export function defaults<T>(value: T, ...values: Array<T>): T {
  for (const otherValue of values) {
    for (const key in otherValue) {
      if (value[key] === undefined) {
        value[key] = otherValue[key];
      }
    }
  }
  return value;
}

export function resolvePathOrDie(modulePath: string, baseDirs: Array<string>, message: string) {
  if (!path.isAbsolute(modulePath)) {
    for (const baseDir of baseDirs) {
      try {
        return require.resolve(baseDir !== '.' && baseDir !== '' ? path.resolve(baseDir, modulePath) : '.' + path.sep + modulePath);
      } catch {
      }
    }
  }
  try {
    return require.resolve(modulePath, {paths: baseDirs});
  } catch {
    die(message);
  }
}

export function requireOrDie(modulePath: string, message: string) {
  try {
    return require(modulePath);
  } catch (error) {
    die(message, error);
  }
}

export function writeFileOrDie(filePath: string, source: string | Buffer, message: string): void {
  try {
    fs.mkdirSync(path.dirname(filePath), {recursive: true});
    fs.writeFileSync(filePath, source);
  } catch (error) {
    die(message, error);
  }
}

export function withoutExtension(filePath: string): string {
  return filePath.replace(/\.\w+$/, '');
}
