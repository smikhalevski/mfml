/**
 * @vitest-environment jsdom
 */

import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Message } from '../../main/react/index.js';
import { parseMessage } from '../../main/parser/index.js';
import React, { StrictMode } from 'react';

test('renders a message node', () => {
  const message = (locale: string) => parseMessage(locale, 'aaa{bbb}');

  const result = render(
    <Message
      message={message}
      values={{ bbb: 'zzz' }}
    />,
    { wrapper: StrictMode }
  );

  expect(result.container.innerHTML).toBe('aaazzz');
});

test('renders nested elements', () => {
  const message = (locale: string) => parseMessage(locale, 'aaa<i><b>{bbb}</b></i>');

  const result = render(
    <Message
      message={message}
      values={{ bbb: 'zzz' }}
    />,
    { wrapper: StrictMode }
  );

  expect(result.container.innerHTML).toBe('aaa<i><b>zzz</b></i>');
});

test('renders children array', () => {
  const message = (locale: string) => parseMessage(locale, '<i>aaa</i><b>bbb</b>');

  const result = render(<Message message={message} />, { wrapper: StrictMode });

  expect(result.container.innerHTML).toBe('<i>aaa</i><b>bbb</b>');
});

test('renders nested children array', () => {
  const message = (locale: string) => parseMessage(locale, '<a><i>aaa</i><b>bbb</b></a>');

  const result = render(<Message message={message} />, { wrapper: StrictMode });

  expect(result.container.innerHTML).toBe('<a><i>aaa</i><b>bbb</b></a>');
});
