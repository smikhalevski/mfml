import { AbstractMessageRenderer } from './AbstractMessageRenderer.js';
import { isLowerCaseAlpha } from './utils.js';
import { MessageRendererOptions } from './types.js';

export type StringComponentType = (
  attributes: { readonly [name: string]: string[] | string },
  children: readonly string[] | string
) => string;

/**
 * Options of the {@link StringMessageRenderer} class.
 */
export interface StringMessageRendererOptions extends MessageRendererOptions {
  /**
   * Mapping from a tag name to a string element renderer.
   */
  components?: Record<string, StringComponentType>;

  /**
   * If `true` then newlines and whitespaces are compressed into a single space.
   *
   * @default false
   */
  isSpacesCompressed?: boolean;
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
   * If `true` then newlines and whitespaces are compressed into a single space.
   */
  isSpacesCompressed;

  /**
   * Creates a new instance of {@link StringMessageRenderer}.
   *
   * @param options Rendering options.
   */
  constructor(options: StringMessageRendererOptions = {}) {
    const { components = {}, isSpacesCompressed = false } = options;

    super(options);

    this.components = components;
    this.isSpacesCompressed = isSpacesCompressed;
  }

  renderText(_locale: string, text: string): string {
    return this.isSpacesCompressed ? text.replace(/[\n\r\s\t]+/g, ' ') : text;
  }

  renderElement(
    _locale: string,
    tagName: string,
    attributes: { readonly [name: string]: string[] | string },
    children: readonly string[] | string
  ): string {
    const component = this.components[tagName];

    if (component === undefined) {
      // Don't render custom elements by default
      return !isLowerCaseAlpha(tagName) ? '' : typeof children === 'string' ? children : children.join('');
    }

    return component(attributes, children);
  }
}
