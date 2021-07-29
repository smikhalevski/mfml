import {createRuntime} from './createRuntime';

export const stringRuntime = createRuntime({
  element: (tagName, attributes, children) => children.join(''),
  fragment: (...children) => children.join(''),
  argument: (value) => String(value),
  function: (name, value) => String(value),
});
