import { ReactNode } from 'react';
import { MessageNode } from '../ast.js';

// prettier-ignore
export type MessageProps<F extends (locale: string) => MessageNode | null> =
  F extends ((locale: string) => MessageNode<infer Values> | null) ? keyof Values extends never ? { message: F } : { message: F, values: Values } : never;

export function Message<F extends (locale: string) => MessageNode | null>(_props: MessageProps<F>): ReactNode {
  return null;
}
