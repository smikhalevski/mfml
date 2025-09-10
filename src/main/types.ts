export interface RenderingOptions<T> {
  /**
   * Renders a tag.
   *
   * @param tagName The name of a tag to render.
   * @param attributes Tag attributes.
   * @param children Tag children.
   * @returns The rendering result.
   */
  renderTag?: (
    tagName: string,
    attributes: Readonly<Record<string, ReadonlyArray<T | string> | string>>,
    children: T | string
  ) => T | string;

  numberStyles: Record<string, Intl.NumberFormatOptions>;

  dateStyles: Record<string, Intl.DateTimeFormatOptions>;

  timeStyles: Record<string, Intl.DateTimeFormatOptions>;
}
