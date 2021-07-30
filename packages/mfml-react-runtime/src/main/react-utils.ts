import React from 'react';

export function isReactNode(value: unknown): value is React.ReactNode {
  return typeof value === 'string'
      || typeof value === 'number'
      || typeof value === 'object' && React.isValidElement(value);
}
