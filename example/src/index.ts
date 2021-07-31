import {Landing, Login} from '../gen';
import {createMessageRuntime} from 'mfml-runtime';

const runtime = createMessageRuntime<string>({
  renderFragment: (...children) => children.join(''),
  renderElement: (tagName, attributes, ...children) => children.join(''),
  renderFunction: (name, value) => String(value),
  renderArgument: (value) => String(value),
});

const ctaStr = Landing.cta(runtime, 'en_GB');
