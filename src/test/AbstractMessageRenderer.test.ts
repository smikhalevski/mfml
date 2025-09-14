import { expect, test } from 'vitest';
import { AbstractMessageRenderer } from '../main/AbstractMessageRenderer.js';

class MockMessageRenderer extends AbstractMessageRenderer<string> {
  renderElement(
    _locale: string,
    _tagName: string,
    _attributes: { readonly [name: string]: ReadonlyArray<string> | string },
    _children: ReadonlyArray<string> | string
  ): string {
    return '';
  }
}

const mockMessageRenderer = new MockMessageRenderer();

test('renders date', () => {
  expect(mockMessageRenderer.renderArgumentValue('ru', 0, 'date', undefined)).toBe('01.01.1970');
});

test('renders date with style', () => {
  expect(
    new MockMessageRenderer({
      dateStyles: { xxx: { dateStyle: 'long' } },
    }).renderArgumentValue('ru', 0, 'date', 'xxx')
  ).toBe('1 января 1970 г.');
});

test('renders time', () => {
  expect(mockMessageRenderer.renderArgumentValue('ru', 0, 'time', undefined)).toBe('01.01.1970');
});

test('renders time with style', () => {
  expect(
    new MockMessageRenderer({
      timeStyles: { xxx: { timeStyle: 'long' } },
    }).renderArgumentValue('ru', 0, 'time', 'xxx')
  ).toBe('03:00:00 GMT+3');
});

test('renders number', () => {
  expect(mockMessageRenderer.renderArgumentValue('ru', 111.222, 'number', undefined)).toBe('111,222');
});

test('renders number with style', () => {
  expect(
    new MockMessageRenderer({
      numberStyles: { xxx: { style: 'percent' } },
    }).renderArgumentValue('ru', 111.222, 'number', 'xxx')
  ).toBe('11 122 %');
});

test('renders null and undefined as an empty string', () => {
  expect(mockMessageRenderer.renderArgumentValue('ru', null, 'number', 'xxx')).toBe('');
  expect(mockMessageRenderer.renderArgumentValue('ru', undefined, 'number', 'xxx')).toBe('');
});

test('renders unknown argument types as a string', () => {
  expect(mockMessageRenderer.renderArgumentValue('ru', { toString: () => 'zzz' }, 'vvv', 'xxx')).toBe('zzz');
  expect(mockMessageRenderer.renderArgumentValue('ru', 111.222, 'vvv', 'xxx')).toBe('111.222');
});

test('selects plural category', () => {
  expect(mockMessageRenderer.selectCategory('ru', 1, 'plural', ['one', 'few', 'many', 'other'])).toBe('one');
  expect(mockMessageRenderer.selectCategory('ru', 2, 'plural', ['one', 'few', 'many', 'other'])).toBe('few');
  expect(mockMessageRenderer.selectCategory('en', 2, 'plural', ['one', 'few', 'many', 'other'])).toBe('other');
});

test('selects ordinal category', () => {
  expect(mockMessageRenderer.selectCategory('ru', 2, 'selectordinal', ['one', 'few', 'many', 'other'])).toBe('other');
  expect(mockMessageRenderer.selectCategory('ru', 3, 'selectordinal', ['one', 'few', 'many', 'other'])).toBe('other');
  expect(mockMessageRenderer.selectCategory('en', 3, 'selectordinal', ['one', 'few', 'many', 'other'])).toBe('few');
});
