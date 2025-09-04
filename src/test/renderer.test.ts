import { expect, test } from 'vitest';
import { defaultCategorySelector } from '../main/index.js';
// import { AbstractRenderer } from '../main/createRenderer.js';
//
// class MockRenderer extends AbstractRenderer<string> {
//   renderText(_locale: string, text: string): string {
//     return text;
//   }
//
//   renderElement(_locale: string, _tagName: string, _attributes: Record<string, string>, _children: string[]): string {
//     return '';
//   }
// }
//
// const mockRenderer = new MockRenderer();
//
// test('renders date', () => {
//   expect(mockRenderer.formatArgument('ru', 0, 'date', undefined)).toBe('01.01.1970');
// });
//
// test('renders date with style', () => {
//   expect(
//     new MockRenderer({
//       dateStyles: { xxx: { dateStyle: 'long' } },
//     }).formatArgument('ru', 0, 'date', 'xxx')
//   ).toBe('1 января 1970 г.');
// });
//
// test('renders time', () => {
//   expect(mockRenderer.formatArgument('ru', 0, 'time', undefined)).toBe('01.01.1970');
// });
//
// test('renders time with style', () => {
//   expect(
//     new MockRenderer({
//       timeStyles: { xxx: { timeStyle: 'long' } },
//     }).formatArgument('ru', 0, 'time', 'xxx')
//   ).toBe('03:00:00 GMT+3');
// });
//
// test('renders number', () => {
//   expect(mockRenderer.formatArgument('ru', 111.222, 'number', undefined)).toBe('111,222');
// });
//
// test('renders number with style', () => {
//   expect(
//     new MockRenderer({
//       numberStyles: { xxx: { style: 'percent' } },
//     }).formatArgument('ru', 111.222, 'number', 'xxx')
//   ).toBe('11 122 %');
// });
//
// test('renders null and undefined as an empty string', () => {
//   expect(mockRenderer.formatArgument('ru', null, 'number', 'xxx')).toBe('');
//   expect(mockRenderer.formatArgument('ru', undefined, 'number', 'xxx')).toBe('');
// });
//
// test('renders unknown argument types as a string', () => {
//   expect(mockRenderer.formatArgument('ru', { toString: () => 'zzz' }, 'vvv', 'xxx')).toBe('zzz');
//   expect(mockRenderer.formatArgument('ru', 111.222, 'vvv', 'xxx')).toBe('111.222');
// });
//
test('selects plural category', () => {
  expect(
    defaultCategorySelector({
      locale: 'ru',
      value: 1,
      type: 'plural',
      categories: ['one', 'few', 'many', 'other'],
      options: null,
    })
  ).toBe('one');

  expect(
    defaultCategorySelector({
      locale: 'ru',
      value: 2,
      type: 'plural',
      categories: ['one', 'few', 'many', 'other'],
      options: null,
    })
  ).toBe('few');

  expect(
    defaultCategorySelector({
      locale: 'en',
      value: 2,
      type: 'plural',
      categories: ['one', 'few', 'many', 'other'],
      options: null,
    })
  ).toBe('other');
});

test('selects ordinal category', () => {
  expect(
    defaultCategorySelector({
      locale: 'ru',
      value: 2,
      type: 'selectordinal',
      categories: ['one', 'few', 'many', 'other'],
      options: null,
    })
  ).toBe('other');

  expect(
    defaultCategorySelector({
      locale: 'ru',
      value: 3,
      type: 'selectordinal',
      categories: ['one', 'few', 'many', 'other'],
      options: null,
    })
  ).toBe('other');

  expect(
    defaultCategorySelector({
      locale: 'en',
      value: 3,
      type: 'selectordinal',
      categories: ['one', 'few', 'many', 'other'],
      options: null,
    })
  ).toBe('few');
});

test('selects exact value', () => {
  expect(
    defaultCategorySelector({
      locale: 'ru',
      value: 2,
      type: 'selectordinal',
      categories: ['=2', 'one', 'few', 'many', 'other'],
      options: null,
    })
  ).toBe('=2');
});

test('selects a category', () => {
  expect(
    defaultCategorySelector({
      locale: 'ru',
      value: 'aaa',
      type: 'select',
      categories: ['aaa', 'bbb'],
      options: null,
    })
  ).toBe('aaa');

  expect(
    defaultCategorySelector({
      locale: 'ru',
      value: 'xxx',
      type: 'select',
      categories: ['aaa', 'bbb'],
      options: null,
    })
  ).toBe(undefined);

  expect(
    defaultCategorySelector({
      locale: 'ru',
      value: 'xxx',
      type: 'select',
      categories: ['aaa', 'bbb', 'other'],
      options: null,
    })
  ).toBe('other');
});
