import { expect, test } from 'vitest';
import { createReactDOMElementRenderer, parseStyleText } from '../../main/react/createReactDOMElementRenderer.js';
import { createElement } from 'react';

test('parses style text', () => {
  expect(parseStyleText('')).toStrictEqual({});
  expect(parseStyleText('aaa')).toStrictEqual({});
  expect(parseStyleText('aaa:bbb')).toStrictEqual({ aaa: 'bbb' });
  expect(parseStyleText('aaa:bbb ; ccc:ddd')).toStrictEqual({ aaa: 'bbb', ccc: 'ddd' });
  expect(parseStyleText('aaa:b/*bb ; ccc:d*/dd')).toStrictEqual({ aaa: 'bdd' });
  expect(parseStyleText('aa/*a:b*/bb')).toStrictEqual({});
  expect(parseStyleText('aa:/*a:b*/bb')).toStrictEqual({ aa: 'bb' });
  expect(parseStyleText('aa:/*a:b*/:bb')).toStrictEqual({ aa: ':bb' });
});

test('preserves var names', () => {
  expect(parseStyleText('--aaa-bbb-ccc : ddd')).toStrictEqual({ '--aaa-bbb-ccc': 'ddd' });
});

test('renames CSS properties to camel case', () => {
  expect(parseStyleText('aaa-bbb-ccc : ddd')).toStrictEqual({ aaaBbbCcc: 'ddd' });
  expect(parseStyleText('AAA-BBB-CCC : ddd')).toStrictEqual({ aaaBbbCcc: 'ddd' });
  expect(parseStyleText('-aaa-bbb-ccc : ddd')).toStrictEqual({ AaaBbbCcc: 'ddd' });
});

test('renders react elements', () => {
  const renderer = createReactDOMElementRenderer();

  expect(
    renderer('aaa', { class: 'zzz', style: 'xxx:yyy' }, [createElement('bbb'), createElement('ccc')])
  ).toStrictEqual(
    createElement('aaa', { className: 'zzz', style: { xxx: 'yyy' } }, createElement('bbb'), createElement('ccc'))
  );
});
