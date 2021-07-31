import {createMessageRuntime} from './createMessageRuntime';

export const stringRuntime = createMessageRuntime({
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
});
