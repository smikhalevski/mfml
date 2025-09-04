import { describe, expect, test } from 'vitest';
import { formatMessagePreview } from '../../main/compiler/utils.js';

describe('formatMessagePreview', () => {
  test('wraps text', () => {
    expect(formatMessagePreview('   aaa bbb ccc', 5)).toBe('aaa\nbbb\nccc');
    expect(formatMessagePreview('aaa bbb ccc   ', 5)).toBe('aaa\nbbb\nccc');
    expect(formatMessagePreview('aaa bbb ccc   ', 7)).toBe('aaa bbb\nccc');
    expect(formatMessagePreview('   aaa    bbb ccc   ', 7)).toBe('aaa\nbbb ccc');
    expect(formatMessagePreview('aaa bbb ccc', 5)).toBe('aaa\nbbb\nccc');
    expect(formatMessagePreview('aaa bbb ccc', 6)).toBe('aaa bbb\nccc');
    expect(formatMessagePreview('aaa   bbb ccc', 6)).toBe('aaa\nbbb ccc');
    expect(formatMessagePreview('aaa   bbb ccc', 9)).toBe('aaa   bbb\nccc');
    expect(formatMessagePreview('aaa   bbb ccc', 10)).toBe('aaa   bbb\nccc');
    expect(formatMessagePreview('aaa   bbb ccc', 11)).toBe('aaa   bbb\nccc');
    expect(formatMessagePreview('aaabbb ccc', 5)).toBe('aaabbb\nccc');
    expect(formatMessagePreview('aaabbb   ccc', 5)).toBe('aaabbb\nccc');
    expect(formatMessagePreview('aaa bbbccc', 5)).toBe('aaa\nbbbccc');
    expect(formatMessagePreview('aaa   bbbccc', 5)).toBe('aaa\nbbbccc');
  });

  test('strips spaces from short text', () => {
    expect(formatMessagePreview('', 100)).toBe('');
    expect(formatMessagePreview('   ', 100)).toBe('');
    expect(formatMessagePreview('   aaa bbb ccc', 100)).toBe('aaa bbb ccc');
    expect(formatMessagePreview('   aaa bbb ccc   ', 100)).toBe('aaa bbb ccc');
  });

  test('preserves line breaks', () => {
    expect(formatMessagePreview('aaa\nbbb ccc', 100)).toBe('aaa\nbbb ccc');
    expect(formatMessagePreview('aaa bbb\nccc', 5)).toBe('aaa\nbbb\nccc');
    expect(formatMessagePreview('aaa bbb   \n   ccc', 5)).toBe('aaa\nbbb\nccc');
    expect(formatMessagePreview('aaa bbb   \n   ccc', 6)).toBe('aaa bbb\nccc');
    expect(formatMessagePreview('   aaa bbb   \n   ccc', 6)).toBe('aaa bbb\nccc');
    expect(formatMessagePreview('aaa    bbb   \n   ccc', 5)).toBe('aaa\nbbb\nccc');
    expect(formatMessagePreview('aaa\n\nbbb', 5)).toBe('aaa\n\nbbb');
    expect(formatMessagePreview('aaa\n\nbbb\n\n', 5)).toBe('aaa\n\nbbb…');
    expect(formatMessagePreview('aaa\n\nbbb\n\n   ', 5)).toBe('aaa\n\nbbb…');
    expect(formatMessagePreview('aaa\n\nbbb   \n\n', 5)).toBe('aaa\n\nbbb…');
    expect(formatMessagePreview('aaa\n\nbbb   \n\n   ', 5)).toBe('aaa\n\nbbb…');
    expect(formatMessagePreview('aaa\n\n   bbb   \n\n   ', 5)).toBe('aaa\n\nbbb…');
  });

  test('respects line count', () => {
    expect(formatMessagePreview('aaa bbb ccc', 3, 2)).toBe('aaa\nbbb…');
    expect(formatMessagePreview('aaa bbb ccc ddd', 5, 2)).toBe('aaa\nbbb…');
    expect(formatMessagePreview('aaa bbb ccc ddd', 7, 2)).toBe('aaa bbb\nccc ddd');
    expect(formatMessagePreview('aaa bbb ccc ddd   ', 7, 2)).toBe('aaa bbb\nccc ddd');
    expect(formatMessagePreview('aaa bbb ccc   ddd', 7, 2)).toBe('aaa bbb\nccc…');
    expect(formatMessagePreview('   aaa bbb ccc   ddd', 7, 2)).toBe('aaa bbb\nccc…');
    expect(formatMessagePreview('aaa   bbb ccc   ddd', 7, 2)).toBe('aaa\nbbb ccc…');
  });
});
