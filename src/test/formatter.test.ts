import { expect, test } from 'vitest';
import { defaultArgumentFormatter } from '../main/index.js';

test('formats without type', () => {
  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: null,
      style: null,
      value: 'aaa',
    })
  ).toBe('aaa');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: null,
      style: null,
      value: ['aaa', 'bbb', 'ccc'],
    })
  ).toStrictEqual(['aaa', 'bbb', 'ccc']);

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: null,
      style: null,
      value: 111222.111,
    })
  ).toBe('111,222.111');
});

test('formats number', () => {
  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'number',
      style: null,
      value: 111222.111,
    })
  ).toBe('111,222.111');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'number',
      style: 'decimal',
      value: 111,
    })
  ).toBe('111');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'number',
      style: 'integer',
      value: 111.111,
    })
  ).toBe('111');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'number',
      style: 'percent',
      value: 111,
    })
  ).toBe('11,100%');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'number',
      style: 'currency',
      value: 111,
    })
  ).toBe('$111.00');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: { currency: 'RUB' },
      type: 'number',
      style: 'currency',
      value: 111,
    })
  ).toBe('RUB 111.00');
});

test('formats date', () => {
  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'date',
      style: null,
      value: 111,
    })
  ).toBe('1/1/1970');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'date',
      style: 'short',
      value: 111,
    })
  ).toBe('1/1/70');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'date',
      style: 'full',
      value: 111,
    })
  ).toBe('Thursday, January 1, 1970');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'date',
      style: 'long',
      value: 111,
    })
  ).toBe('January 1, 1970');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'date',
      style: 'medium',
      value: 111,
    })
  ).toBe('Jan 1, 1970');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: { timeStyle: 'long' },
      type: 'date',
      style: 'medium',
      value: 111,
    })
  ).toBe('Jan 1, 1970, 12:00:00 AM UTC');
});

test('formats time', () => {
  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'time',
      style: null,
      value: 111,
    })
  ).toBe('12:00 AM');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: { hourCycle: 'h24' },
      type: 'time',
      style: null,
      value: 111,
    })
  ).toBe('24:00');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'time',
      style: 'short',
      value: 111,
    })
  ).toBe('12:00 AM');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'time',
      style: 'full',
      value: 111,
    })
  ).toBe('12:00:00 AM Coordinated Universal Time');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'time',
      style: 'long',
      value: 111,
    })
  ).toBe('12:00:00 AM UTC');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'time',
      style: 'medium',
      value: 111,
    })
  ).toBe('12:00:00 AM');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: { dateStyle: 'long' },
      type: 'time',
      style: 'medium',
      value: 111,
    })
  ).toBe('January 1, 1970 at 12:00:00 AM');
});

test('formats conjunction list', () => {
  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'conjunction',
      style: null,
      value: ['aaa', 'bbb', 'ccc'],
    })
  ).toBe('aaa, bbb, and ccc');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'conjunction',
      style: 'long',
      value: ['aaa', 'bbb', 'ccc'],
    })
  ).toBe('aaa, bbb, and ccc');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'conjunction',
      style: 'narrow',
      value: ['aaa', 'bbb', 'ccc'],
    })
  ).toBe('aaa, bbb, ccc');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'conjunction',
      style: 'short',
      value: ['aaa', 'bbb', 'ccc'],
    })
  ).toBe('aaa, bbb, & ccc');
});

test('formats disjunction list', () => {
  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'disjunction',
      style: null,
      value: ['aaa', 'bbb', 'ccc'],
    })
  ).toBe('aaa, bbb, or ccc');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'disjunction',
      style: 'long',
      value: ['aaa', 'bbb', 'ccc'],
    })
  ).toBe('aaa, bbb, or ccc');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'disjunction',
      style: 'narrow',
      value: ['aaa', 'bbb', 'ccc'],
    })
  ).toBe('aaa, bbb, or ccc');

  expect(
    defaultArgumentFormatter({
      locale: 'en',
      options: null,
      type: 'disjunction',
      style: 'short',
      value: ['aaa', 'bbb', 'ccc'],
    })
  ).toBe('aaa, bbb, or ccc');
});
