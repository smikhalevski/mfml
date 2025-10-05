import { ComponentType, createElement, ReactNode } from 'react';
import { isLowerCaseAlpha } from '../utils.js';
import { ElementRenderer } from '../types.js';

/**
 * Creates element renderer that produces React DOM elements:
 *
 * - If tag name is among keys of components, then the corresponding component is rendered.
 * - If tag name consists of lower case alpha characters then a DOM element is rendered.
 * - Otherwise, `null` is returned.
 *
 * Attributes handling:
 *
 * - `class` attribute is transformed into a `className` property.
 * - `style` attribute is parsed as a CSS text and transformed into a `style` property.
 * - Other attributes are preserved as-is.
 *
 * @example
 * function Tooltip(props) {
 *   return <div title={props.title}>{props.children}</div>;
 * }
 *
 * const myRenderer = createReactDOMElementRenderer({
 *   p: 'div',
 *   Tooltip,
 * });
 *
 * <MessageRendererProvider value={myRenderer}>
 *   {...}
 * </MessageRendererProvider>
 *
 * @param components A mapping from an element tag name to a component.
 * @group Message
 */
export function createReactDOMElementRenderer(components?: {
  [tagName: string]: ComponentType<any> | string;
}): ElementRenderer<ReactNode> {
  return (tagName, attributes, children) => {
    let component = components?.[tagName];

    if (component === undefined) {
      if (!isLowerCaseAlpha(tagName)) {
        // Unknown custom element
        return null;
      }

      // React DOM element
      component = tagName;
    }

    const props: Record<string, unknown> = {};

    for (const name in attributes) {
      switch (name) {
        case 'class':
          props.className = attributes.class;
          break;

        case 'style':
          props.style = parseStyleText(attributes.style);
          break;

        default:
          props[name] = attributes[name];
      }
    }

    return createElement(component, props, ...children);
  };
}

export function parseStyleText(styleText: string): Record<string, string> {
  const style: Record<string, string> = {};

  // Remove comments
  for (let startIndex = 0; (startIndex = styleText.indexOf('/*', startIndex)) !== -1; ) {
    const endIndex = styleText.indexOf('*/', startIndex + 2);

    styleText = styleText.substring(0, startIndex) + (endIndex !== -1 ? styleText.substring(endIndex + 2) : '');
  }

  // Parse declarations
  for (const declaration of styleText.split(';')) {
    const colonIndex = declaration.indexOf(':');

    if (colonIndex === -1) {
      continue;
    }

    const key = declaration.substring(0, colonIndex).trim();
    const value = declaration.substring(colonIndex + 1).trim();

    style[key.startsWith('--') ? key : key.toLowerCase().replace(/-[a-z]/g, toCamelCase)] = value;
  }

  return style;
}

function toCamelCase(str: string): string {
  return str.charAt(1).toUpperCase();
}
