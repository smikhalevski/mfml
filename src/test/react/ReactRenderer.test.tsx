import { expect, test } from 'vitest';
import { ReactRenderer } from '../../main/react/index.js';
import React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [name: string]: any;
    }
    interface IntrinsicAttributes {
      [name: string]: any;
    }
  }
}

test('renders element children', () => {
  expect(new ReactRenderer().renderElement('en', 'xxx', {}, 'bbb')).toStrictEqual(<xxx>{'bbb'}</xxx>);
  expect(new ReactRenderer().renderElement('en', 'xxx', {}, ['aaa', 'bbb'])).toStrictEqual(
    <xxx>
      {'aaa'}
      {'bbb'}
    </xxx>
  );
});

test('does not render unknown custom components', () => {
  expect(new ReactRenderer().renderElement('en', 'Xxx', {}, 'bbb')).toBe(null);
});

test('renders custom components', () => {
  const Xxx = () => 'zzz';

  expect(new ReactRenderer({ components: { Xxx } }).renderElement('en', 'Xxx', {}, 'bbb')).toStrictEqual(
    <Xxx>{'bbb'}</Xxx>
  );
});
