import { describe, expect, test } from 'vitest';
import { isLowerCaseAlpha } from '../main/utils.js';

describe('isLowerCaseAlpha', () => {
  test('returns true if text is ASCII lowercase alpha', () => {
    expect(isLowerCaseAlpha('aaa')).toBe(true);
    expect(isLowerCaseAlpha('AAA')).toBe(false);
    expect(isLowerCaseAlpha('Aaa')).toBe(false);
    expect(isLowerCaseAlpha('ффф')).toBe(false);
    expect(isLowerCaseAlpha('aaф')).toBe(false);
  });
});
