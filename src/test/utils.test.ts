import { expect, test } from 'vitest';

import { getNumberFormat } from '../main/utils.js';

test('returns the cached format', () => {
  const options = {};

  expect(getNumberFormat('en', options)).toBe(getNumberFormat('en', options));
  expect(getNumberFormat('en', options)).not.toBe(getNumberFormat('ru', options));
  expect(getNumberFormat('en', options)).not.toBe(getNumberFormat('en', {}));
});
