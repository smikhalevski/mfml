import { Child, MessageNode } from './ast.js';
import { StringMessageRenderer } from './StringMessageRenderer.js';
import { MessageRenderer } from './types.js';

const defaultStringMessageRenderer = new StringMessageRenderer({
  dateStyles: {
    short: { dateStyle: 'short' },
    full: { dateStyle: 'full' },
    long: { dateStyle: 'long' },
    medium: { dateStyle: 'medium' },
  },
  timeStyles: {
    short: { timeStyle: 'short' },
    full: { timeStyle: 'full' },
    long: { timeStyle: 'long' },
    medium: { timeStyle: 'medium' },
  },
  numberStyles: {
    decimal: { style: 'decimal' },
    percent: { style: 'percent' },
  },
});

/**
 * Renders message node as plain text string.
 *
 * @example
 * renderText(greeting('en-US'), { name: 'Bob' });
 *
 * @param messageNode The message to render.
 * @param values Message argument values.
 * @param renderer The message renderer.
 */
export function renderText<Values extends object | void>(
  messageNode: MessageNode<Values> | null,
  values: Values,
  renderer: MessageRenderer<string> = defaultStringMessageRenderer
): string {
  if (messageNode === null) {
    return '';
  }

  return renderChildrenAsString(messageNode.locale, messageNode.children, values, renderer).join('');
}

export function renderChildrenAsString(
  locale: string,
  children: Child[] | string | null,
  values: any,
  renderer: MessageRenderer<string>
): string[] {
  if (children === null) {
    return [];
  }

  const result = [];

  for (let i = 0; i < children.length; ++i) {
    result.push(renderChild(locale, children[i], values, renderer));
  }

  return result;
}

function renderChild(locale: string, child: Child | string, values: any, renderer: MessageRenderer<string>): string {
  if (typeof child === 'string') {
    return child;
  }

  if (child.nodeType === 'element') {
    const attributes: Record<string, string> = {};

    if (child.attributes !== null) {
      for (const key in child.attributes) {
        attributes[key] = renderChildrenAsString(locale, child.attributes[key], values, renderer).join('');
      }
    }

    return renderer.renderElement(
      locale,
      child.tagName,
      attributes,
      renderChildrenAsString(locale, child.children, values, renderer)
    );
  }

  if (child.nodeType === 'argument') {
    return renderer.formatArgument(locale, values && values[child.name], child.type, child.style);
  }

  if (child.nodeType === 'select') {
    const category = renderer.selectCategory(
      locale,
      values && values[child.argumentName],
      child.type,
      Object.keys(child.categories)
    );

    return category === undefined
      ? ''
      : renderChildrenAsString(locale, child.categories[category], values, renderer).join('');
  }

  return '';
}
