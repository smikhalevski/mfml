import { Postprocessor } from '../compiler/index.js';
import { walkNode } from '../utils.js';

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
   * @param category A category to rename ("one", "many", "other", "=5").
   * @param argumentType A type of the select ("plural", "selectordinal") processed with {@link renameArgumentType}.
   * @returns The new select category name.
   */
  renameCategory?: (category: string, argumentType: string) => string;
}

export default function rename(options: RenameOptions): Postprocessor {
  const {
    renameTag = identity,
    renameAttribute = identity,
    renameArgument = identity,
    renameArgumentType = identity,
    renameArgumentStyle = identity,
    renameCategory = identity,
  } = options;

  return options => {
    walkNode(options.messageNode, node => {
      switch (node.nodeType) {
        case 'element':
          node.tagName = renameTag(node.tagName);
          break;

        case 'attribute':
          node.name = renameAttribute(node.name, node.parentNode!.tagName);
          break;

        case 'argument':
          node.name = renameArgument(node.name);

          if (node.typeNode !== null) {
            node.typeNode.value = renameArgumentType(node.typeNode.value, node.name);
          }

          if (node.styleNode !== null) {
            node.styleNode.value = renameArgumentStyle(node.styleNode.value, node.name);
          }

          if (node.categoryNodes !== null) {
            for (const categoryNode of node.categoryNodes) {
              categoryNode.name = renameCategory(categoryNode.name, node.typeNode!.value);
            }
          }
          break;
      }
    });

    return options.messageNode;
  };
}

function identity(value: string): string {
  return value;
}
