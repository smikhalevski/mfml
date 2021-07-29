import {exactMatchSelect, matchLocaleOrLanguage} from '../main/runtime-utils';

describe('matchLocaleOrLanguage', () => {

  test('matches exact locale', () => {
    expect(matchLocaleOrLanguage('en', ['en_US', 'en', 'ru'])).toBe(1);
    expect(matchLocaleOrLanguage('en_GB', ['en_US', 'en_GB', 'ru'])).toBe(1);
  });

  test('matches language-only locale first', () => {
    expect(matchLocaleOrLanguage('en_US', ['en_AU', 'en_GB', 'en', 'ru'])).toBe(2);
  });

  test('matches first locale with the same language', () => {
    expect(matchLocaleOrLanguage('en_US', ['pt', 'en_AU', 'en_GB', 'en_IN', 'ru'])).toBe(1);
  });

  test('returns -1 if no locale matched', () => {
    expect(matchLocaleOrLanguage('cz_CZ', ['pt', 'ru'])).toBe(-1);
  });
});

describe('exactMatchSelect', () => {

  test('matches exact case key', () => {
    expect(exactMatchSelect('bbb', 'aaa', 'bbb', 'ccc')).toBe(1);
  });

  test('returns -1 if no case key matched', () => {
    expect(exactMatchSelect('QQQ', 'aaa', 'bbb', 'ccc')).toBe(-1);
  });
});
