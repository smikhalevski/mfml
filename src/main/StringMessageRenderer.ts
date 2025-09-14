import { AbstractMessageRenderer } from './AbstractMessageRenderer.js';
import { isLowerCaseAlpha } from './utils.js';
import { MessageRendererOptions } from './types.js';

export type StringComponentType = (attributes: Record<string, string>, children: string[]) => string;

/**
 * Options of the {@link StringMessageRenderer} class.
 */
export interface StringMessageRendererOptions extends MessageRendererOptions {
  /**
   * Mapping from a tag name to a string element renderer.
   */
  components?: Record<string, StringComponentType>;
}

/**
 * Message renderer that produces only strings
 */
export class StringMessageRenderer extends AbstractMessageRenderer<string> {
  /**
   * Mapping from a tag name to a string element renderer.
   */
  components: Record<string, StringComponentType>;

  /**
   * Creates a new instance of {@link StringMessageRenderer}.
   *
   * @param options Rendering options.
   */
  constructor(options: StringMessageRendererOptions = {}) {
    const { components = {} } = options;

    super(options);

    this.components = components;
  }

  renderElement(_locale: string, tagName: string, attributes: Record<string, string>, children: string[]): string {
    const component = this.components[tagName];

    if (component === undefined) {
      // Don't render custom elements by default
      return !isLowerCaseAlpha(tagName) ? '' : children.join('');
    }

    return component(attributes, children);
  }
}
