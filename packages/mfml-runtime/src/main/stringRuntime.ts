import {createRuntime} from './createRuntime';

export const stringRuntime = createRuntime({
  renderFragment() {
    let str = '';
    for (let i = 0; i < arguments.length; ++i) {
      str += arguments[i];
    }
    return str;
  },
  renderElement(tagName, attributes) {
    let str = '';
    for (let i = 2; i < arguments.length; ++i) {
      str += arguments[i];
    }
    return str;
  },
  renderFunction: (name, value) => String(value),
  renderArgument: (value) => String(value),
});
