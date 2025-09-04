import React, { createContext, createElement, Fragment, ReactNode, useContext, useMemo } from 'react';
import { Renderer } from '../createRenderer.js';
import { AnyNode, CategoryNode, ElementNode, MessageNode } from '../types.js';
import { renderNodesAsString } from '../renderText.js';

const MessageLocaleContext = createContext('en');
MessageLocaleContext.displayName = 'MessageLocaleContext';

const MessageRendererContext = createContext<Renderer<ReactNode>>(null!);
MessageRendererContext.displayName = 'MessageRendererContext';

const MessageValuesContext = createContext<Record<string, unknown> | undefined>(undefined);
MessageValuesContext.displayName = 'MessageValuesContext';

/**
 * Provides a locale to messages rendered by underlying components.
 *
 * @group Message
 */
export const MessageLocaleProvider = MessageLocaleContext.Provider;

/**
 * Provides a message renderer to underlying components.
 *
 * @group Message
 */
export const MessageRendererProvider = MessageRendererContext.Provider;

/**
 * Props of a {@link Message} component.
 *
 * @template MessageFunction The function that returns a message node for a given locale, or `null` if locale isn't
 * supported.
 * @template Values Message argument values.
 * @group Message
 */
export interface MessageProps<
  MessageFunction extends (locale: string) => MessageNode<Values> | null,
  Values extends object | void,
> {
  /**
   * The function that returns a message node for a given locale, or `null` if locale isn't supported.
   */
  message: MessageFunction;

  /**
   * The locale to render.
   *
   * By default, a locale provided by {@link MessageLocaleProvider} is used.
   */
  locale?: string;

  /**
   * Message argument values.
   */
  values?: Values;

  /**
   * Renderer that should be used.
   *
   * By default, a mapping provided by {@link MessageRendererProvider} is used.
   */
  renderer?: Renderer<ReactNode>;
}

type InferMessageProps<MessageFunction extends (locale: string) => MessageNode<object | void> | null> =
  MessageFunction extends (locale: string) => MessageNode<infer Values> | null
    ? Values extends void
      ? MessageProps<MessageFunction, Values>
      : MessageProps<MessageFunction, Values> & { values: Values }
    : never;

/**
 * Renders a message function.
 *
 * @template MessageFunction The function that returns a message node for a given locale.
 * @group Message
 */
export function Message<MessageFunction extends (locale: string) => MessageNode<object | void> | null>(
  props: InferMessageProps<MessageFunction>
): ReactNode {
  const contextLocale = useContext(MessageLocaleContext);
  const contextRenderer = useContext(MessageRendererContext);

  const { message, locale = contextLocale, values, renderer = contextRenderer } = props;

  const children = useMemo(() => {
    const messageNode = message(locale);

    if (messageNode === null) {
      return null;
    }

    return createElement(Fragment, null, ...renderNodes(messageNode.locale, messageNode.childNodes, renderer));
  }, [message, locale, renderer]);

  return (
    <MessageValuesContext.Provider value={values as Record<string, unknown> | undefined}>
      {children}
    </MessageValuesContext.Provider>
  );
}

/**
 * @internal
 */
Message.displayName = 'Message';

function renderNodes(locale: string, nodes: readonly AnyNode[] | null, renderer: Renderer<ReactNode>): ReactNode[] {
  const result: ReactNode[] = [];

  if (nodes !== null) {
    for (let i = 0; i < nodes.length; ++i) {
      result.push(renderNode(locale, nodes[i], renderer));
    }
  }

  return result;
}

function renderNode(locale: string, node: AnyNode | null, renderer: Renderer<ReactNode>): ReactNode {
  if (node === null) {
    return null;
  }

  switch (node.nodeType) {
    case 'message':
      return renderNodes(locale, node.childNodes, renderer);

    case 'text':
      return node.value;

    case 'element':
      if (node.attributeNodes === null || node.attributeNodes.length === 0) {
        return renderer.renderElement(node.tagName, {}, renderNodes(locale, node.childNodes, renderer));
      }

      let hasInterpolatedAttributes = false;

      for (const attributeNode of node.attributeNodes) {
        if (attributeNode.childNodes !== null) {
          for (const childNode of attributeNode.childNodes) {
            if (childNode.nodeType === 'argument') {
              hasInterpolatedAttributes = true;
              break;
            }
          }
        }
      }

      if (!hasInterpolatedAttributes) {
        return renderElement(locale, node, undefined, renderer);
      }

      // Some element attributes require value interpolation
      return (
        <MessageValuesContext.Consumer>
          {values => renderElement(locale, node, values, renderer)}
        </MessageValuesContext.Consumer>
      );

    case 'argument':
      const { categoryNodes } = node;

      let options: Record<string, string> | undefined;

      if (node.optionNodes !== null) {
        options = {};

        for (const optionNode of node.optionNodes) {
          options[optionNode.name] = optionNode.valueNode!.value;
        }
      }

      if (categoryNodes === null) {
        return (
          <MessageValuesContext.Consumer>
            {values =>
              renderer.formatArgument(
                locale,
                values && values[node.name],
                node.typeNode?.value,
                node.styleNode?.value,
                options
              )
            }
          </MessageValuesContext.Consumer>
        );
      }

      return (
        <MessageValuesContext.Consumer>
          {values => {
            const categories = [];

            let selectedCategoryNode: CategoryNode | undefined;

            for (const categoryNode of categoryNodes) {
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
              for (const categoryNode of categoryNodes) {
                if (category === categoryNode.name) {
                  selectedCategoryNode = categoryNode;
                  break;
                }
              }
            }

            if (selectedCategoryNode !== undefined) {
              return renderNodes(locale, selectedCategoryNode.childNodes, renderer);
            }

            return null;
          }}
        </MessageValuesContext.Consumer>
      );
  }
}

function renderElement(
  locale: string,
  elementNode: ElementNode,
  values: any,
  renderer: Renderer<ReactNode>
): ReactNode {
  const attributes: Record<string, string> = {};

  if (elementNode.attributeNodes !== null) {
    for (const attributeNode of elementNode.attributeNodes) {
      attributes[attributeNode.name] = renderNodesAsString(
        locale,
        attributeNode.childNodes,
        values,
        renderer as Renderer<string>
      ).join('');
    }
  }

  return renderer.renderElement(elementNode.tagName, attributes, renderNodes(locale, elementNode.childNodes, renderer));
}
