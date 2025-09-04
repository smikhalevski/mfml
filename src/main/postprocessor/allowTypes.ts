import { Postprocessor } from '../compiler/index.js';
import { walkNode } from '../utils.js';
import { ParserError } from '../parser/index.js';

/**
 * Restricts what styles, options and categories are allowed for a particular argument type.
 *
 * @example
 * allowTypes({
 *   number: {
 *     allowedStyles: ['percent', 'currency', null],
 *     allowedOptions: ['maximumFractionDigits', 'currency'],
 *   },
 *   selectordinal: {
 *     allowedCategories: ['one', 'many', 'other'],
 *     requiredCategories: ['other']
 *   }
 * });
 *
 * @param allowedTypes Mapping from an attribute type to a set of requirements.
 */
export default function allowTypes(allowedTypes: {
  [type: string]: {
    allowedStyles?: Array<string | null>;
    allowedOptions?: string[];
    allowedCategories?: string[];
    requiredCategories?: string[];
  };
}): Postprocessor {
  return options => {
    walkNode(options.messageNode, node => {
      if (node.nodeType !== 'argument' || node.typeNode === null) {
        return;
      }

      const { typeNode, styleNode, optionNodes, categoryNodes } = node;

      if (!allowedTypes.hasOwnProperty(typeNode.value)) {
        throw new ParserError(
          'The argument type "' + typeNode.value + '" is not allowed.',
          options.text,
          typeNode.startIndex,
          typeNode.endIndex
        );
      }

      const { allowedStyles, allowedOptions, allowedCategories, requiredCategories } = allowedTypes[typeNode.value];

      const errors = [];

      if (styleNode !== null && (allowedStyles === undefined || allowedStyles.length === 0)) {
        errors.push(
          new ParserError(
            'The argument type "' + typeNode.value + '" does not support styles.',
            options.text,
            typeNode.startIndex,
            typeNode.endIndex
          )
        );
      }

      if (styleNode === null && allowedStyles !== undefined && !allowedStyles.includes(null)) {
        errors.push(
          new ParserError(
            'The argument type "' + typeNode.value + '" must have a style: ' + allowedStyles.join(', ') + '.',
            options.text,
            typeNode.startIndex,
            typeNode.endIndex
          )
        );
      }

      if (styleNode !== null && allowedStyles !== undefined && !allowedStyles.includes(styleNode.value)) {
        errors.push(
          new ParserError(
            'The argument type "' +
              typeNode.value +
              '" does not support style "' +
              styleNode.value +
              '", expected one of: ' +
              allowedStyles.join(', ') +
              '.',
            options.text,
            styleNode.startIndex,
            styleNode.endIndex
          )
        );
      }

      if (
        optionNodes !== null &&
        optionNodes.length !== 0 &&
        (allowedOptions === undefined || allowedOptions.length === 0)
      ) {
        errors.push(
          new ParserError(
            'The argument type "' + typeNode.value + '" does not allow options.',
            options.text,
            typeNode.startIndex,
            typeNode.endIndex
          )
        );
      }

      if (optionNodes !== null && allowedOptions !== undefined && allowedOptions.length !== 0) {
        for (const optionNode of optionNodes) {
          if (allowedOptions.includes(optionNode.name)) {
            continue;
          }

          errors.push(
            new ParserError(
              'The option "' + optionNode.name + '" is not allowed for argument type "' + typeNode.value + '".',
              options.text,
              optionNode.startIndex,
              optionNode.endIndex
            )
          );
        }
      }

      if (
        categoryNodes !== null &&
        categoryNodes.length !== 0 &&
        (allowedCategories === undefined || allowedCategories.length === 0)
      ) {
        errors.push(
          new ParserError(
            'The argument type "' + typeNode.value + '" does not allow categories.',
            options.text,
            typeNode.startIndex,
            typeNode.endIndex
          )
        );
      }

      if (categoryNodes !== null && allowedCategories !== undefined && allowedCategories.length !== 0) {
        for (const categoryNode of categoryNodes) {
          if (allowedCategories.includes(categoryNode.name)) {
            continue;
          }

          errors.push(
            new ParserError(
              'The category "' + categoryNode.name + '" is not allowed for argument type "' + typeNode.value + '".',
              options.text,
              categoryNode.startIndex,
              categoryNode.endIndex
            )
          );
        }
      }

      if (requiredCategories !== undefined) {
        nextCategory: for (const categoryName of requiredCategories) {
          if (categoryNodes !== null) {
            for (const categoryNode of categoryNodes) {
              if (categoryNode.name === categoryName) {
                continue nextCategory;
              }
            }
          }

          errors.push(
            new ParserError(
              'The category "' + categoryName + '" is required for argument type "' + typeNode.value + '".',
              options.text,
              typeNode.startIndex,
              typeNode.endIndex
            )
          );
        }
      }

      if (errors.length !== 0) {
        throw new AggregateError(errors);
      }
    });

    return options.messageNode;
  };
}
