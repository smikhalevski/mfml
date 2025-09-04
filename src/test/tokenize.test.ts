import { expect, test, vi } from 'vitest';
import { tokenize } from '../main/tokenize.js';
import { parseConfig } from '../main/parseConfig.js';

test('', () => {
  const callbackMock = vi.fn();

  tokenize('<p>aaa<p>bbb', callbackMock, parseConfig({ autoClosingTags: { p: ['p'] } }));

  expect(callbackMock).toHaveBeenCalledTimes(7);
  expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 2);
  expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 2, 3);
  expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 3, 6);
  expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_CLOSING_TAG', 6, 6);
  expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_START', 7, 8);
  expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 8, 9);
  expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 9, 12);
});
