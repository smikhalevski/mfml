import { MessageNode } from './ast.js';
import { RenderingOptions } from './types.js';

/**
 * Renders message node as plain string.
 *
 * @example
 * renderPlainText(greeting('en-US'), { values: { name: 'Bob' } });
 *
 * @param _messageNode The message to render.
 * @param _options Rendering options.
 */
export function renderPlainText<Values extends object>(
  _messageNode: MessageNode<Values> | null,
  _options: RenderingOptions<string> & (keyof Values extends never ? unknown : { values: Values })
): string {
  return '';
}

// function renderChildren(
//   _children: Child[] | string | null,
//   options: RenderingOptions<string> & { values?: Record<string, unknown> }
// ): string {
//   return '';
// }
//
// function renderChild(
//   locale: string,
//   child: Child | string,
//   options: RenderingOptions<string> & { values?: Record<string, unknown> }
// ): string {
//   if (typeof child === 'string') {
//     return child;
//   }
//
//   if (child.nodeType === 'element') {
//     // options.renderTag(child.tagName, child.);
//     return renderChildren(child.children, options);
//   }
//
//   if (child.nodeType === 'argument') {
//     return options.values[child.name];
//   }
//
//   return '';
// }
