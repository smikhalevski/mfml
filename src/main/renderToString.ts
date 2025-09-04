import { createRenderer, defaultFormatters, ElementRenderer, Renderer } from './createRenderer.js';
import { AnyNode, ElementNode, MessageNode, ChildNode } from './types.js';
import {
  getArgumentByOctothorpe,
  getArgumentCategories,
  getArgumentCategory,
  getArgumentOptions,
  getArgumentStyle,
  getArgumentType,
} from './utils.js';

const stringElementRenderer: ElementRenderer<string> = (_tagName, _attributes, _children) => {
  return _children.join('');
};

const defaultStringRenderer = createRenderer({
  elementRenderers: [stringElementRenderer],
  formatters: defaultFormatters,
});

/**
 * Options of {@link renderToString}.
 *
 * @template MessageFunction The function that returns a message node for a given locale, or `null` if locale isn't
 * supported.
 * @template Values Message argument values.
 * @group Renderer
 */
export interface RenderToStringOptions<
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
   * The renderer to use.
   */
  renderer?: Renderer<string>;
}

type InferRenderToStringOptions<MessageFunction extends (locale: string) => MessageNode | null> =
  MessageFunction extends (locale: string) => MessageNode<infer Values> | null
    ? Values extends void
      ? RenderToStringOptions<MessageFunction, Values>
      : RenderToStringOptions<MessageFunction, Values> & { values: Values }
    : never;

/**
 * Renders a message node as a plain text.
 *
 * @example
 * renderToString({
 *   message: greeting,
 *   locale: 'en-US',
 *   values: { name: 'Bob' },
 * });
 *
 * @param options Rendering options.
 * @group Renderer
 */
export function renderToString<MessageFunction extends (locale: string) => MessageNode | null>(
  options: InferRenderToStringOptions<MessageFunction>
): string {
  const { message, locale, values, renderer = defaultStringRenderer } = options;

  const messageNode = message(locale);

  return messageNode === null ? '' : renderNode(messageNode, messageNode.locale, values, renderer);
}

export function renderElementAttributes(
  elementNode: ElementNode,
  locale: string,
  values: any,
  renderer: Renderer<string>
): Record<string, string> {
  if (elementNode.attributeNodes === null) {
    return {};
  }

  const attributes: Record<string, string> = {};

  for (const attributeNode of elementNode.attributeNodes) {
    attributes[attributeNode.name] = renderChildren(attributeNode.childNodes, locale, values, renderer).join('');
  }

  return attributes;
}

function renderNode(node: AnyNode, locale: string, values: any, renderer: Renderer<string>): string {
  switch (node.nodeType) {
    case 'message':
      return renderChildren(node.childNodes, locale, values, renderer).join('');

    case 'text':
      return node.value;

    case 'element':
      return renderer.renderElement(
        node.tagName,
        renderElementAttributes(node, locale, values, renderer),
        renderChildren(node.childNodes, locale, values, renderer)
      );

    case 'argument':
      const value = values[node.name];
      const type = getArgumentType(node);
      const style = getArgumentStyle(node);
      const options = getArgumentOptions(node);
      const categories = getArgumentCategories(node);

      if (type === null || categories === null) {
        return renderer.formatArgument({ locale, value, type, style, options });
      }

      const category = renderer.selectCategory({ locale, value, type, categories, options });

      if (category === undefined) {
        return '';
      }

      const categoryNode = getArgumentCategory(node, category);

      if (categoryNode === null) {
        return '';
      }

      return renderChildren(categoryNode.childNodes, locale, values, renderer).join('');

    case 'octothorpe':
      const argumentNode = getArgumentByOctothorpe(node);

      if (argumentNode === null) {
        return '';
      }

      return renderer.formatArgument({
        locale,
        value: values[argumentNode.name],
        type: getArgumentType(argumentNode),
        style: getArgumentStyle(argumentNode),
        options: getArgumentOptions(argumentNode),
      });
  }

  return '';
}

function renderChildren(nodes: ChildNode[] | null, locale: string, values: any, renderer: Renderer<string>): string[] {
  if (nodes === null) {
    return [];
  }

  const children = [];

  for (let i = 0; i < nodes.length; ++i) {
    children.push(renderNode(nodes[i], locale, values, renderer));
  }

  return children;
}
