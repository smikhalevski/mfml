import { ComponentType, createElement, ReactNode } from 'react';
import { AbstractRenderer, isLowerCaseAlpha, RendererOptions } from '../renderer.js';

export interface ReactNodeRendererOptions extends RendererOptions {
  components?: Record<string, ComponentType<any>>;
}

export class ReactNodeRenderer extends AbstractRenderer<ReactNode> {
  components: Record<string, ComponentType<any> | string>;

  constructor(options: ReactNodeRendererOptions = {}) {
    const { components = {} } = options;

    super(options);

    this.components = components;
  }

  renderElement(
    _locale: string,
    tagName: string,
    attributes: { [p: string]: readonly ReactNode[] | ReactNode },
    children: readonly ReactNode[] | ReactNode
  ): ReactNode {
    let Component = this.components[tagName];

    if (Component !== undefined) {
      if (!isLowerCaseAlpha(tagName)) {
        return null;
      }

      // DOM element
      Component = tagName;
    }

    return Array.isArray(children)
      ? createElement(Component, attributes, ...children)
      : createElement(Component, attributes, children);
  }
}
