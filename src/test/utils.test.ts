import { describe, expect, test, vi } from 'vitest';
import { getMessageNodeOrFallback, isLowerCaseAlpha } from '../main/utils.js';
import { createMessageNode } from '../main/index.js';

describe('isLowerCaseAlpha', () => {
  test('returns true if text is ASCII lowercase alpha', () => {
    expect(isLowerCaseAlpha('aaa')).toBe(true);
    expect(isLowerCaseAlpha('AAA')).toBe(false);
    expect(isLowerCaseAlpha('Aaa')).toBe(false);
    expect(isLowerCaseAlpha('ффф')).toBe(false);
    expect(isLowerCaseAlpha('aaф')).toBe(false);
  });
});

describe('getMessageNodeOrFallback', () => {
  test('returns message for locale', () => {
    const messageNode = createMessageNode('a');

    expect(getMessageNodeOrFallback(vi.fn().mockReturnValueOnce(messageNode), 'aaa', undefined)).toBe(messageNode);
    expect(getMessageNodeOrFallback(vi.fn().mockReturnValueOnce(messageNode), 'aaa', {})).toBe(messageNode);
  });

  test('returns message for fallback locale', () => {
    const messageNode = createMessageNode('a');

    expect(
      getMessageNodeOrFallback(vi.fn().mockReturnValueOnce(null).mockReturnValueOnce(messageNode), 'aaa', {
        aaa: 'bbb',
      })
    ).toBe(messageNode);
  });

  test('returns message for secondary fallback locale', () => {
    const messageNode = createMessageNode('a');

    expect(
      getMessageNodeOrFallback(
        vi.fn().mockReturnValueOnce(null).mockReturnValueOnce(null).mockReturnValueOnce(messageNode),
        'aaa',
        { aaa: 'bbb', bbb: 'ccc' }
      )
    ).toBe(messageNode);
  });

  test('returns null if no message for a fallback locale', () => {
    expect(
      getMessageNodeOrFallback(vi.fn().mockReturnValueOnce(null).mockReturnValueOnce(null), 'aaa', { aaa: 'bbb' })
    ).toBe(null);
  });

  test('prevents infinite loop', () => {
    expect(getMessageNodeOrFallback(vi.fn().mockReturnValue(null), 'aaa', { aaa: 'bbb', bbb: 'aaa' })).toBe(null);
  });
});
