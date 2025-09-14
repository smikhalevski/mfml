import { Child, MessageNode } from './ast.js';
import { StringComponentType, StringMessageRenderer } from './StringMessageRenderer.js';
import { MessageRenderer } from './types.js';

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

  return renderChildren(messageNode.locale, messageNode.children, values, renderer);
}

function renderChildren(
  locale: string,
  children: Child[] | string | null,
  values: any,
  renderer: MessageRenderer<string>
): string {
  if (children === null) {
    return '';
  }

  if (typeof children === 'string') {
    return renderChild(locale, children, values, renderer);
  }

  let str = '';

  for (let i = 0; i < children.length; ++i) {
    str += renderChild(locale, children[i], values, renderer);
  }

  return str;
}

function renderChild(locale: string, child: Child | string, values: any, renderer: MessageRenderer<string>): string {
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
    return renderer.renderArgumentValue(locale, values && values[child.name], child.type, child.style);
  }

  if (child.nodeType === 'select') {
    const category = renderer.selectCategory(
      locale,
      values && values[child.argumentName],
      child.type,
      Object.keys(child.categories)
    );

    return category === undefined ? '' : renderChildren(locale, child.categories[category], values, renderer);
  }

  return '';
}

const paragraph: StringComponentType = (_attributes, children) => {
  return (typeof children === 'string' ? children : children.join('')) + '\n\n';
};

const lineBreak: StringComponentType = (_attributes, children) => {
  return (typeof children === 'string' ? children : children.join('')) + '\n';
};

const defaultStringMessageRenderer = new StringMessageRenderer({
  isSpacesCompressed: true,

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

  components: {
    h1: paragraph,
    h2: paragraph,
    h3: paragraph,
    h4: paragraph,
    h5: paragraph,
    h6: paragraph,
    p: paragraph,
    br: lineBreak,
  },
});
