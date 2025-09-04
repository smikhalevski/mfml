import { Renderer } from './createRenderer.js';
import { AnyNode, CategoryNode, MessageNode } from './types.js';
import { getOctothorpeArgument } from './utils.js';

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
  renderer: Renderer<string>;
}

type InferRenderTextOptions<MessageFunction extends (locale: string) => MessageNode<object | void> | null> =
  MessageFunction extends (locale: string) => MessageNode<infer Values> | null
    ? Values extends void
      ? RenderTextOptions<MessageFunction, Values>
      : RenderTextOptions<MessageFunction, Values> & { values: Values }
    : never;

/**
 * Renders a message node as a plain text.
 *
 * @example
 * renderText({
 *   message: greeting,
 *   locale: 'en-US',
 *   values: { name: 'Bob' },
 * });
 *
 * @param options Rendering options.
 * @group Renderer
 */
export function renderText<MessageFunction extends (locale: string) => MessageNode<object | void> | null>(
  options: InferRenderTextOptions<MessageFunction>
): string {
  const { message, locale, values, renderer } = options;

  const messageNode = message(locale);

  if (messageNode === null) {
    return '';
  }

  return renderNodeAsString(messageNode.locale, values, messageNode, renderer);
}

export function renderNodesAsString(
  locale: string,
  values: any,
  nodes: readonly AnyNode[] | null,
  renderer: Renderer<string>
): string[] {
  const result: string[] = [];

  if (nodes !== null) {
    for (let i = 0; i < nodes.length; ++i) {
      result.push(renderNodeAsString(locale, values, nodes[i], renderer));
    }
  }

  return result;
}

export function renderNodeAsString(
  locale: string,
  values: any,
  node: AnyNode | null,
  renderer: Renderer<string>
): string {
  if (node === null) {
    return '';
  }

  switch (node.nodeType) {
    case 'message':
      return renderNodesAsString(locale, values, node.childNodes, renderer).join('');

    case 'text':
      return node.value;

    case 'element':
      const attributes: Record<string, string> = {};

      if (node.attributeNodes !== null) {
        for (const attributeNode of node.attributeNodes) {
          attributes[attributeNode.name] = renderNodesAsString(locale, values, attributeNode.childNodes, renderer).join(
            ''
          );
        }
      }

      return renderer.renderElement(
        node.tagName,
        attributes,
        renderNodesAsString(locale, values, node.childNodes, renderer)
      );

    case 'argument':
      let options: Record<string, string> | undefined;

      if (node.optionNodes !== null) {
        options = {};

        for (const optionNode of node.optionNodes) {
          options[optionNode.name] = optionNode.valueNode!.value;
        }
      }

      if (node.categoryNodes === null) {
        return renderer.formatArgument(
          locale,
          values && values[node.name],
          node.typeNode?.value,
          node.styleNode?.value,
          options
        );
      }

      const categories = [];

      let selectedCategoryNode: CategoryNode | undefined;

      for (const categoryNode of node.categoryNodes) {
        categories.push(categoryNode.name);

        if (categoryNode.name === 'other') {
          selectedCategoryNode = categoryNode;
        }
      }

      const category = renderer.selectCategory(
        locale,
        values && values[node.name],
        node.typeNode!.value,
        categories,
        options
      );

      if (category !== undefined && categories.indexOf(category) !== -1) {
        for (const categoryNode of node.categoryNodes) {
          if (category === categoryNode.name) {
            selectedCategoryNode = categoryNode;
            break;
          }
        }
      }

      if (selectedCategoryNode !== undefined) {
        return renderNodesAsString(locale, values, selectedCategoryNode.childNodes, renderer).join('');
      }

      return '';

    case 'octothorpe': {
      const argumentNode = getOctothorpeArgument(node)!;

      let options: Record<string, string> | undefined;

      if (argumentNode.optionNodes !== null) {
        options = {};

        for (const optionNode of argumentNode.optionNodes) {
          options[optionNode.name] = optionNode.valueNode!.value;
        }
      }

      return renderer.formatArgument(
        locale,
        values && values[argumentNode.name],
        argumentNode.typeNode?.value,
        argumentNode.styleNode?.value,
        options
      );
    }

    default:
      return '';
  }
}
