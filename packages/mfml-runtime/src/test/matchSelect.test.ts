import {matchSelect} from '../main/matchSelect';

describe('matchSelect', () => {

  test('matches exact case key', () => {
    expect(matchSelect('bbb', 'aaa', 'bbb', 'ccc')).toBe(1);
  });

  test('returns -1 if no case key matched', () => {
    expect(matchSelect('QQQ', 'aaa', 'bbb', 'ccc')).toBe(-1);
  });
});
