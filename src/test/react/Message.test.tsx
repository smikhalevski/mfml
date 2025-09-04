/**
 * @vitest-environment jsdom
 */

import { expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Message, MessageRendererProvider } from '../../main/react/Message.js';
import React from 'react';
import { parseMessage } from '../../main/parser/createParser.js';
import { createTokenizer } from '../../main/parser/createTokenizer.js';
import { ReactRenderer } from '../../main/react/index.js';

const tokenizer = createTokenizer();

test('renders a message node', () => {
  const mockMessage = (locale: string) => parseMessage(locale, 'aaa{bbb}', { tokenizer });

  const result = render(
    <Message
      message={mockMessage}
      values={{ bbb: 'zzz' }}
    />,
    { reactStrictMode: true }
  );

  expect(result.container.innerHTML).toBe('aaazzz');
});

test('renders nested elements', () => {
  const mockMessage = (locale: string) => parseMessage(locale, 'aaa<i><b>{bbb}</b></i>', { tokenizer });

  const result = render(
    <Message
      message={mockMessage}
      values={{ bbb: 'zzz' }}
    />,
    { reactStrictMode: true }
  );

  expect(result.container.innerHTML).toBe('aaa<i><b>zzz</b></i>');
});

test('re-renders nested elements when argument value is chaged', () => {
  const mockMessage = (locale: string) => parseMessage(locale, 'aaa<i><b>{bbb}</b></i>', { tokenizer });

  const result = render(
    <Message
      message={mockMessage}
      values={{ bbb: 'zzz' }}
    />,
    { reactStrictMode: true }
  );

  result.rerender(
    <Message
      message={mockMessage}
      values={{ bbb: 'vvv' }}
    />
  );

  expect(result.container.innerHTML).toBe('aaa<i><b>vvv</b></i>');
});

test('renders children array', () => {
  const mockMessage = (locale: string) => parseMessage(locale, '<i>aaa</i><b>bbb</b>', { tokenizer });

  const result = render(<Message message={mockMessage} />, { reactStrictMode: true });

  expect(result.container.innerHTML).toBe('<i>aaa</i><b>bbb</b>');
});

test('renders nested children array', () => {
  const mockMessage = (locale: string) => parseMessage(locale, '<a><i>aaa</i><b>bbb</b></a>', { tokenizer });

  const result = render(<Message message={mockMessage} />, { reactStrictMode: true });

  expect(result.container.innerHTML).toBe('<a><i>aaa</i><b>bbb</b></a>');
});

test('renders argument as a prop', () => {
  const mockMessage = (locale: string) => parseMessage(locale, '<a title="xxx{bbb}"></a>', { tokenizer });

  const result = render(
    <Message
      message={mockMessage}
      values={{ bbb: 'zzz' }}
    />,
    { reactStrictMode: true }
  );

  expect(result.container.innerHTML).toBe('<a title="xxxzzz"></a>');
});

test('re-renders an element if a props argument is changed', () => {
  const mockMessage = (locale: string) => parseMessage(locale, '<a title="xxx{bbb}"></a>', { tokenizer });

  const result = render(
    <Message
      message={mockMessage}
      values={{ bbb: 'zzz' }}
    />,
    { reactStrictMode: true }
  );

  result.rerender(
    <Message
      message={mockMessage}
      values={{ bbb: 'vvv' }}
    />
  );

  expect(result.container.innerHTML).toBe('<a title="xxxvvv"></a>');
});

test('renders elements with a context renderer', () => {
  const mockMessage = (locale: string) => parseMessage(locale, 'aaa<i><b>{bbb}</b></i>', { tokenizer });

  const result = render(
    <MessageRendererProvider
      value={
        new ReactRenderer({
          components: {
            i: props => props.children,
            b: props => props.children,
          },
        })
      }
    >
      <Message
        message={mockMessage}
        values={{ bbb: 'zzz' }}
      />
    </MessageRendererProvider>,
    { reactStrictMode: true }
  );

  expect(result.container.innerHTML).toBe('aaazzz');
});

test('renders elements with a custom renderer', () => {
  const mockMessage = (locale: string) => parseMessage(locale, 'aaa<i><b>{bbb}</b></i>', { tokenizer });

  const result = render(
    <Message
      message={mockMessage}
      values={{ bbb: 'zzz' }}
      renderer={
        new ReactRenderer({
          components: {
            i: props => props.children,
            b: props => props.children,
          },
        })
      }
    />,
    { reactStrictMode: true }
  );

  expect(result.container.innerHTML).toBe('aaazzz');
});
