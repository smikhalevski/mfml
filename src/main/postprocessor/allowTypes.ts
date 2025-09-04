/**
 * The postprocessor that restricts what argument styles, options and categories are allowed for a particular
 * argument type.
 *
 * @module mfml/postprocessor/allowTypes
 */

import { Postprocessor } from '../compiler/index.js';
import { walkNode } from '../utils-ast.js';
import { ParserError } from '../parser/index.js';

/**
 * Type requirements by type name.
 */
export interface AllowedTypes {
  [type: string]: TypeRequirements;
}

/**
 * Requirements imposed on a type by {@link allowTypes}.
 */
export interface TypeRequirements {
  /**
   * The array of styles that a type allows, or `true` if any style is allowed.
   *
   * If  empty or `false` then no styles are allowed.
   *
   * @example
   * ['decimal', 'percent']
   * @default false
   */
  allowedStyles?: string[] | boolean;

  /**
   * The array of option names that a type allows, or `true` if any option is allowed.
   *
   * If  empty or `false` then options aren't allowed.
   *
   * @example
   * ['currencyDisplay', 'useGrouping', 'minimumIntegerDigits']
   * @default false
   */
  allowedOptions?: string[] | boolean;

  /**
   * The array of category names that a type allows, or `true` if any category is allowed.
   *
   * If  empty or `false` then categories aren't allowed.
   *
   * @example
   * ['one', 'many', 'few', 'other']
   * @default false
   */
  allowedCategories?: string[] | boolean;

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
 * Restricts what argument styles, options and categories are allowed for a particular argument type.
 *
 * @example
 * allowTypes({
 *   number: {
 *     allowedStyles: ['decimal', 'percent'],
 *     allowedOptions: ['currencyDisplay', 'useGrouping', 'minimumIntegerDigits'],
 *   },
 *   selectOrdinal: {
 *     allowedCategories: ['one', 'many', 'few', 'other'],
 *     requiredCategories: ['other']
 *   }
 * });
 *
 * @example
 * import allowTypes, { defaultAllowedTypes } from 'mfml/postprocessor/allowTypes';
 *
 * allowTypes(defaultAllowedTypes);
 *
 * @param allowedTypes Mapping from an attribute type to a set of requirements.
 * @see {@link defaultAllowedTypes}
 */
export default function allowTypes(allowedTypes: { [type: string]: TypeRequirements }): Postprocessor {
  return params => {
    const errors: ParserError[] = [];

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

      const hasAllowedStyles = Array.isArray(allowedStyles) && allowedStyles.length !== 0;
      const hasAllowedOptions = Array.isArray(allowedOptions) && allowedOptions.length !== 0;
      const hasAllowedCategories = Array.isArray(allowedCategories) && allowedCategories.length !== 0;
      const hasRequiredCategories = Array.isArray(requiredCategories) && requiredCategories.length !== 0;

      const areStylesAllowed = hasAllowedStyles || allowedStyles === true;
      const areOptionsAllowed = hasAllowedOptions || allowedOptions === true;
      const areCategoriesAllowed = hasAllowedCategories || allowedCategories === true;

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

      if (hasStyle && !areStylesAllowed) {
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

      if (hasOptions && !areOptionsAllowed) {
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

      if (hasCategories && !areCategoriesAllowed) {
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

/**
 * Allowed types that can be passed to {@link allowTypes} preprocessor to match
 * the {@link mfml!defaultArgumentFormatter defaultArgumentFormatter} setup.
 */
export const defaultAllowedTypes: AllowedTypes = {
  number: {
    allowedStyles: ['decimal', 'integer', 'percent', 'currency'],
    allowedOptions: [
      'style',
      'currency',
      'currencyDisplay',
      'currencySign',
      'useGrouping',
      'minimumIntegerDigits',
      'minimumFractionDigits',
      'maximumFractionDigits',
      'minimumSignificantDigits',
      'maximumSignificantDigits',
      'numberingSystem',
      'compactDisplay',
      'notation',
      'signDisplay',
      'unit',
      'unitDisplay',
    ],
  },
  date: {
    allowedStyles: ['short', 'full', 'long', 'medium'],
    allowedOptions: [
      'calendar',
      'dayPeriod',
      'numberingSystem',
      'dateStyle',
      'timeStyle',
      'hourCycle',
      'weekday',
      'era',
      'year',
      'month',
      'day',
      'hour',
      'minute',
      'second',
      'timeZoneName',
      'formatMatcher',
      'hour12',
      'timeZone',
    ],
  },
  time: {
    allowedStyles: ['short', 'full', 'long', 'medium'],
    allowedOptions: [
      'calendar',
      'dayPeriod',
      'numberingSystem',
      'dateStyle',
      'timeStyle',
      'hourCycle',
      'weekday',
      'era',
      'year',
      'month',
      'day',
      'hour',
      'minute',
      'second',
      'timeZoneName',
      'formatMatcher',
      'hour12',
      'timeZone',
    ],
  },
  conjunction: {
    allowedStyles: ['long', 'narrow', 'short'],
    isStyleRequired: true,
  },
  disjunction: {
    allowedStyles: ['long', 'narrow', 'short'],
    isStyleRequired: true,
  },
  plural: {
    allowedOptions: [
      'minimumIntegerDigits',
      'minimumFractionDigits',
      'maximumFractionDigits',
      'minimumSignificantDigits',
      'maximumSignificantDigits',
    ],
    allowedCategories: ['zero', 'one', 'two', 'few', 'many', 'other'],
    requiredCategories: ['other'],
  },
  selectOrdinal: {
    allowedOptions: [
      'minimumIntegerDigits',
      'minimumFractionDigits',
      'maximumFractionDigits',
      'minimumSignificantDigits',
      'maximumSignificantDigits',
    ],
    allowedCategories: ['zero', 'one', 'two', 'few', 'many', 'other'],
    requiredCategories: ['other'],
  },
  select: {
    allowedCategories: true,
    requiredCategories: ['other'],
  },
};
