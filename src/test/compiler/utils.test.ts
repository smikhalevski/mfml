import { describe, expect, test } from 'vitest';
import { escapeIdentifier } from '../../main/utils.js';

describe('escapeIdentifier', () => {
  test('replaces illegal characters with an underscore', () => {
    expect(escapeIdentifier('111')).toBe('_111');
    expect(escapeIdentifier('+=*')).toBe('___');
    expect(escapeIdentifier('hello')).toBe('hello');
  });

  test('prepends underscore to reserved characters', () => {
    expect(escapeIdentifier('break')).toBe('_break');
  });
});
