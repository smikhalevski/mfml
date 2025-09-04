import { Postprocessor } from '../compiler/index.js';
import { walkNode } from '../utils.js';
import { ParserError } from '../parser/index.js';

/**
 * Requirements imposed on a type by {@link allowTypes}.
 */
export interface TypeRequirements {
  /**
   * The array of styles that a type supports. If omitted or empty then no styles are allowed.
   *
   * @example
   * ['decimal', 'percent']
   */
  allowedStyles?: string[];

  /**
   * The array of option names that a type supports. If omitted or empty then options aren't allowed.
   *
   * @example
   * ['currencyDisplay', 'useGrouping', 'minimumIntegerDigits']
   */
  allowedOptions?: string[];

  /**
   * The array of category names that a type supports. If omitted or empty then categories aren't allowed.
   *
   * @example
   * ['one', 'many', 'few', 'other']
   */
  allowedCategories?: string[];

  /**
   * The array of categories that are required.
   *
   * @example
   * ['other']
   */
  requiredCategories?: string[];

  /**
   * If `true` then style is always required.
   *
   * @default false
   */
  isStyleRequired?: boolean;

  /**
   * If `true` then at least one category from {@link allowedCategories} is required.
   *
   * Ignored if {@link requiredCategories} are non-empty.
   *
   * @default false
   */
  isCategoryRequired?: boolean;
}

/**
 * Restricts what styles, options and categories are allowed for a particular argument type.
 *
 * @example
 * allowTypes({
 *   number: {
 *     allowedStyles: ['decimal', 'percent'],
 *     allowedOptions: ['currencyDisplay', 'useGrouping', 'minimumIntegerDigits'],
 *   },
 *   selectordinal: {
 *     allowedCategories: ['one', 'many', 'few', 'other'],
 *     requiredCategories: ['other']
 *   }
 * });
 *
 * @param allowedTypes Mapping from an attribute type to a set of requirements.
 */
export default function allowTypes(allowedTypes: { [type: string]: TypeRequirements }): Postprocessor {
  const errors: ParserError[] = [];

  return params => {
    walkNode(params.messageNode, node => {
      if (node.nodeType !== 'argument' || node.typeNode === null) {
        return;
      }

      const { typeNode, styleNode, optionNodes, categoryNodes } = node;

      if (!allowedTypes.hasOwnProperty(typeNode.value)) {
        errors.push(
          new ParserError(
            'The argument type "' + typeNode.value + '" is not allowed.',
            params.text,
            typeNode.startIndex,
            typeNode.endIndex
          )
        );
        return;
      }

      const {
        allowedStyles,
        allowedOptions,
        allowedCategories,
        requiredCategories,
        isStyleRequired,
        isCategoryRequired,
      } = allowedTypes[typeNode.value];

      const hasStyle = styleNode !== null;
      const hasOptions = optionNodes !== null && optionNodes.length !== 0;
      const hasCategories = categoryNodes !== null && categoryNodes.length !== 0;

      const hasAllowedStyles = allowedStyles !== undefined && allowedStyles.length !== 0;
      const hasAllowedOptions = allowedOptions !== undefined && allowedOptions.length !== 0;
      const hasAllowedCategories = allowedCategories !== undefined && allowedCategories.length !== 0;
      const hasRequiredCategories = requiredCategories !== undefined && requiredCategories.length !== 0;

      if (!hasStyle && hasAllowedStyles && isStyleRequired) {
        errors.push(
          new ParserError(
            'The argument type "' + typeNode.value + '" requires a style: ' + allowedStyles.join(', ') + '.',
            params.text,
            typeNode.startIndex,
            typeNode.endIndex
          )
        );
      }

      if (hasStyle && !hasAllowedStyles) {
        errors.push(
          new ParserError(
            'The argument type "' + typeNode.value + '" does not support styles.',
            params.text,
            typeNode.startIndex,
            typeNode.endIndex
          )
        );
      }

      if (hasStyle && hasAllowedStyles && !allowedStyles.includes(styleNode.value)) {
        errors.push(
          new ParserError(
            'The argument type "' +
              typeNode.value +
              '" does not support style "' +
              styleNode.value +
              '", expected one of: ' +
              allowedStyles.join(', ') +
              '.',
            params.text,
            styleNode.startIndex,
            styleNode.endIndex
          )
        );
      }

      if (hasOptions && !hasAllowedOptions) {
        errors.push(
          new ParserError(
            'The argument type "' + typeNode.value + '" does not allow options.',
            params.text,
            typeNode.startIndex,
            typeNode.endIndex
          )
        );
      }

      if (hasOptions && hasAllowedOptions) {
        for (const optionNode of optionNodes) {
          if (allowedOptions.includes(optionNode.name)) {
            continue;
          }

          errors.push(
            new ParserError(
              'The option "' +
                optionNode.name +
                '" is not allowed for argument type "' +
                typeNode.value +
                '", expected one of: ' +
                allowedOptions.join(', ') +
                '.',
              params.text,
              optionNode.startIndex,
              optionNode.endIndex
            )
          );
        }
      }

      if (!hasCategories && hasAllowedCategories && isCategoryRequired && !hasRequiredCategories) {
        errors.push(
          new ParserError(
            'The argument type "' +
              typeNode.value +
              '" requires at least one category: ' +
              allowedCategories.join(', ') +
              '.',
            params.text,
            typeNode.startIndex,
            typeNode.endIndex
          )
        );
      }

      if (hasCategories && !hasAllowedCategories) {
        errors.push(
          new ParserError(
            'The argument type "' + typeNode.value + '" does not allow categories.',
            params.text,
            typeNode.startIndex,
            typeNode.endIndex
          )
        );
      }

      if (hasCategories && hasAllowedCategories) {
        for (const categoryNode of categoryNodes) {
          if (allowedCategories.includes(categoryNode.name)) {
            continue;
          }

          errors.push(
            new ParserError(
              'The category "' +
                categoryNode.name +
                '" is not allowed for argument type "' +
                typeNode.value +
                '", expected one of: ' +
                allowedCategories.join(', ') +
                '.',
              params.text,
              categoryNode.startIndex,
              categoryNode.endIndex
            )
          );
        }
      }

      if (hasRequiredCategories) {
        let missingCategories;

        if (hasCategories) {
          missingCategories = [];

          nextRequiredCategory: for (const category of requiredCategories) {
            for (const categoryNode of categoryNodes) {
              if (categoryNode.name === category) {
                continue nextRequiredCategory;
              }
            }
            missingCategories.push(category);
          }
        } else {
          missingCategories = requiredCategories;
        }

        if (missingCategories.length !== 0) {
          errors.push(
            new ParserError(
              'The argument type "' + typeNode.value + '" requires categories: ' + missingCategories.join(', ') + '.',
              params.text,
              typeNode.startIndex,
              typeNode.endIndex
            )
          );
        }
      }
    });

    if (errors.length !== 0) {
      throw new AggregateError(errors);
    }

    return params.messageNode;
  };
}
