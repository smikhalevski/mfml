export interface RenameOptions {
  /**
   * Renames an XML tag.
   *
   * @param tagName A tag to rename.
   * @returns The new tag name.
   */
  renameTag?: (tagName: string) => string;

  /**
   * Renames an XML attribute.
   *
   * @param attributeName An attribute to rename.
   * @param tagName An tag name that was processed with {@link renameTag}.
   * @returns The new attribute name.
   */
  renameAttribute?: (attributeName: string, tagName: string) => string;

  /**
   * Renames an ICU arguments.
   *
   * @param argumentName An argument to rename.
   * @returns The new argument name.
   */
  renameArgument?: (argumentName: string) => string;

  /**
   * Renames an ICU argument type.
   *
   * @param argumentType An argument type to rename ("number", "date", "time").
   * @param argumentName An argument name that was processed with {@link renameArgument}.
   * @returns The new argument type name.
   */
  renameArgumentType?: (argumentType: string, argumentName: string) => string;

  /**
   * Renames an ICU argument style.
   *
   * @param argumentStyle An argument style to rename.
   * @param argumentType An argument type that was processed with {@link renameArgumentType}.
   * @returns The new argument style name.
   */
  renameArgumentStyle?: (argumentStyle: string, argumentType: string) => string;

  /**
   * Renames an ICU select category.
   *
   * @param selectType The type of the select ("plural", "selectordinal", "select").
   * @param argumentName An argument name that was processed with {@link renameArgument}.
   * @returns The new select type name.
   */
  renameSelectType?: (selectType: string, argumentName: string) => string;

  /**
   * Renames an ICU select category.
   *
   * @param selectCategory A category to rename ("one", "many", "other", "=5").
   * @param selectType A type of the select ("plural", "selectordinal") processed with {@link renameSelectType}.
   * @returns The new select category name.
   */
  renameSelectCategory?: (selectCategory: string, selectType: string) => string;

  /**
   * Decode text content before it is pushed to an MFML AST node. Use this method to decode HTML entities.
   *
   * @param text Text to decode.
   */
  decodeText?: (text: string) => string;
}
