/**
 * Describes how elements of a message AST are rendered.
 *
 * @template T The rendering result (string, `ReactNode`).
 */
export interface MessageRenderer<T> {
  /**
   * Renders plain text.
   *
   * @param locale The message locale.
   * @param text The text to render.
   * @returns Rendering result,
   */
  renderText(locale: string, text: string): T;

  /**
   * Renders an element.
   *
   * @param locale The message locale.
   * @param tagName The element tag name.
   * @param attributes Attributes of an element.
   * @param children Children of an element.
   * @returns Rendering result,
   */
  renderElement(
    locale: string,
    tagName: string,
    attributes: { readonly [name: string]: readonly T[] | T },
    children: readonly T[] | T
  ): T;

  /**
   * Renders an ICU argument value.
   *
   * @param locale The message locale.
   * @param argumentValue The value of an argument.
   * @param argumentType The type of an argument.
   * @param argumentStyle The formatting style to apply.
   * @returns Rendering result,
   */
  renderArgumentValue(
    locale: string,
    argumentValue: unknown,
    argumentType: string | undefined,
    argumentStyle: string | undefined
  ): T;

  /**
   * Returns the select category name depending of an ICU argument value.
   *
   * @param locale The message locale.
   * @param argumentValue The value of an argument.
   * @param selectType The type of the select node ("plural", "selectordinal", "select")
   * @param selectCategories The array of categories available in the select node.
   * @returns The selected category, or `undefined` if there's no matching category.
   */
  selectCategory(
    locale: string,
    argumentValue: unknown,
    selectType: string,
    selectCategories: readonly string[]
  ): string | undefined;
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
