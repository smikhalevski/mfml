import { Child, MessageNode } from './ast.js';
import { defaultRendererOptions, Renderer, StringRenderer } from './renderer.js';

const defaultStringRenderer = new StringRenderer(defaultRendererOptions);

/**
 * Renders message node as plain string.
 *
 * @example
 * renderPlainText(greeting('en-US'), { name: 'Bob' });
 *
 * @param messageNode The message to render.
 * @param values Message argument values.
 * @param renderer The render delegate.
 */
export function renderPlainText<Values extends object | void>(
  messageNode: MessageNode<Values> | null,
  values: Values,
  renderer: Renderer<string> = defaultStringRenderer
): string {
  if (messageNode === null) {
    return '';
  }
  return renderChildren(messageNode.locale, messageNode.children, values, renderer);
}

function renderChildren(
  locale: string,
  children: Child[] | string | null,
  values: any,
  renderer: Renderer<string>
): string {
  if (children === null) {
    return '';
  }
  if (typeof children === 'string') {
    return renderChild(locale, children, values, renderer);
  }
  return children.map(child => renderChild(locale, child, values, renderer)).join('');
}

function renderChild(locale: string, child: Child | string, values: any, renderer: Renderer<string>): string {
  if (typeof child === 'string') {
    return renderer.renderText(locale, child);
  }

  if (child.nodeType === 'element') {
    const renderedAttributes: Record<string, string> = {};

    if (child.attributes !== null) {
      for (const key in child.attributes) {
        renderedAttributes[key] = renderChildren(locale, child.attributes[key], values, renderer);
      }
    }

    return renderer.renderElement(
      locale,
      child.tagName,
      renderedAttributes,
      renderChildren(locale, child.children, values, renderer)
    );
  }

  if (child.nodeType === 'argument') {
    return renderer.renderValue(locale, values[child.name], child.type, child.style);
  }

  if (child.nodeType === 'select') {
    const category = renderer.selectCategory(
      locale,
      values[child.argumentName],
      child.type,
      Object.keys(child.categories)
    );

    return category === undefined ? '' : renderChildren(locale, child.categories[category], values, renderer);
  }

  return '';
}
