import { AttributeNode, ChildNode, MessageFunction, Renderer } from './types.js';
import {
  getArgumentByOctothorpe,
  getArgumentCategories,
  getArgumentCategory,
  getArgumentOptions,
  getArgumentStyle,
  getArgumentType,
  isLowerCaseAlpha,
} from './utils.js';
import { defaultArgumentFormatter } from './formatter.js';
import { defaultCategorySelector } from './selector.js';

const defaultStringRenderer: Renderer<string> = {
  renderElement(tagName, _attributes, children) {
    return isLowerCaseAlpha(tagName) ? children.join('') : '';
  },

  formatArgument: defaultArgumentFormatter,
  selectCategory: defaultCategorySelector,
};

/**
 * Options of {@link renderToString}.
 *
 * @template T The function that returns a message node for a given locale, or `null` if locale isn't supported.
 * @template Values Message argument values.
 * @group Renderer
 */
export interface RenderToStringOptions<T extends MessageFunction<Values>, Values extends object | void> {
  /**
   * The function that returns a message node for a given locale, or `null` if locale isn't supported.
   */
  message: T;

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

type InferRenderToStringOptions<T extends MessageFunction> =
  T extends MessageFunction<infer Values>
    ? Values extends void
      ? RenderToStringOptions<T, Values>
      : RenderToStringOptions<T, Values> & { values: Values }
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
export function renderToString<T extends MessageFunction>(options: InferRenderToStringOptions<T>): string {
  const { message, locale, values, renderer = defaultStringRenderer } = options;

  const messageNode = message(locale);

  if (messageNode === null) {
    return '';
  }

  return renderChildren(messageNode.childNodes, messageNode.locale, values, renderer).join('');
}

/**
 * Renders attribute nodes to a dictionary.
 */
export function renderAttributes(
  attributeNodes: AttributeNode[] | null,
  locale: string,
  values: any,
  renderer: Renderer<any>
): Record<string, string> {
  if (attributeNodes === null) {
    return {};
  }

  const attributes: Record<string, string> = {};

  for (const attributeNode of attributeNodes) {
    attributes[attributeNode.name] = renderChildren(attributeNode.childNodes, locale, values, renderer).join('');
  }

  return attributes;
}

function renderChildren(nodes: ChildNode[] | null, locale: string, values: any, renderer: Renderer<string>): string[] {
  if (nodes === null) {
    return [];
  }

  const children = [];

  for (let i = 0; i < nodes.length; ++i) {
    children.push(renderChild(nodes[i], locale, values, renderer));
  }

  return children;
}

function renderChild(node: ChildNode, locale: string, values: any, renderer: Renderer<string>): string {
  if (node.nodeType === 'text') {
    return node.value;
  }

  if (node.nodeType === 'element') {
    return (
      renderer.renderElement(
        node.tagName,
        renderAttributes(node.attributeNodes, locale, values, renderer),
        renderChildren(node.childNodes, locale, values, renderer)
      ) || ''
    );
  }

  if (node.nodeType === 'argument') {
    const value = values?.[node.name];
    const type = getArgumentType(node);
    const style = getArgumentStyle(node);
    const options = getArgumentOptions(node);
    const categories = getArgumentCategories(node);

    if (type === null || categories === null) {
      return toSafeString(renderer.formatArgument({ locale, value, type, style, options }));
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
  }

  if (node.nodeType === 'octothorpe') {
    const argumentNode = getArgumentByOctothorpe(node);

    if (argumentNode === null) {
      return '';
    }

    return toSafeString(
      renderer.formatArgument({
        locale,
        value: values?.[argumentNode.name],
        type: getArgumentType(argumentNode),
        style: getArgumentStyle(argumentNode),
        options: getArgumentOptions(argumentNode),
      })
    );
  }

  return '';
}

function toSafeString(value: unknown): string {
  return value === null || value === undefined || value !== value ? '' : '' + value;
}
