import {defaults, isArray, isString, withoutExtension} from '../main/misc';

describe('defaults', () => {

  test('does not reassign defined fields', () => {
    expect(defaults({foo: 'aaa'}, {foo: 'bbb', bar: 'ccc'})).toEqual({foo: 'aaa', bar: 'ccc'});
    expect(defaults({foo: null}, {foo: 'bbb', bar: 'ccc'})).toEqual({foo: null, bar: 'ccc'});
  });

  test('reassigns undefined fields', () => {
    expect(defaults({foo: undefined}, {foo: 'bbb', bar: 'ccc'})).toEqual({foo: 'bbb', bar: 'ccc'});
  });
});

describe('isArray', () => {

  test('tests arrays', () => {
    expect(isArray('')).toBe(false);
    expect(isArray([])).toBe(true);
  });

  test('tests arrays with typed elements', () => {
    expect(isArray('', isString)).toBe(false);
    expect(isArray([], isString)).toBe(true);
    expect(isArray([1], isString)).toBe(false);
    expect(isArray([''], isString)).toBe(true);
  });
});

describe('withoutExtension', () => {

  test('removes extension from the file path', () => {
    expect(withoutExtension('/foo/bar.ext')).toBe('/foo/bar');
    expect(withoutExtension('/foo/bar')).toBe('/foo/bar');
  });
});
