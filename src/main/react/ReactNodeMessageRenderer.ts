import { ComponentType, createElement, ReactNode } from 'react';
import { MessageRendererOptions } from '../types.js';
import { AbstractMessageRenderer } from '../AbstractMessageRenderer.js';
import { isLowerCaseAlpha } from '../utils.js';

/**
 * Options of an {@link ReactNodeMessageRenderer} class.
 */
export interface ReactNodeMessageRendererOptions extends MessageRendererOptions {
  /**
   * Mapping from a tag name to a React component that should be rendered.
   */
  components?: Record<string, ComponentType<any>>;
}

export class ReactNodeMessageRenderer extends AbstractMessageRenderer<ReactNode> {
  /**
   * Mapping from a tag name to a React component that should be rendered.
   */
  components: Record<string, ComponentType<any> | string>;

  /**
   * Creates a new instance of {@link ReactNodeMessageRenderer}.
   *
   * @param options Rendering options.
   */
  constructor(options: ReactNodeMessageRendererOptions = {}) {
    const { components = {} } = options;

    super(options);

    this.components = components;
  }

  renderText(_locale: string, text: string): ReactNode {
    return text;
  }

  renderElement(
    _locale: string,
    tagName: string,
    attributes: { [p: string]: readonly ReactNode[] | ReactNode },
    children: readonly ReactNode[] | ReactNode
  ): ReactNode {
    let component = this.components[tagName];

    if (component === undefined) {
      if (!isLowerCaseAlpha(tagName)) {
        return null;
      }

      // DOM element
      component = tagName;
    }

    return Array.isArray(children)
      ? createElement(component, attributes, ...children)
      : createElement(component, attributes, children);
  }
}
