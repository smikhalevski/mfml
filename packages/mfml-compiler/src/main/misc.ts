export type Maybe<T> = T | null | undefined;

export function die(message: string, offset: number): never {
  throw new SyntaxError(message + ' at ' + offset);
}

export function createMap<T = any>(): Record<string, T> {
  return Object.create(null);
}

export function jsonStringify(value: any): string {
  return JSON.stringify(value);
}
