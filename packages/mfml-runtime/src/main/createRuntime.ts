import {
  ArgumentRenderer,
  ElementRenderer,
  FragmentRenderer,
  FunctionRenderer,
  IRuntime,
  LocaleMatcher,
  PluralMatcher,
  RuntimeMethod,
  SelectMatcher,
  SelectOrdinalMatcher,
} from './runtime-types';
import {matchLocale} from 'locale-matcher';
import {selectMatcher} from './selectMatcher';
import {createPluralMatcher} from './createPluralMatcher';

export interface IRuntimeOptions<Result> {
  renderElement: ElementRenderer<Result | string>;
  renderFragment: FragmentRenderer<Result | string>;
  renderArgument: ArgumentRenderer<Result | string>;

  /**
   * By default, {@link renderArgument} is used.
   */
  renderFunction?: FunctionRenderer<Result | string>;

  /**
   * Renders a fragment nested inside an attribute.
   *
   * By default, {@link renderFragment} is used.
   */
  renderAttributeFragment?: FragmentRenderer<Result | string>;

  /**
   * Renders an argument nested inside an attribute.
   *
   * By default, {@link renderArgument} is used.
   */
  renderAttributeArgument?: ArgumentRenderer<Result | string>;

  /**
   * Renders an argument value formatted using a function inside an attribute.
   *
   * By default, {@link renderFunction} is used.
   */
  renderAttributeFunction?: FunctionRenderer<Result | string>;

  /**
   * By default, [`locale-matcher`](https://github.com/smikhalevski/locale-matcher) is used.
   */
  matchLocale?: LocaleMatcher;

  /**
   * By default, uses exact match algorithm to match select keys.
   */
  matchSelect?: SelectMatcher;

  /**
   * By default, uses `Intl.PluralRules` to resolve the plural category.
   */
  matchPlural?: PluralMatcher;

  /**
   * By default, uses `Intl.PluralRules` to resolve the plural category.
   */
  matchSelectOrdinal?: SelectOrdinalMatcher;
}

/**
 * Creates the new runtime.
 */
export function createRuntime<Result>(options: IRuntimeOptions<Result>): IRuntime<Result> {
  const {renderFragment, renderFunction, renderArgument} = options;

  return {
    [RuntimeMethod.ELEMENT]: options.renderElement,
    [RuntimeMethod.FRAGMENT]: options.renderFragment,
    [RuntimeMethod.ARGUMENT]: renderArgument,
    [RuntimeMethod.FUNCTION]: renderFunction || renderArgument,
    [RuntimeMethod.ATTRIBUTE_FRAGMENT]: options.renderAttributeFragment || renderFragment,
    [RuntimeMethod.ATTRIBUTE_ARGUMENT]: options.renderAttributeArgument || renderArgument,
    [RuntimeMethod.ATTRIBUTE_FUNCTION]: options.renderAttributeFunction || renderFunction || renderArgument,
    [RuntimeMethod.LOCALE]: options.matchLocale || matchLocale,
    [RuntimeMethod.SELECT]: options.matchSelect || selectMatcher,
    [RuntimeMethod.PLURAL]: options.matchPlural || createPluralMatcher('cardinal'),
    [RuntimeMethod.SELECT_ORDINAL]: options.matchSelectOrdinal || createPluralMatcher('ordinal'),
  };
}
