import {SelectMatcher} from './runtime-types';

/**
 * The select matcher that compares `value` to select case keys via strict equal.
 */
export const selectMatcher: SelectMatcher = function (value) {
  for (let i = 1; i < arguments.length; ++i) {
    if (arguments[i] == value) {
      return i - 1;
    }
  }
  return -1;
};
