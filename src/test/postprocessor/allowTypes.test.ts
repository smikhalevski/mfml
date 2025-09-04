import { expect, test } from 'vitest';
import { createParser } from '../../main/parser/createParser.js';
import { htmlTokenizer, ParserError } from '../../main/parser/index.js';
import allowTypes from '../../main/postprocessor/allowTypes.js';

const parser = createParser({ tokenizer: htmlTokenizer });

test('does not throw if there is no type', () => {
  const text = '{xxx}';

  expect(() =>
    allowTypes({})({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).not.toThrow();
});

test('throws if type is not allowed', () => {
  const text = '{xxx,yyy}';

  expect(() =>
    allowTypes({})({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(new AggregateError([new ParserError('The argument type "yyy" is not allowed.', text, 5, 8)]));
});

test('throws if type requires a style', () => {
  const text = '{xxx,yyy}';

  expect(() =>
    allowTypes({ yyy: { allowedStyles: ['zzz', 'vvv'], isStyleRequired: true } })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(new AggregateError([new ParserError('The argument type "yyy" requires a style: zzz, vvv.', text, 5, 8)]));
});

test('throws if type does not support styles', () => {
  const text = '{xxx,yyy,zzz}';

  expect(() =>
    allowTypes({ yyy: {} })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(new AggregateError([new ParserError('The argument type "yyy" does not support styles.', text, 5, 8)]));

  expect(() =>
    allowTypes({ yyy: { allowedStyles: [] } })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(new AggregateError([new ParserError('The argument type "yyy" does not support styles.', text, 5, 8)]));
});

test('throws if type does not allow options', () => {
  const text = '{xxx,yyy,zzz=vvv}';

  expect(() =>
    allowTypes({ yyy: {} })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(new AggregateError([new ParserError('The argument type "yyy" does not allow options.', text, 5, 8)]));

  expect(() =>
    allowTypes({ yyy: { allowedOptions: [] } })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(new AggregateError([new ParserError('The argument type "yyy" does not allow options.', text, 5, 8)]));
});

test('throws if option is not allowed', () => {
  const text = '{xxx,yyy, zzz=vvv ppp=kkk}';

  expect(() =>
    allowTypes({ yyy: { allowedOptions: ['ppp', 'qqq'] } })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(
    new AggregateError([
      new ParserError(
        'The option "zzz" is not allowed for argument type "yyy", expected one of: ppp, qqq.',
        text,
        10,
        13
      ),
    ])
  );
});

test('throws if type does not allow categories', () => {
  const text = '{xxx,yyy,zzz{vvv}}';

  expect(() =>
    allowTypes({ yyy: {} })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(new AggregateError([new ParserError('The argument type "yyy" does not allow categories.', text, 5, 8)]));

  expect(() =>
    allowTypes({ yyy: { allowedCategories: [] } })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(new AggregateError([new ParserError('The argument type "yyy" does not allow categories.', text, 5, 8)]));
});

test('throws if type requires a category', () => {
  const text = '{xxx,yyy}';

  expect(() =>
    allowTypes({ yyy: { allowedCategories: ['zzz', 'vvv'], isCategoryRequired: true } })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(
    new AggregateError([
      new ParserError('The argument type "yyy" requires at least one category: zzz, vvv.', text, 5, 8),
    ])
  );
});

test('throws if category is not allowed', () => {
  const text = '{xxx,yyy, zzz{vvv} ppp{kkk}}';

  expect(() =>
    allowTypes({ yyy: { allowedCategories: ['ppp', 'qqq'] } })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(
    new AggregateError([
      new ParserError(
        'The category "zzz" is not allowed for argument type "yyy", expected one of: ppp, qqq.',
        text,
        10,
        13
      ),
    ])
  );
});

test('throws if a required category is missing', () => {
  const text = '{xxx,yyy, ppp{kkk}}';

  expect(() =>
    allowTypes({ yyy: { allowedCategories: ['ppp', 'qqq', 'vvv'], requiredCategories: ['qqq', 'vvv'] } })({
      text,
      locale: 'en',
      messageKey: 'xxx',
      messageNode: parser.parse('en', text),
    })
  ).toThrow(
    new AggregateError([new ParserError('The argument type "yyy" requires categories: qqq, vvv.', text, 5, 8)])
  );
});
