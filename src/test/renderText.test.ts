import { expect, test } from 'vitest';
import { renderText } from '../main/index.js';
import { parseMessage } from '../main/parser/index.js';

test('collapses spaces by default', () => {
  expect(renderText(parseMessage('en', '   aaa   bbb   '), undefined)).toBe(' aaa bbb ');
});

test('renders message as plain text', () => {
  expect(renderText(parseMessage('en', 'aaa <xxx>{bbb}</xxx>'), { bbb: 'zzz' })).toBe('aaa zzz');
});

test('does not throw if values were not provided', () => {
  expect(renderText(parseMessage('en', 'aaa <xxx>{bbb}</xxx>'), null!)).toBe('aaa ');
});

test('renders paragraphs', () => {
  expect(renderText(parseMessage('en', '<p>aaa</p><p>bbb</p>'), undefined)).toBe('aaa\n\nbbb\n\n');
});

test('renders headers', () => {
  expect(renderText(parseMessage('en', '<h1>aaa</h1>'), undefined)).toBe('aaa\n\n');
  expect(renderText(parseMessage('en', '<h2>aaa</h2>'), undefined)).toBe('aaa\n\n');
  expect(renderText(parseMessage('en', '<h3>aaa</h3>'), undefined)).toBe('aaa\n\n');
  expect(renderText(parseMessage('en', '<h4>aaa</h4>'), undefined)).toBe('aaa\n\n');
  expect(renderText(parseMessage('en', '<h5>aaa</h5>'), undefined)).toBe('aaa\n\n');
  expect(renderText(parseMessage('en', '<h6>aaa</h6>'), undefined)).toBe('aaa\n\n');
});

test('renders line breaks', () => {
  expect(renderText(parseMessage('en', 'aaa<br></br>bbb'), undefined)).toBe('aaa\nbbb');
});

test('renders plural', () => {
  expect(renderText(parseMessage('en', 'aaa{bbb,plural,one{xxx}other{zzz}}'), { bbb: 2 })).toBe('aaazzz');
});
