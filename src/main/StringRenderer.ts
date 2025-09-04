import { AbstractRenderer, AbstractRendererOptions } from './AbstractRenderer.js';
import { isLowerCaseAlpha } from './utils.js';

/**
 * Used by {@link StringRenderer} to renders custom elements.
 *
 * @group Renderer
 */
export type StringComponentType = (attributes: Record<string, string>, children: string[]) => string;

/**
 * Options of the {@link StringRenderer}.
 *
 * @group Renderer
 */
export interface StringRendererOptions extends AbstractRendererOptions {
  /**
   * Mapping from a tag name to a string element renderer.
   */
  components?: Record<string, StringComponentType>;
}

/**
 * Message renderer that produces only strings.
 *
 * @group Renderer
 */
export class StringRenderer extends AbstractRenderer<string> {
  /**
   * Mapping from a tag name to a string element renderer.
   */
  components;

  /**
   * Creates a new instance of {@link StringRenderer}.
   *
   * @param options Rendering options.
   */
  constructor(options: StringRendererOptions = {}) {
    const { components = {} } = options;

    super(options);

    this.components = components;
  }

  renderElement(_locale: string, tagName: string, attributes: Record<string, string>, children: string[]): string {
    const component = this.components[tagName];

    if (component === undefined) {
      // Ignore unknown custom elements
      return isLowerCaseAlpha(tagName) ? children.join('') : '';
    }

    return component(attributes, children);
  }
}
