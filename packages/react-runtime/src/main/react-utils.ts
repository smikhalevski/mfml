import {isValidElement, ReactNode} from 'react';

export function isReactNode(value: unknown): value is ReactNode {
  return typeof value === 'string'
      || typeof value === 'number'
      || typeof value === 'object' && isValidElement(value);
}
