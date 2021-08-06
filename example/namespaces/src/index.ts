import {Landing, Login} from '../gen';
import {createRuntime} from 'mfml-runtime';

const runtime = createRuntime<string>({
  renderFragment: (...children) => children.join(''),
  renderElement: (tagName, attributes, ...children) => children.join(''),
  renderFunction: (name, value) => String(value),
  renderArgument: (value) => String(value),
});

const ctaStr = Landing.cta(runtime, 'en_GB');
