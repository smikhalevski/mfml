import { expect, test } from 'vitest';
import { renderText } from '../main/index.js';
import { parseMessage } from '../main/parser/index.js';

test('renders message as plain text', () => {
  expect(renderText(parseMessage('en', 'aaa <xxx>{bbb}</xxx>'), { bbb: 'zzz' })).toBe('aaa zzz');
});

test('does not throw if values were not provided', () => {
  expect(renderText(parseMessage('en', 'aaa <xxx>{bbb}</xxx>'), null!)).toBe('aaa ');
});

test('renders plural', () => {
  expect(renderText(parseMessage('en', 'aaa{bbb,plural,one{xxx}other{zzz}}'), { bbb: 2 })).toBe('aaazzz');
});
