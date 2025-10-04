import { describe, expect, test } from 'vitest';
import { escapeJSIdentifier, toHashCode, truncateMessage } from '../../main/compiler/utils.js';

describe('toHashCode', () => {
  test('generates hash code', async () => {
    await expect(toHashCode('aaa', 16)).resolves.toBe('9834876dcfb05cb1');
    await expect(toHashCode('aaa', 8)).resolves.toBe('9834876d');
    await expect(toHashCode('bbb', 4)).resolves.toBe('3e74');
  });
});

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

describe('escapeJSIdentifier', () => {
  test('replaces illegal characters with an underscore', () => {
    expect(escapeJSIdentifier('111')).toBe('_111');
    expect(escapeJSIdentifier('+👯‍♀️=*')).toBe('____️__');
    expect(escapeJSIdentifier('❌')).toBe('_');
    expect(escapeJSIdentifier('+=*')).toBe('___');
    expect(escapeJSIdentifier('hello')).toBe('hello');
  });

  test('prepends underscore to reserved characters', () => {
    expect(escapeJSIdentifier('break')).toBe('_break');
  });
});
