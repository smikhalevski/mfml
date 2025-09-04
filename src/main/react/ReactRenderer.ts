import { ComponentType, createElement, ReactNode } from 'react';
import { AbstractRenderer, AbstractRendererOptions } from '../AbstractRenderer.js';
import { isLowerCaseAlpha } from '../utils.js';

/**
 * Options of an {@link ReactRenderer}.
 *
 * @group Renderer
 */
export interface ReactRendererOptions extends AbstractRendererOptions {
  /**
   * Mapping from a tag name to a React component that should be rendered.
   */
  components?: Record<string, ComponentType<any>>;
}

/**
 * Message renderer that produces React nodes.
 *
 * @group Renderer
 */
export class ReactRenderer extends AbstractRenderer<ReactNode> {
  /**
   * Mapping from a tag name to a React component that should be rendered.
   */
  components: Record<string, ComponentType<any> | string>;

  /**
   * Creates a new instance of {@link ReactRenderer}.
   *
   * @param options Rendering options.
   */
  constructor(options: ReactRendererOptions = {}) {
    const { components = {} } = options;

    super(options);

    this.components = components;
  }

  renderElement(_locale: string, tagName: string, attributes: Record<string, string>, children: ReactNode): ReactNode {
    let component = this.components[tagName];

    if (component === undefined) {
      if (!isLowerCaseAlpha(tagName)) {
        // Ignore unknown custom elements
        return null;
      }

      // React DOM element
      component = tagName;
    }

    if (Array.isArray(children)) {
      return createElement(component, attributes, ...children);
    }

    return createElement(component, attributes, children);
  }
}
