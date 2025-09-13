import React, { Component, createContext, ReactNode, useContext, useMemo } from 'react';
import { Child, MessageNode } from '../ast.js';
import { useLocale } from './useLocale.js';
import { defaultRendererOptions, Renderer } from '../renderer.js';
import { ReactNodeRenderer } from './ReactNodeRenderer.js';

const MessageRendererContext = createContext<Renderer<ReactNode>>(new ReactNodeRenderer(defaultRendererOptions));

MessageRendererContext.displayName = 'MessageRendererContent';

export const MessageRendererProvider = MessageRendererContext.Provider;

const MessageValuesContext = createContext<Record<string, unknown> | undefined>(undefined);

MessageValuesContext.displayName = 'MessageValuesContext';

// prettier-ignore
export type MessageProps<F extends (locale: string) => MessageNode | null> =
  F extends ((locale: string) => MessageNode<infer Values> | null) ? Values extends void ? { message: F, values?: never } : { message: F, values: Values } : never;

export function Message<F extends (locale: string) => MessageNode | null>(props: MessageProps<F>): ReactNode {
  const { message, values } = props;
  const locale = useLocale();
  const renderer = useContext(MessageRendererContext);

  const messageNode = useMemo(() => message(locale), [message, locale]);

  if (messageNode === null) {
    return null;
  }

  if (typeof messageNode.children === 'string') {
    return renderer.renderText(locale, messageNode.children);
  }

  return (
    <MessageValuesContext.Provider value={values}>
      <MessageContent
        messageNode={messageNode}
        renderer={renderer}
      />
    </MessageValuesContext.Provider>
  );
}

interface MessageContentProps {
  messageNode: MessageNode;
  renderer: Renderer<ReactNode>;
}

class MessageContent extends Component<MessageContentProps> {
  shouldComponentUpdate(
    nextProps: Readonly<MessageContentProps>,
    _nextState: Readonly<{}>,
    _nextContext: any
  ): boolean {
    return this.props.messageNode !== nextProps.messageNode || this.props.renderer !== nextProps.renderer;
  }

  render() {
    return renderChildren(this.props.messageNode.locale, this.props.messageNode.children, this.props.renderer);
  }
}

function renderChildren(locale: string, children: Child[] | string | null, renderer: Renderer<ReactNode>): ReactNode {
  if (children === null) {
    return null;
  }
  if (typeof children === 'string') {
    return renderChild(locale, children, renderer);
  }
  return children.map(child => renderChild(locale, child, renderer)).join('');
}

function renderChild(locale: string, child: Child | string, renderer: Renderer<ReactNode>): ReactNode {
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
      <ArgumentContent name={child.name}>
        {value => renderer.renderValue(locale, value, child.type, child.style)}
      </ArgumentContent>
    );
  }

  if (child.nodeType === 'select') {
    return (
      <ArgumentContent name={child.argumentName}>
        {value => {
          const category = renderer.selectCategory(locale, value, child.type, Object.keys(child.categories));

          return category === undefined ? '' : renderChildren(locale, child.categories[category], renderer);
        }}
      </ArgumentContent>
    );
  }

  return null;
}

interface ArgumentContentProps {
  name: string;
  children: (value: any) => ReactNode;
}

function ArgumentContent(props: ArgumentContentProps): ReactNode {
  const values = useContext(MessageValuesContext);

  return props.children(values && values[props.name]);
}
