import { expect, test } from 'vitest';
import { StringMessageRenderer } from '../main/index.js';

test('renders element children', () => {
  expect(new StringMessageRenderer().renderElement('en', 'xxx', {}, ['bbb'])).toBe('bbb');
  expect(new StringMessageRenderer().renderElement('en', 'xxx', {}, ['aaa', 'bbb'])).toBe('aaabbb');
});

test('does not render unknown custom components', () => {
  expect(new StringMessageRenderer().renderElement('en', 'Xxx', {}, ['bbb'])).toBe('');
});

test('renders custom components', () => {
  expect(
    new StringMessageRenderer({
      components: {
        Xxx: (_attributes, children) => 'zzz' + children,
      },
    }).renderElement('en', 'Xxx', {}, ['bbb'])
  ).toBe('zzzbbb');
});
