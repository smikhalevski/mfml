import { expect, test } from 'vitest';
import { StringRenderer } from '../main/index.js';

test('renders element children', () => {
  expect(new StringRenderer().renderElement('en', 'xxx', {}, ['bbb'])).toBe('bbb');
  expect(new StringRenderer().renderElement('en', 'xxx', {}, ['aaa', 'bbb'])).toBe('aaabbb');
});

test('does not render unknown custom components', () => {
  expect(new StringRenderer().renderElement('en', 'Xxx', {}, ['bbb'])).toBe('');
});

test('renders custom components', () => {
  expect(
    new StringRenderer({
      components: {
        Xxx: (_attributes, children) => 'zzz' + children,
      },
    }).renderElement('en', 'Xxx', {}, ['bbb'])
  ).toBe('zzzbbb');
});
