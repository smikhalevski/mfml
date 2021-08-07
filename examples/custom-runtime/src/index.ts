import {createRuntime} from 'mfml-runtime';
import * as Messages from './gen/messages';

// If strings are enough for you, refer to a string runtime factory:
// const runtime = createStringRuntime();

// For this example we would use a custom runtime that renders DOM nodes.
const runtime = createRuntime<Element | DocumentFragment | string>({

  renderFragment(...children) {
    const fragment = document.createDocumentFragment();
    fragment.append(...children);
    return fragment;
  },

  renderElement(tagName, attributes, ...children) {
    const element = document.createElement(tagName);

    if (attributes != null) {
      for (const [name, value] of Object.entries(attributes)) {
        if (typeof value === 'string') {
          element.setAttribute(name, value);
        }
      }
    }

    element.append(...children);

    return element;
  },

  renderArgument: (locale, value) => String(value),

  renderAttributeFragment: (...children) => children.join(''),
});

// Render a message
document.body.append(Messages.hello(runtime, 'en-US', {name: 'Karen'}));
