/**
 * Returns the index of `value` among `caseKeys`.
 */
export function matchSelect(value: unknown, ...caseKeys: Array<string>): number;

export function matchSelect(value: unknown): number {
  for (let i = 1; i < arguments.length; ++i) {
    if (arguments[i] === value) {
      return i - 1;
    }
  }
  return -1;
}
