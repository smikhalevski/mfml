/**
 * @vitest-environment jsdom
 */

import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Message } from '../../main/react/Message.js';
import React from 'react';
import { parseMessage } from '../../main/parser/createParser.js';
import { createTokenizer } from '../../main/parser/createTokenizer.js';

const tokenizer = createTokenizer();

test('renders a message node', () => {
  const message = (locale: string) => parseMessage(locale, 'aaa{bbb}', { tokenizer });

  const result = render(
    <Message
      message={message}
      values={{ bbb: 'zzz' }}
    />,
    { reactStrictMode: true }
  );

  expect(result.container.innerHTML).toBe('aaazzz');
});

test('renders nested elements', () => {
  const message = (locale: string) => parseMessage(locale, 'aaa<i><b>{bbb}</b></i>', { tokenizer });

  const result = render(
    <Message
      message={message}
      values={{ bbb: 'zzz' }}
    />,
    { reactStrictMode: true }
  );

  expect(result.container.innerHTML).toBe('aaa<i><b>zzz</b></i>');
});

test('re-renders nested elements when argument value is chaged', () => {
  const message = (locale: string) => parseMessage(locale, 'aaa<i><b>{bbb}</b></i>', { tokenizer });

  const result = render(
    <Message
      message={message}
      values={{ bbb: 'zzz' }}
    />,
    { reactStrictMode: true }
  );

  result.rerender(
    <Message
      message={message}
      values={{ bbb: 'vvv' }}
    />
  );

  expect(result.container.innerHTML).toBe('aaa<i><b>vvv</b></i>');
});

test('renders children array', () => {
  const message = (locale: string) => parseMessage(locale, '<i>aaa</i><b>bbb</b>', { tokenizer });

  const result = render(<Message message={message} />, { reactStrictMode: true });

  expect(result.container.innerHTML).toBe('<i>aaa</i><b>bbb</b>');
});

test('renders nested children array', () => {
  const message = (locale: string) => parseMessage(locale, '<a><i>aaa</i><b>bbb</b></a>', { tokenizer });

  const result = render(<Message message={message} />, { reactStrictMode: true });

  expect(result.container.innerHTML).toBe('<a><i>aaa</i><b>bbb</b></a>');
});

test('renders argument as a prop', () => {
  const message = (locale: string) => parseMessage(locale, '<a title="xxx{bbb}"></a>', { tokenizer });

  const result = render(
    <Message
      message={message}
      values={{ bbb: 'zzz' }}
    />,
    { reactStrictMode: true }
  );

  expect(result.container.innerHTML).toBe('<a title="xxxzzz"></a>');
});

test('re-renders an element if a props argument is changed', () => {
  const message = (locale: string) => parseMessage(locale, '<a title="xxx{bbb}"></a>', { tokenizer });

  const result = render(
    <Message
      message={message}
      values={{ bbb: 'zzz' }}
    />,
    { reactStrictMode: true }
  );

  result.rerender(
    <Message
      message={message}
      values={{ bbb: 'vvv' }}
    />
  );

  expect(result.container.innerHTML).toBe('<a title="xxxvvv"></a>');
});
