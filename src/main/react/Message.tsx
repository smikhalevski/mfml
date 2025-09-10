import React, { Component, createContext, ReactNode, useMemo } from 'react';
import { MessageNode } from '../ast.js';
import { useLocale } from './useLocale.js';

const MessageValuesContext = createContext<Record<string, unknown> | undefined>(undefined);

// prettier-ignore
export type MessageProps<F extends (locale: string) => MessageNode | null> =
  F extends ((locale: string) => MessageNode<infer Values> | null) ? keyof Values extends never ? { message: F, values?: never } : { message: F, values: Values } : never;

export function Message<F extends (locale: string) => MessageNode | null>(props: MessageProps<F>): ReactNode {
  const { message, values } = props;
  const locale = useLocale();

  const messageNode = useMemo(() => message(locale), [message, locale]);

  if (messageNode === null) {
    return null;
  }

  if (typeof messageNode.children === 'string') {
    return messageNode.children;
  }

  return (
    <MessageValuesContext.Provider value={values}>
      <MessageRerender messageNode={messageNode} />
    </MessageValuesContext.Provider>
  );
}

class MessageRerender extends Component<{ messageNode: MessageNode }> {
  shouldComponentUpdate(): boolean {
    return false;
  }

  render() {
    return null;
  }
}
