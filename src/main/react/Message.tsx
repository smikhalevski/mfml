import React, { createContext, createElement, Fragment, ReactNode, useContext, useMemo } from 'react';
import { Child, ElementNode, MessageNode } from '../ast.js';
import { ReactRenderer } from './ReactRenderer.js';
import { renderChildrenAsString } from '../renderText.js';
import { defaultRendererOptions } from '../utils.js';
import { Renderer } from '../AbstractRenderer.js';

const MessageLocaleContext = createContext('en');
MessageLocaleContext.displayName = 'MessageLocaleContext';

const MessageRendererContext = createContext<Renderer<ReactNode>>(new ReactRenderer(defaultRendererOptions));
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
 * @group Message
 */
export type MessageProps<MessageFunction extends (locale: string) => MessageNode<object | void> | null> =
  MessageFunction extends (locale: string) => MessageNode<infer Values> | null
    ? Values extends void
      ? { message: MessageFunction; renderer?: Renderer<ReactNode>; values?: undefined }
      : { message: MessageFunction; renderer?: Renderer<ReactNode>; values: Values }
    : never;

/**
 * Renders a message function.
 *
 * @template MessageFunction The function that returns a message node for a given locale.
 * @group Message
 */
export function Message<MessageFunction extends (locale: string) => MessageNode<object | void> | null>(
  props: MessageProps<MessageFunction>
): ReactNode {
  const locale = useContext(MessageLocaleContext);
  const fallbackRenderer = useContext(MessageRendererContext);

  const { message, renderer = fallbackRenderer, values } = props;

  const children = useMemo(() => {
    const messageNode = message(locale);

    if (messageNode === null) {
      return null;
    }

    const children = renderChildren(messageNode.locale, messageNode.children, renderer);

    return Array.isArray(children) ? createElement(Fragment, null, ...children) : children;
  }, [locale, message, renderer]);

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

function renderChildren(locale: string, children: Child[] | string | null, renderer: Renderer<ReactNode>): ReactNode[] {
  if (children === null) {
    return [];
  }

  const result = [];

  for (let i = 0; i < children.length; ++i) {
    result.push(renderChild(locale, children[i], renderer));
  }

  return result;
}

function renderChild(locale: string, child: Child, renderer: Renderer<ReactNode>): ReactNode {
  if (typeof child === 'string') {
    return child;
  }

  if (child.nodeType === 'element') {
    if (child.attributes === null) {
      return renderer.renderElement(locale, child.tagName, {}, renderChildren(locale, child.children, renderer));
    }

    // Element must be subscribed to values if some of its attributes are interpolated
    for (const key in child.attributes) {
      if (typeof child.attributes[key] === 'string') {
        continue;
      }

      // Attribute requires interpolation
      return (
        <MessageValuesContext.Consumer>
          {values => renderElement(locale, child, values, renderer)}
        </MessageValuesContext.Consumer>
      );
    }

    return renderElement(locale, child, undefined, renderer);
  }

  if (child.nodeType === 'argument') {
    return (
      <MessageValuesContext.Consumer>
        {values => renderer.formatArgument(locale, values && values[child.name], child.type, child.style)}
      </MessageValuesContext.Consumer>
    );
  }

  if (child.nodeType === 'select') {
    return (
      <MessageValuesContext.Consumer>
        {values => {
          const category = renderer.selectCategory(
            locale,
            values && values[child.argumentName],
            child.type,
            Object.keys(child.categories)
          );

          return category === undefined ? null : renderChildren(locale, child.categories[category], renderer);
        }}
      </MessageValuesContext.Consumer>
    );
  }

  return null;
}

function renderElement(locale: string, child: ElementNode, values: any, renderer: Renderer<ReactNode>): ReactNode {
  const attributes: Record<string, string> = {};

  for (const key in child.attributes) {
    attributes[key] = renderChildrenAsString(locale, child.attributes[key], values, renderer as Renderer<string>).join(
      ''
    );
  }

  return renderer.renderElement(locale, child.tagName, attributes, renderChildren(locale, child.children, renderer));
}
