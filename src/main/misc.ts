export function die(offset: number): never {
  throw new SyntaxError('Unexpected token at ' + offset);
}

export function identity<T>(value: T): T {
  return value;
}
