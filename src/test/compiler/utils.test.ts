import { describe, expect, test } from 'vitest';
import { truncateMessage } from '../../main/compiler/utils.js';

describe('truncateMessage', () => {
  test('truncates before a whitespace', () => {
    expect(truncateMessage('', 5)).toBe('');
    expect(truncateMessage('   ', 5)).toBe('   ');
    expect(truncateMessage('   ', 0)).toBe('   ');
    expect(truncateMessage('aaa bbb ccc', 5)).toBe('aaa…');
    expect(truncateMessage('aaa   bbb ccc', 10)).toBe('aaa   bbb…');
    expect(truncateMessage('   aaa   bbb ccc', 5)).toBe('   aaa…');
    expect(truncateMessage('   aaa   bbb ccc', 0)).toBe('   aaa…');
    expect(truncateMessage('aaa\nbbb ccc', 5)).toBe('aaa…');
    expect(truncateMessage('aaa\nbbb ccc', 8)).toBe('aaa\nbbb…');
  });
});
