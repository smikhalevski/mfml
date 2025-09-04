import { Child, MessageNode } from './ast.js';
import { StringRenderer } from './StringRenderer.js';
import { defaultRendererOptions } from './utils.js';
import { Renderer } from './AbstractRenderer.js';

const stringRenderer: Renderer<string> = new StringRenderer(defaultRendererOptions);

/**
 * Renders message node as plain text string.
 *
 * @example
 * renderText(greeting('en-US'), { name: 'Bob' });
 *
 * @param messageNode The message to render.
 * @param values Message argument values.
 * @param renderer The message renderer.
 * @group Renderer
 */
export function renderText<Values extends object | void>(
  messageNode: MessageNode<Values> | null,
  values: Values,
  renderer = stringRenderer
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
  renderer: Renderer<string>
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

function renderChild(locale: string, child: Child, values: any, renderer: Renderer<string>): string {
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

    if (category === undefined) {
      return '';
    }

    return renderChildrenAsString(locale, child.categories[category], values, renderer).join('');
  }

  return '';
}
