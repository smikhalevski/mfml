import {selectMatcher} from '../main/selectMatcher';

describe('selectMatcher', () => {

  test('matches exact case key', () => {
    expect(selectMatcher('bbb', 'aaa', 'bbb', 'ccc')).toBe(1);
  });

  test('returns -1 if no case key matched', () => {
    expect(selectMatcher('QQQ', 'aaa', 'bbb', 'ccc')).toBe(-1);
  });
});
