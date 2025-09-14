/**
 * Describes how elements of a message AST are rendered.
 *
 * @template T The rendering result (string, `ReactNode`).
 */
export interface MessageRenderer<T> {
  /**
   * Renders an element.
   *
   * @param locale The message locale.
   * @param tagName The element tag name.
   * @param attributes Attributes of an element.
   * @param children Children of an element.
   * @returns Rendering result.
   */
  renderElement(locale: string, tagName: string, attributes: Record<string, string>, children: T[]): T;

  /**
   * Formats argument value as a string.
   *
   * @param locale The message locale.
   * @param value The value of an argument.
   * @param type The type of an argument.
   * @param style The formatting style to apply.
   * @returns Formatted argument value.
   */
  formatArgument(locale: string, value: unknown, type: string | undefined, style: string | undefined): string;

  /**
   * Returns the select category name depending of an ICU argument value.
   *
   * @param locale The message locale.
   * @param value The value of an argument.
   * @param type The type of the select node ("plural", "selectordinal", "select")
   * @param categories The array of categories available in the select node.
   * @returns The selected category, or `undefined` if there's no matching category.
   */
  selectCategory(locale: string, value: unknown, type: string, categories: string[]): string | undefined;
}

/**
 * Options of an {@link AbstractMessageRenderer} class.
 */
export interface MessageRendererOptions {
  /**
   * Number formatting styles.
   */
  numberStyles?: Record<string, Intl.NumberFormatOptions>;

  /**
   * Date formatting styles.
   */
  dateStyles?: Record<string, Intl.DateTimeFormatOptions>;

  /**
   * Time formatting styles.
   */
  timeStyles?: Record<string, Intl.DateTimeFormatOptions>;
}
