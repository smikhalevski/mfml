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
import {matchSelect} from './matchSelect';
import {createPluralMatcher} from './createPluralMatcher';
import {IFormatterRegistry} from './createFormatterRegistry';

export interface IRuntimeOptions<Result> {
  renderFragment: FragmentRenderer<Result | string>;
  renderElement: ElementRenderer<Result | string>;
  renderArgument: ArgumentRenderer<Result | string>;

  /**
   * If omitted then {@link renderArgument} is used.
   */
  renderFunction?: FunctionRenderer<Result | string>;

  /**
   * If provided then formatters would be called for functions and arguments before falling back to
   * {@link renderFunction} and {@link renderArgument}.
   */
  formatterRegistry?: IFormatterRegistry<Result | string>;

  /**
   * By default, uses [`locale-matcher`](https://github.com/smikhalevski/locale-matcher) to match locales.
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

export function createRuntime<Result>(options: IRuntimeOptions<Result>): IRuntime<Result> {

  const {formatterRegistry, renderArgument, renderFunction} = options;

  const renderFormattedArgument: ArgumentRenderer<Result | string> | undefined = formatterRegistry && ((locale, value) => {
    const result = formatterRegistry.format(locale, value);
    if (result !== undefined) {
      return result;
    }
    return renderArgument(locale, value);
  });

  const renderFormattedFunction: FunctionRenderer<Result | string> | undefined = formatterRegistry && ((locale, value, name, options) => {
    const result = formatterRegistry.format(locale, value, name, options);
    if (result !== undefined) {
      return result;
    }
    if (renderFunction) {
      return renderFunction(locale, value, name, options);
    }
    return renderArgument(locale, value);
  });

  return {
    [RuntimeMethod.FRAGMENT]: options.renderFragment,
    [RuntimeMethod.ELEMENT]: options.renderElement,
    [RuntimeMethod.ARGUMENT]: renderFormattedArgument || renderArgument,
    [RuntimeMethod.FUNCTION]: renderFormattedFunction || renderFunction || renderArgument,
    [RuntimeMethod.LOCALE]: options.matchLocale || matchLocale,
    [RuntimeMethod.SELECT]: options.matchSelect || matchSelect,
    [RuntimeMethod.PLURAL]: options.matchPlural || createPluralMatcher('cardinal'),
    [RuntimeMethod.SELECT_ORDINAL]: options.matchSelectOrdinal || createPluralMatcher('ordinal'),
  };
}
