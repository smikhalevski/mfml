import { expect, test } from 'vitest';
import { MessageNode, renderToString } from '../main/index.js';
import { parseMessage } from '../main/parser/createParser.js';
import { createTokenizer } from '../main/parser/index.js';

const tokenizer = createTokenizer();

test('renders message as plain text', () => {
  const messageNode = parseMessage('en', 'aaa <xxx>{bbb}</xxx>', { tokenizer });

  expect(renderToString({ message: () => messageNode, locale: 'en', values: { bbb: 'zzz' } })).toBe('aaa zzz');
});

test('does not throw if values were not provided', () => {
  const messageNode = parseMessage('en', 'aaa <xxx>{bbb}</xxx>', { tokenizer });

  expect(renderToString({ message: () => messageNode, locale: 'en' })).toBe('aaa ');
});

test('renders plural', () => {
  const messageNode: MessageNode<{ bbb: number }> = parseMessage('en', 'aaa{bbb,plural,one{xxx}other{zzz}}', {
    tokenizer,
  });

  expect(renderToString({ message: () => messageNode, locale: 'en', values: { bbb: 2 } })).toBe('aaazzz');
});
