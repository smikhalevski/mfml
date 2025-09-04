import { describe, expect, test } from 'vitest';
import { formatError } from '../../main/bin/utils.js';

describe('formatError', () => {
  test('formats an error', () => {
    expect(formatError('')).toBe('');

    expect(formatError(new Error('aaa', { cause: new Error('bbb') }))).toBe('aaa\n  Caused by: bbb');

    expect(formatError(new Error('aaa', { cause: new Error('bbb', { cause: new Error('ccc\nddd') }) }))).toBe(
      'aaa\n  Caused by: bbb\n    Caused by: ccc\n    ddd'
    );
  });
});
