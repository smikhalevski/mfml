export function throwSyntaxError(offset: number): never {
  throw new SyntaxError('Unexpected token at ' + offset);
}
