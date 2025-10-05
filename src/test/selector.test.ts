import { expect, test } from 'vitest';
import { defaultCategorySelector } from '../main/index.js';

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
      type: 'selectOrdinal',
      categories: ['one', 'few', 'many', 'other'],
      options: null,
    })
  ).toBe('other');

  expect(
    defaultCategorySelector({
      locale: 'ru',
      value: 3,
      type: 'selectOrdinal',
      categories: ['one', 'few', 'many', 'other'],
      options: null,
    })
  ).toBe('other');

  expect(
    defaultCategorySelector({
      locale: 'en',
      value: 3,
      type: 'selectOrdinal',
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
      type: 'selectOrdinal',
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
