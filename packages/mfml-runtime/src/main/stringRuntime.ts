import {createIntlRuntime} from './createIntlRuntime';

export const stringRuntime = createIntlRuntime({
  renderFragment() {
    let str = '';
    for (let i = 0; i < arguments.length; ++i) {
      str += arguments[i];
    }
    return str;
  },
  renderElement() {
    let str = '';
    for (let i = 2; i < arguments.length; ++i) {
      str += arguments[i];
    }
    return str;
  },
  renderArgument(locale, value) {
    return '' + value;
  },
});
