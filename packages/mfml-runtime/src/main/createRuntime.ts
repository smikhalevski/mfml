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
   * If omitted then {@link renderArgument} is used.
   */
  renderFunction?: FunctionRenderer<Result | string>;

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
  const {renderArgument} = options;

  return {
    [RuntimeMethod.ELEMENT]: options.renderElement,
    [RuntimeMethod.FRAGMENT]: options.renderFragment,
    [RuntimeMethod.ARGUMENT]: renderArgument,
    [RuntimeMethod.FUNCTION]: options.renderFunction || renderArgument,
    [RuntimeMethod.LOCALE]: options.matchLocale || matchLocale,
    [RuntimeMethod.SELECT]: options.matchSelect || selectMatcher,
    [RuntimeMethod.PLURAL]: options.matchPlural || createPluralMatcher('cardinal'),
    [RuntimeMethod.SELECT_ORDINAL]: options.matchSelectOrdinal || createPluralMatcher('ordinal'),
  };
}
