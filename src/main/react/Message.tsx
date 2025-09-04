import React, { ComponentType, createContext, createElement, Fragment, ReactNode, useContext, useMemo } from 'react';
import { Renderer, naturalCategorySelector, ElementRenderer, defaultFormatter } from '../createRenderer.js';
import { AttributeNode, ChildNode, MessageNode } from '../types.js';
import { renderAttributes } from '../renderToString.js';
import {
  getArgumentByOctothorpe,
  getArgumentCategories,
  getArgumentCategory,
  getArgumentOptions,
  getArgumentStyle,
  getArgumentType,
  isLowerCaseAlpha,
} from '../utils.js';

/**
 * Creates element renderer that produces React DOM elements if tag name is lower case alpha.
 *
 * @example
 * function Tooltip(props) {
 *   return <div title={props.title}>{props.children}</div>;
 * }
 *
 * createReactDOMElementRenderer({
 *   p: 'br'
 *   abbr: Tooltip,
 * });
 *
 * @param components A mapping from an element tag name to a component.
 * @group Message
 */
export function createReactDOMElementRenderer(components?: {
  [tagName: string]: ComponentType | string;
}): ElementRenderer<ReactNode> {
  return (tagName, attributes, children) => {
    let component = components?.[tagName];

    if (component === undefined) {
      if (!isLowerCaseAlpha(tagName)) {
        return null;
      }

      // React DOM element
      component = tagName;
    }

    if ('class' in attributes) {
      attributes.className = attributes.class;

      delete attributes.class;
    }

    return createElement(component, attributes, ...children);
  };
}

const MessageLocaleContext = createContext('en');
MessageLocaleContext.displayName = 'MessageLocaleContext';

const MessageRendererContext = createContext<Renderer<ReactNode>>({
  elementRenderer: createReactDOMElementRenderer(),
  formatter: defaultFormatter,
  categorySelector: naturalCategorySelector,
});

MessageRendererContext.displayName = 'MessageRendererContext';

const MessageValuesContext = createContext<any>(undefined);
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

    return normalizeChildren(renderChildren(messageNode.childNodes, messageNode.locale, renderer));
  }, [message, locale, renderer]);

  return <MessageValuesContext.Provider value={values}>{children}</MessageValuesContext.Provider>;
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

function renderChild(node: ChildNode, locale: string, renderer: Renderer<ReactNode>): ReactNode {
  if (node.nodeType === 'text') {
    return node.value;
  }

  if (node.nodeType === 'element') {
    if (!hasInterpolatedAttributes(node.attributeNodes)) {
      return renderer.elementRenderer(
        node.tagName,
        renderAttributes(node.attributeNodes, locale, undefined, renderer),
        renderChildren(node.childNodes, locale, renderer)
      );
    }

    // Element attributes must be re-rendered every time argument values are changed
    return (
      <MessageValuesContext.Consumer>
        {values =>
          renderer.elementRenderer(
            node.tagName,
            renderAttributes(node.attributeNodes, locale, values, renderer),
            renderChildren(node.childNodes, locale, renderer)
          )
        }
      </MessageValuesContext.Consumer>
    );
  }

  if (node.nodeType === 'argument') {
    const name = node.name;
    const type = getArgumentType(node);
    const style = getArgumentStyle(node);
    const options = getArgumentOptions(node);
    const categories = getArgumentCategories(node);

    return (
      <MessageValuesContext.Consumer>
        {values => {
          const value = values?.[name];

          if (type === null || categories === null) {
            return renderer.formatter({ locale, value, type, style, options });
          }

          const category = renderer.categorySelector({ locale, value, type, categories, options });

          if (category === undefined) {
            return null;
          }

          const categoryNode = getArgumentCategory(node, category);

          if (categoryNode === null) {
            return null;
          }

          return normalizeChildren(renderChildren(categoryNode.childNodes, locale, renderer));
        }}
      </MessageValuesContext.Consumer>
    );
  }

  if (node.nodeType === 'octothorpe') {
    const argumentNode = getArgumentByOctothorpe(node);

    if (argumentNode === null) {
      return null;
    }

    const name = argumentNode.name;
    const type = getArgumentType(argumentNode);
    const style = getArgumentStyle(argumentNode);
    const options = getArgumentOptions(argumentNode);

    return (
      <MessageValuesContext.Consumer>
        {values => renderer.formatter({ locale, value: values?.[name], type, style, options })}
      </MessageValuesContext.Consumer>
    );
  }
}

function normalizeChildren(children: ReactNode[]): ReactNode {
  if (children.length === 0) {
    return null;
  }
  if (children.length === 1) {
    return children[0];
  }

  // Ensure all children have keys
  return createElement(Fragment, null, ...children);
}

/**
 * Returns `true` if some of attributes contain arguments.
 */
function hasInterpolatedAttributes(attributeNodes: AttributeNode[] | null): boolean {
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
