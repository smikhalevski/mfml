import React, { Component, createContext, createElement, Fragment, ReactNode, useContext } from 'react';
import { Child, MessageNode } from '../ast.js';
import { useLocale } from './useLocale.js';
import { ReactNodeMessageRenderer } from './ReactNodeMessageRenderer.js';
import { MessageRenderer } from '../types.js';

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
  const locale = useLocale();
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
): ReactNode {
  if (children === null) {
    return null;
  }

  if (typeof children === 'string') {
    return renderChild(locale, children, renderer);
  }

  const nodes = [];

  for (let i = 0; i < children.length; ++i) {
    nodes.push(renderChild(locale, children[i], renderer));
  }

  return nodes;
}

function renderChild(locale: string, child: Child | string, renderer: MessageRenderer<ReactNode>): ReactNode {
  if (typeof child === 'string') {
    return renderer.renderText(locale, child);
  }

  if (child.nodeType === 'element') {
    const renderedAttributes: Record<string, ReactNode> = {};

    if (child.attributes !== null) {
      for (const key in child.attributes) {
        renderedAttributes[key] = renderChildren(locale, child.attributes[key], renderer);
      }
    }

    return renderer.renderElement(
      locale,
      child.tagName,
      renderedAttributes,
      renderChildren(locale, child.children, renderer)
    );
  }

  if (child.nodeType === 'argument') {
    return (
      <MessageArgumentValue argumentName={child.name}>
        {argumentValue => renderer.renderArgumentValue(locale, argumentValue, child.type, child.style)}
      </MessageArgumentValue>
    );
  }

  if (child.nodeType === 'select') {
    return (
      <MessageArgumentValue argumentName={child.argumentName}>
        {argumentValue => {
          const category = renderer.selectCategory(locale, argumentValue, child.type, Object.keys(child.categories));

          return category === undefined ? null : renderChildren(locale, child.categories[category], renderer);
        }}
      </MessageArgumentValue>
    );
  }

  return null;
}

interface MessageArgumentValueProps {
  argumentName: string;
  children: (argumentValue: any) => ReactNode;
}

function MessageArgumentValue(props: MessageArgumentValueProps): ReactNode {
  const argumentValues = useContext(MessageArgumentValuesContext);

  return props.children(argumentValues && argumentValues[props.argumentName]);
}

MessageArgumentValue.displayName = 'MessageArgumentValue';
