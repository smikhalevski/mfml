/**
 * The postprocessor that restricts what argument styles, options and categories are allowed for a particular
 * argument type.
 *
 * @module mfml/postprocessor/allowTypes
 */

import { Postprocessor } from '../compiler/index.js';
import { walkNode } from '../utils.js';
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
   *
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
   *
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
   *
   * @default false
   */
  allowedCategories?: string[] | boolean;

  /**
   * The array of categories that are required, or `true` if at least one category is required.
   *
   * @example
   * ['other']
   *
   * @default false
   */
  requiredCategories?: string[] | boolean;

  /**
   * If `true` then style is always required and options and categories requirements are ignored.
   *
   * @default false
   */
  isStyleRequired?: boolean;
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

      const { allowedStyles, allowedOptions, allowedCategories, requiredCategories, isStyleRequired } =
        allowedTypes[typeNode.value];

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
      const areCategoriesRequired = hasRequiredCategories || requiredCategories === true;

      if (!hasStyle && isStyleRequired) {
        errors.push(
          new ParserError(
            'The argument type "' +
              typeNode.value +
              '" requires a style' +
              (hasAllowedStyles ? ': ' + allowedStyles.join(', ') : '') +
              '.',
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

      if (isStyleRequired) {
        // The presence of an argument style allows for neither options nor categories
        return;
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

      if (!hasCategories && areCategoriesRequired) {
        errors.push(
          new ParserError(
            'The argument type "' +
              typeNode.value +
              '" requires at least one category' +
              (hasAllowedCategories ? ': ' + allowedCategories.join(', ') : '') +
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
 *
 * <dl>
 *
 * <dt><code>number</code></dt>
 * <dd>
 *
 * Formats argument as a number.
 *
 * Allowed style:
 * - `decimal`
 * - `integer`
 * - `percent`
 * - `currency`
 *
 * Allowed options:
 * - [`style`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#style)
 * - [`currency`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#currency)
 * - [`currencyDisplay`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#currencydisplay)
 * - [`currencySign`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#currencysign)
 * - [`useGrouping`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#usegrouping)
 * - [`minimumIntegerDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumintegerdigits)
 * - [`minimumFractionDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumfractiondigits)
 * - [`maximumFractionDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#maximumfractiondigits)
 * - [`minimumSignificantDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumsignificantdigits)
 * - [`maximumSignificantDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#maximumsignificantdigits)
 * - [`numberingSystem`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#numberingsystem)
 * - [`compactDisplay`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#compactdisplay)
 * - [`notation`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#notation)
 * - [`signDisplay`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#signdisplay)
 * - [`unit`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#unit)
 * - [`unitDisplay`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#unitdisplay)
 *
 * </dd>
 *
 * <dt><code>date</code></dt>
 * <dd>
 *
 * Formats argument as a date.
 *
 * Allowed style:
 * - `short`
 * - `full`
 * - `long`
 * - `medium`
 *
 * Allowed options:
 * - [`calendar`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#calendar)
 * - [`dayPeriod`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#dayperiod)
 * - [`numberingSystem`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#numberingsystem)
 * - [`dateStyle`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#datestyle)
 * - [`timeStyle`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timestyle)
 * - [`hourCycle`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hourcycle)
 * - [`weekday`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#weekday)
 * - [`era`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#era)
 * - [`year`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#year)
 * - [`month`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#month)
 * - [`day`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#day)
 * - [`hour`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hour)
 * - [`minute`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#minute)
 * - [`second`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#second)
 * - [`timeZoneName`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timezonename)
 * - [`formatMatcher`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#formatmatcher)
 * - [`hour12`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hour12)
 * - [`timeZone`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timezone)
 *
 * </dd>
 *
 * <dt><code>time</code></dt>
 * <dd>
 *
 * Formats argument as a time.
 *
 * Allowed style:
 * - `short`
 * - `full`
 * - `long`
 * - `medium`
 *
 * Allowed options:
 * - [`calendar`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#calendar)
 * - [`dayPeriod`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#dayperiod)
 * - [`numberingSystem`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#numberingsystem)
 * - [`dateStyle`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#datestyle)
 * - [`timeStyle`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timestyle)
 * - [`hourCycle`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hourcycle)
 * - [`weekday`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#weekday)
 * - [`era`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#era)
 * - [`year`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#year)
 * - [`month`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#month)
 * - [`day`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#day)
 * - [`hour`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hour)
 * - [`minute`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#minute)
 * - [`second`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#second)
 * - [`timeZoneName`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timezonename)
 * - [`formatMatcher`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#formatmatcher)
 * - [`hour12`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#hour12)
 * - [`timeZone`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat#timezone)
 *
 * </dd>
 *
 * <dt><code>conjunction</code></dt>
 * <dd>
 *
 * Formats argument as a list of strings joined by "and".
 *
 * Allowed style:
 * - `long`
 * - `narrow`
 * - `short`
 *
 * </dd>
 *
 * <dt><code>disjunction</code></dt>
 * <dd>
 *
 * Formats argument as a list of strings joined by "or".
 *
 * Allowed style:
 * - `long`
 * - `narrow`
 * - `short`
 *
 * </dd>
 *
 * <dt><code>plural</code></dt>
 * <dd>
 *
 * Selects a cardinal plural category using on an argument value.
 *
 * Allowed style:
 * - `short`
 * - `full`
 * - `long`
 * - `medium`
 *
 * Allowed options:
 * - [`minimumIntegerDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumintegerdigits)
 * - [`minimumFractionDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumfractiondigits)
 * - [`maximumFractionDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#maximumfractiondigits)
 * - [`minimumSignificantDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumsignificantdigits)
 * - [`maximumSignificantDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#maximumsignificantdigits)
 *
 * Allowed categories:
 * - `zero`
 * - `one`
 * - `two`
 * - `few`
 * - `many`
 * - `other`, required
 *
 * </dd>
 *
 * <dt><code>selectOrdinal</code></dt>
 * <dd>
 *
 * Selects an ordinal plural category using on an argument value.
 *
 * Allowed style:
 * - `short`
 * - `full`
 * - `long`
 * - `medium`
 *
 * Allowed options:
 * - [`minimumIntegerDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumintegerdigits)
 * - [`minimumFractionDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumfractiondigits)
 * - [`maximumFractionDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#maximumfractiondigits)
 * - [`minimumSignificantDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#minimumsignificantdigits)
 * - [`maximumSignificantDigits`](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat#maximumsignificantdigits)
 *
 * Allowed categories:
 * - `zero`
 * - `one`
 * - `two`
 * - `few`
 * - `many`
 * - `other`, required
 *
 * </dd>
 *
 * <dt><code>select</code></dt>
 * <dd>
 *
 * Selects a category using on an argument value.
 *
 * Any categories, requires `other` category.
 *
 * </dd>
 *
 * </dl>
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
