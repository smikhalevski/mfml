import { expect, test } from 'vitest';
import { renderText } from '../main/index.js';
import { parseMessage } from '../main/parser/createParser.js';
import { createTokenizer } from '../main/parser/index.js';

const tokenizer = createTokenizer();

test('renders message as plain text', () => {
  expect(renderText(parseMessage('en', 'aaa <xxx>{bbb}</xxx>', { tokenizer }), { bbb: 'zzz' })).toBe('aaa zzz');
});

test('does not throw if values were not provided', () => {
  expect(renderText(parseMessage('en', 'aaa <xxx>{bbb}</xxx>', { tokenizer }), null!)).toBe('aaa ');
});

test('renders plural', () => {
  expect(renderText(parseMessage('en', 'aaa{bbb,plural,one{xxx}other{zzz}}', { tokenizer }), { bbb: 2 })).toBe(
    'aaazzz'
  );
});
