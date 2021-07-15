export function die(message: string): never {
  throw new Error(message);
}

export function dieAtOffset(offset: number): never {
  throw new SyntaxError('Unexpected token at ' + offset);
}

export function createMap<T = any>(): Record<string, T> {
  return Object.create(null);
}

export function identity<T>(value: T): T {
  return value;
}
