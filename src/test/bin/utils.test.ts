import { describe, expect, test } from 'vitest';
import { formatError } from '../../main/bin/utils.js';

describe('formatError', () => {
  test('formats an error', () => {
    expect(formatError('')).toBe('');

    expect(formatError(new Error('aaa', { cause: new Error('bbb') }))).toBe('aaa\nCaused by: bbb');

    expect(formatError(new Error('aaa', { cause: new Error('bbb', { cause: new Error('ccc\nddd') }) }))).toBe(
      'aaa\nCaused by: bbb\nCaused by: ccc\nddd'
    );
  });
});
