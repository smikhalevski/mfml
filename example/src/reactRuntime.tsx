import {createElement, lazy, Suspense} from 'react';
import {createReactRuntime} from 'mfml-react-runtime';
import dayjs from 'dayjs';

// Split `RedButton` to a separate chunk.
const LazyRedButton = lazy(() => import('./RedButton'));

// This is the custom runtime that overrides how elements and formatting functions are rendered.
// Have a look at `./src/translations/en-US.json` to see how custom `<red-button>` tag is used.
export const reactRuntime = createReactRuntime({

  renderElement(tagName, attributes, ...children) {

    // Render a custom element
    if (tagName === 'red-button') {
      return (
          <Suspense fallback={'Loading…'}>
            <LazyRedButton>
              {children}
            </LazyRedButton>
          </Suspense>
      );
    }
    return createElement(tagName, attributes, ...children);
  },

  // You can plug in any custom formatter using this callback. By default, there are no formatters.
  // Have a look at `provideFunctionType` in `../mfml.config.js` to see how you can validate function parameter types
  // at compile time.
  renderFunction(locale, value, functionName, functionParam) {
    if (
        (value instanceof Date || typeof value === 'number')
        && functionName === 'date'
        && typeof functionParam === 'string'
    ) {
      return dayjs(value).format(functionParam);
    }
    return String(value);
  },
});
