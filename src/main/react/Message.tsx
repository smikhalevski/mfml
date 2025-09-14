import React, { Component, createContext, createElement, Fragment, ReactNode, useContext } from 'react';
import { Child, MessageNode } from '../ast.js';
import { ReactNodeMessageRenderer } from './ReactNodeMessageRenderer.js';
import { MessageRenderer } from '../types.js';
import { renderChildrenAsString } from '../renderText.js';

const defaultReactNodeMessageRenderer = new ReactNodeMessageRenderer({
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
});

const MessageLocaleContext = createContext('en');

MessageLocaleContext.displayName = 'MessageLocaleContext';

/**
 * Provides a locale to messages rendered by underlying components.
 */
export const MessageLocaleProvider = MessageLocaleContext.Provider;

const MessageRendererContext = createContext<MessageRenderer<ReactNode>>(defaultReactNodeMessageRenderer);

MessageRendererContext.displayName = 'MessageRendererContext';

/**
 * Provides a message renderer to underlying components.
 */
export const MessageRendererProvider = MessageRendererContext.Provider;

const MessageArgumentValuesContext = createContext<Record<string, unknown> | undefined>(undefined);

MessageArgumentValuesContext.displayName = 'MessageArgumentValuesContext';

/**
 * Props of a {@link Message} component.
 */
export type MessageProps<F extends (locale: string) => MessageNode<object | void> | null> = F extends (
  locale: string
) => MessageNode<infer Values> | null
  ? Values extends void
    ? { message: F; renderer?: MessageRenderer<ReactNode>; values?: undefined }
    : { message: F; renderer?: MessageRenderer<ReactNode>; values: Values }
  : never;

/**
 * Renders a message function.
 */
export function Message<F extends (locale: string) => MessageNode<object | void> | null>(
  props: MessageProps<F>
): ReactNode {
  const locale = useContext(MessageLocaleContext);
  const fallbackRenderer = useContext(MessageRendererContext);

  return (
    <MessageArgumentValuesContext.Provider value={props.values as Record<string, unknown> | undefined}>
      <MessageContent
        locale={locale}
        message={props.message}
        renderer={props.renderer || fallbackRenderer}
      />
    </MessageArgumentValuesContext.Provider>
  );
}

/**
 * @internal
 */
Message.displayName = 'Message';

interface MessageContentProps {
  locale: string;
  message: (locale: string) => MessageNode<object | void> | null;
  renderer: MessageRenderer<ReactNode>;
}

class MessageContent extends Component<MessageContentProps> {
  static displayName = 'MessageContent';

  shouldComponentUpdate(
    nextProps: Readonly<MessageContentProps>,
    _nextState: Readonly<{}>,
    _nextContext: any
  ): boolean {
    return (
      this.props.locale !== nextProps.locale ||
      this.props.message !== nextProps.message ||
      this.props.renderer !== nextProps.renderer
    );
  }

  render() {
    const messageNode = this.props.message(this.props.locale);

    if (messageNode === null) {
      return null;
    }

    const children = renderChildren(messageNode.locale, messageNode.children, this.props.renderer);

    return Array.isArray(children) ? createElement(Fragment, null, ...children) : children;
  }
}

function renderChildren(
  locale: string,
  children: Child[] | string | null,
  renderer: MessageRenderer<ReactNode>
): ReactNode[] {
  if (children === null) {
    return [];
  }

  const result = [];

  for (let i = 0; i < children.length; ++i) {
    result.push(renderChild(locale, children[i], renderer));
  }

  return result;
}

function renderChild(locale: string, child: Child | string, renderer: MessageRenderer<ReactNode>): ReactNode {
  if (typeof child === 'string') {
    return child;
  }

  if (child.nodeType === 'element') {
    if (child.attributes === null) {
      return renderer.renderElement(locale, child.tagName, {}, renderChildren(locale, child.children, renderer));
    }

    let hasAttributeArguments = false;

    for (const key in child.attributes) {
      if (typeof child.attributes[key] !== 'string') {
        hasAttributeArguments = true;
        break;
      }
    }

    if (!hasAttributeArguments) {
      const attributes: Record<string, string> = {};

      for (const key in child.attributes) {
        attributes[key] = renderChildrenAsString(locale, child.attributes[key], undefined, renderer as any).join('');
      }

      return renderer.renderElement(
        locale,
        child.tagName,
        attributes,
        renderChildren(locale, child.children, renderer)
      );
    }

    return (
      <MessageArgumentValuesContext.Consumer>
        {values => {
          const attributes: Record<string, string> = {};

          for (const key in child.attributes) {
            attributes[key] = renderChildrenAsString(
              locale,
              child.attributes[key],
              values,
              renderer as MessageRenderer<string>
            ).join('');
          }

          return renderer.renderElement(
            locale,
            child.tagName,
            attributes,
            renderChildren(locale, child.children, renderer)
          );
        }}
      </MessageArgumentValuesContext.Consumer>
    );
  }

  if (child.nodeType === 'argument') {
    return (
      <MessageArgumentValuesContext.Consumer>
        {values => renderer.formatArgument(locale, values && values[child.name], child.type, child.style)}
      </MessageArgumentValuesContext.Consumer>
    );
  }

  if (child.nodeType === 'select') {
    return (
      <MessageArgumentValuesContext.Consumer>
        {values => {
          const category = renderer.selectCategory(
            locale,
            values && values[child.argumentName],
            child.type,
            Object.keys(child.categories)
          );

          return category === undefined ? null : renderChildren(locale, child.categories[category], renderer);
        }}
      </MessageArgumentValuesContext.Consumer>
    );
  }

  return null;
}
