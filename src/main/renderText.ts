import { Child, MessageNode } from './ast.js';
import { StringRenderer } from './StringRenderer.js';
import { defaultStyles, getMessageNodeOrFallback } from './utils.js';
import { Renderer } from './AbstractRenderer.js';

const defaultStringRenderer: Renderer<string> = new StringRenderer(defaultStyles);

/**
 * Options of {@link renderText}.
 *
 * @template MessageFunction The function that returns a message node for a given locale, or `null` if locale isn't
 * supported.
 * @template Values Message argument values.
 * @group Renderer
 */
export interface RenderTextOptions<
  MessageFunction extends (locale: string) => MessageNode<Values> | null,
  Values extends object | void,
> {
  /**
   * The function that returns a message node for a given locale, or `null` if locale isn't supported.
   */
  message: MessageFunction;

  /**
   * The locale to render.
   */
  locale: string;

  /**
   * Message argument values.
   */
  values?: Values;

  /**
   * Renderer that should be used.
   */
  renderer?: Renderer<string>;

  /**
   * Fallback locales mapping.
   */
  fallbackLocales?: Record<string, string>;
}

type InferRenderTextOptions<MessageFunction extends (locale: string) => MessageNode<object | void> | null> =
  MessageFunction extends (locale: string) => MessageNode<infer Values> | null
    ? Values extends void
      ? RenderTextOptions<MessageFunction, Values>
      : RenderTextOptions<MessageFunction, Values> & { values: Values }
    : never;

/**
 * Renders message node as plain text string.
 *
 * @example
 * renderText({
 *   message: greeting,
 *   locale: 'en-US',
 *   fallbackLocales: { 'en-US': 'en' },
 *   values: { name: 'Bob' },
 * });
 *
 * @param options Rendering options.
 * @group Renderer
 */
export function renderText<MessageFunction extends (locale: string) => MessageNode<object | void> | null>(
  options: InferRenderTextOptions<MessageFunction>
): string {
  const { message, locale, fallbackLocales, values, renderer = defaultStringRenderer } = options;

  const messageNode = getMessageNodeOrFallback(message, locale, fallbackLocales);

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
