import React, { createContext, createElement, Fragment, ReactNode, useContext, useMemo } from 'react';
import { Renderer } from '../createRenderer.js';
import { AnyNode, AttributeNode, CategoryNode, ChildNode, MessageNode } from '../types.js';
import { renderAttributes } from '../renderToString.js';

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
   * The renderer to use.
   *
   * By default, a mapping provided by {@link MessageRendererProvider} is used.
   */
  renderer?: Renderer<ReactNode>;
}

type InferMessageProps<MessageFunction extends (locale: string) => MessageNode | null> = MessageFunction extends (
  locale: string
) => MessageNode<infer Values> | null
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
export function Message<MessageFunction extends (locale: string) => MessageNode | null>(
  props: InferMessageProps<MessageFunction>
): ReactNode {
  const defaultLocale = useContext(MessageLocaleContext);
  const defaultRenderer = useContext(MessageRendererContext);

  const { message, locale = defaultLocale, values, renderer = defaultRenderer } = props;

  const children = useMemo(() => {
    const messageNode = message(locale);

    if (messageNode === null) {
      return null;
    }

    return createElement(Fragment, null, ...renderChildren(messageNode.locale, messageNode.childNodes, renderer));
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

function renderChildren(nodes: ChildNode[] | null, locale: string, renderer: Renderer<ReactNode>): ReactNode[] {
  if (nodes === null) {
    return [];
  }

  const children = [];

  for (let i = 0; i < nodes.length; ++i) {
    children.push(renderChild(nodes[i], locale, renderer));
  }

  return children;
}

function renderChild(node: AnyNode, locale: string, renderer: Renderer<ReactNode>): ReactNode {
  if (node.nodeType === 'text') {
    return node.value;
  }

  if (node.nodeType === 'element') {
    if (!containsArguments(node.attributeNodes)) {
      return renderer.renderElement(
        node.tagName,
        renderAttributes(node.attributeNodes, locale, undefined, renderer as Renderer<string>),
        renderChildren(node.childNodes, locale, renderer)
      );
    }

    return (
      <MessageValuesContext.Consumer>
        {values =>
          renderer.renderElement(
            node.tagName,
            renderAttributes(node, locale, values, renderer as Renderer<string>),
            renderChildren(node.childNodes, locale, renderer)
          )
        }
      </MessageValuesContext.Consumer>
    );
  }

  if (node.nodeType === 'argument') {
  }

  // switch (node.nodeType) {
  //   case 'text':
  //
  //   case 'element':
  //
  //   case 'argument':
  //     const { categoryNodes } = node;
  //
  //     let options: Record<string, string> | undefined;
  //
  //     if (node.optionNodes !== null) {
  //       options = {};
  //
  //       for (const optionNode of node.optionNodes) {
  //         options[optionNode.name] = optionNode.valueNode!.value;
  //       }
  //     }
  //
  //     if (categoryNodes === null) {
  //       return (
  //         <MessageValuesContext.Consumer>
  //           {values =>
  //             renderer.formatArgument(
  //               locale,
  //               values && values[node.name],
  //               node.typeNode?.value,
  //               node.styleNode?.value,
  //               options
  //             )
  //           }
  //         </MessageValuesContext.Consumer>
  //       );
  //     }
  //
  //     return (
  //       <MessageValuesContext.Consumer>
  //         {values => {
  //           const categories = [];
  //
  //           let selectedCategoryNode: CategoryNode | undefined;
  //
  //           for (const categoryNode of categoryNodes) {
  //             categories.push(categoryNode.name);
  //
  //             if (categoryNode.name === 'other') {
  //               selectedCategoryNode = categoryNode;
  //             }
  //           }
  //
  //           const category = renderer.selectCategory({
  //             locale: locale,
  //             value: values && values[node.name],
  //             type: node.typeNode!.value,
  //             categories: categories,
  //             options: options,
  //           });
  //
  //           if (category !== undefined && categories.indexOf(category) !== -1) {
  //             for (const categoryNode of categoryNodes) {
  //               if (category === categoryNode.name) {
  //                 selectedCategoryNode = categoryNode;
  //                 break;
  //               }
  //             }
  //           }
  //
  //           if (selectedCategoryNode !== undefined) {
  //             return renderChildren(locale, selectedCategoryNode.childNodes, renderer);
  //           }
  //
  //           return null;
  //         }}
  //       </MessageValuesContext.Consumer>
  //     );
  // }
}

/**
 * Returns `true` if some of attributes contain arguments.
 */
function containsArguments(attributeNodes: AttributeNode[] | null): boolean {
  if (attributeNodes === null) {
    return false;
  }

  for (const attributeNode of attributeNodes) {
    if (attributeNode.childNodes === null) {
      continue;
    }

    for (const childNode of attributeNode.childNodes) {
      if (childNode.nodeType === 'argument' || childNode.nodeType === 'octothorpe') {
        return true;
      }
    }
  }

  return false;
}
