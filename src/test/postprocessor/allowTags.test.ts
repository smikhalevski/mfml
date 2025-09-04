import { expect, test } from 'vitest';
import { createParser } from '../../main/parser/createParser.js';
import { htmlTokenizer, ParserError } from '../../main/parser/index.js';
import allowTags from '../../main/postprocessor/allowTags.js';

const parser = createParser({ tokenizer: htmlTokenizer });

test('does not throw if tag is allowed', () => {
  const text = '<aaa>';

  expect(() =>
    allowTags({ aaa: true })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).not.toThrow();
});

test('does not throw if any attributes are allowed', () => {
  const text = '<aaa bbb="ccc" xxx="zzz">';

  expect(() =>
    allowTags({ aaa: true })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).not.toThrow();
});

test('throws if tag is not listed', () => {
  const text = '<aaa><bbb>';

  expect(() =>
    allowTags({ bbb: true })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(new AggregateError([new ParserError('The tag "aaa" is not allowed.', text, 1, 4)]));
});

test('throws if multiple tags are not listed', () => {
  const text = '<aaa><bbb><ccc>';

  expect(() =>
    allowTags({ bbb: true })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(
    new AggregateError([
      new ParserError('The tag "aaa" is not allowed.', text, 1, 4),
      new ParserError('The tag "ccc" is not allowed.', text, 11, 14),
    ])
  );
});

test('throws if an attribute is not listed', () => {
  const text = '<aaa bbb="ccc" xxx="zzz">';

  expect(() =>
    allowTags({ aaa: ['bbb'] })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(
    new AggregateError([new ParserError('The attribute "xxx" is not allowed for the tag "aaa".', text, 15, 18)])
  );
});

test('throws if multiple attributes is not listed', () => {
  const text = '<aaa bbb="ccc" xxx="zzz">';

  expect(() =>
    allowTags({ aaa: [] })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(
    new AggregateError([
      new ParserError('The attribute "bbb" is not allowed for the tag "aaa".', text, 5, 8),
      new ParserError('The attribute "xxx" is not allowed for the tag "aaa".', text, 15, 18),
    ])
  );
});

test('throws if tag is not allowed', () => {
  const text = '<aaa>';

  expect(() =>
    allowTags({ aaa: false })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(new AggregateError([new ParserError('The tag "aaa" is not allowed.', text, 1, 4)]));
});
