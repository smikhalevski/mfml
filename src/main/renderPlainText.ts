import { MessageNode } from './ast.js';

/**
 * Renders message node as plain string. HTML tags are ignored.
 *
 * @param messageNode The message to render.
 */
export function renderPlainText(messageNode: MessageNode<{}> | null): string;

/**
 * Renders message node as plain string. HTML tags are ignored.
 *
 * @param messageNode The message to render.
 * @param values Values to substitute as ICU arguments.
 */
export function renderPlainText<Values extends object>(messageNode: MessageNode<Values> | null, values: Values): string;

export function renderPlainText(_messageNode: MessageNode | null, _values?: Record<string, string>): string {
  return '';
}

// function renderChildren(_children: Child[] | string | null, values: Record<string, string> | undefined): string {
//   return '';
// }
//
// function renderChild(locale: string, child: Child | string, values: Record<string, string> | undefined): string {
//   if (typeof child === 'string') {
//     return child;
//   }
//
//   if (child.nodeType === 'element') {
//     return renderChildren(child.children, values);
//   }
//
//   if (child.nodeType === 'argument') {
//     return values === undefined || values[child.name] === undefined ? '' : values[child.name];
//   }
//
//   if (child.nodeType === 'select') {
//     // new Intl.PluralRules(locale, { type: child.type === '' 'cardinal' }).select();
//     // return values === undefined || values[child.argumentName] === undefined ? '' : values[child.name];
//   }
//
//   return '';
// }
