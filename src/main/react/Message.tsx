import React, { createContext, createElement, Fragment, ReactNode, useContext, useMemo } from 'react';
import { Child, ElementNode, MessageNode } from '../ast.js';
import { ReactRenderer } from './ReactRenderer.js';
import { renderChildrenAsString } from '../renderText.js';
import { Renderer } from '../AbstractRenderer.js';

const MessageLocaleContext = createContext('en');
MessageLocaleContext.displayName = 'MessageLocaleContext';

const MessageRendererContext = createContext<Renderer<ReactNode>>(new ReactRenderer());
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

    const children = renderChildren(messageNode.locale, messageNode.children, renderer);

    if (Array.isArray(children)) {
      // Prevent React warning about absent element keys
      return createElement(Fragment, null, ...children);
    }

    return children;
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

    let hasInterpolatedAttributes = false;

    for (const key in child.attributes) {
      // Attributes may contain only ICU argument and select nodes, no XML tags, see tokenizer
      if ((hasInterpolatedAttributes = typeof child.attributes[key] !== 'string')) {
        break;
      }
    }

    if (!hasInterpolatedAttributes) {
      return renderElement(locale, child, undefined, renderer);
    }

    // Some element attributes require value interpolation
    return (
      <MessageValuesContext.Consumer>
        {values => renderElement(locale, child, values, renderer)}
      </MessageValuesContext.Consumer>
    );
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

          if (category === null || category === undefined) {
            return null;
          }

          return renderChildren(locale, child.categories[category], renderer);
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
