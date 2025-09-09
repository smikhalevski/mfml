import { beforeEach, describe, expect, test, vi } from 'vitest';
import { readTokens, tokenizeMarkup } from '../main/tokenizeMarkup.js';
import { parseConfig } from '../main/parseConfig.js';

const callbackMock = vi.fn();

beforeEach(() => {
  callbackMock.mockReset();
});

describe('readTokens', () => {
  test('reads empty string', () => {
    readTokens('', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(0);
  });

  test('reads text', () => {
    readTokens('aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
  });

  test('reads the leading lt as text', () => {
    readTokens('>aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 5);
  });

  test('treats gt followed by non tag name character as text', () => {
    readTokens('aaa<+ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 8);
  });

  test('reads the opening tag that starts with the weird char as a text', () => {
    readTokens('<@#$%*>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('reads the opening tag that starts with the weird char as a text', () => {
    readTokens('<xxx@#$%*>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 9, 10);
  });

  test('ignores bullshit in closing tags', () => {
    readTokens('</xxx @#$%*/>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_CLOSING_TAG', 2, 5);
  });

  test('reads the opening tag in double brackets', () => {
    readTokens('<<xxx>>aaa</xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 1);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_START', 2, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 6, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 12, 15);
  });

  test('reads empty tag names as text', () => {
    readTokens('< ></ >', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('reads non-alpha tag names as text', () => {
    readTokens('<111></111>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 11);
  });

  test('reads the malformed closing tag as a text', () => {
    readTokens('</ xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('reads unterminated opening tags', () => {
    readTokens('<aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
  });

  test('reads unterminated attributes', () => {
    readTokens('<aaa xxx="zzz', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 13);
  });

  test('reads unterminated closing tags', () => {
    readTokens('</aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_CLOSING_TAG', 2, 5);
  });

  test('reads opening and closing tags', () => {
    readTokens('aaa<xxx>bbb</xxx>ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
  });

  test('ignores comments', () => {
    readTokens('aaa<xxx>bbb<!--</xxx>ccc--></xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 21, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG', 29, 32);
  });

  test('does not reads emojis as tag names', () => {
    readTokens('aaa<❤️>bbb</👨‍❤️‍💋‍👨>ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 27);
  });

  test('reads lt as an attribute name', () => {
    readTokens('<aaa <></aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 6, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 6, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 9, 12);
  });

  test('ignores redundant spaces before opening tag end', () => {
    readTokens('aaa<xxx   >bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 11, 14);
  });

  test('ignores redundant spaces before closing tag end', () => {
    readTokens('aaa</xxx   >bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_CLOSING_TAG', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 12, 15);
  });

  test('reads nested tags', () => {
    readTokens('aaa<yyy>bbb<xxx>ccc</xxx>ddd</yyy>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(10);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_START', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_CLOSING_TAG', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 25, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_CLOSING_TAG', 30, 33);
  });

  test('reads single-quoted attributes', () => {
    readTokens("<xxx yyy='aaa\"bbb' zzz='aaa\"bbb'>", callbackMock, {});

    // expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_START', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 24, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_ATTRIBUTE_END', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_OPENING_TAG_END', 32, 33);
  });

  test('reads double-quoted attributes', () => {
    readTokens('<xxx yyy="aaa\'bbb" zzz="aaa\'bbb">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_START', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 24, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_ATTRIBUTE_END', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_OPENING_TAG_END', 32, 33);
  });

  test('reads unquoted attributes', () => {
    readTokens('<xxx yyy=aaa"bbb\'ccc>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 20, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 20, 21);
  });

  test('reads valueless attributes', () => {
    readTokens('<xxx aaa bbb>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 9, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 12, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 12, 13);
  });

  test('reads valueless unquoted attributes', () => {
    readTokens('<xxx aaa= bbb=>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 14, 15);
  });

  test('reads entities in attributes', () => {
    readTokens('<xxx aaa=&amp; bbb="&amp;" ccc=\'&amp;\' ddd=>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(13);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_START', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 20, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_ATTRIBUTE_END', 25, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_ATTRIBUTE_START', 27, 30);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 32, 37);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_ATTRIBUTE_END', 37, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'XML_ATTRIBUTE_START', 39, 42);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'XML_ATTRIBUTE_END', 43, 43);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'XML_OPENING_TAG_END', 43, 44);
  });

  test('ignores leading slash in an attribute name', () => {
    readTokens('<aaa /xxx></xxx aaa>bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 9, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 20, 23);
  });

  test('reads bullshit attribute names', () => {
    readTokens("<xxx < = '' fff>vvv</xxx>", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_START', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 15, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_CLOSING_TAG', 21, 24);
  });

  test('reads attributes with unbalanced end quotes', () => {
    readTokens('<xxx yyy="aaa"bbb">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 13, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_START', 14, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_ATTRIBUTE_END', 18, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_OPENING_TAG_END', 18, 19);
  });

  test('does not read self-closing tags by default', () => {
    readTokens('<xxx/>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 5, 6);
  });

  test('reads self-closing tag', () => {
    readTokens('<xxx/>', callbackMock, { isSelfClosingTagsRecognized: true });

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_SELF_CLOSE', 4, 6);
  });

  test('does not read self-closing tag with the unquoted attribute that ends with a slash', () => {
    readTokens('<xxx aaa=bbb//>', callbackMock, { isSelfClosingTagsRecognized: true });

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 12, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_SELF_CLOSE', 13, 15);
  });

  test('ignores redundant spaces in attributes', () => {
    readTokens('aaa<yyy xxx   =   "zzz">bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_START', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 22, 23);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 23, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 24, 27);
  });

  test('does not read tags in double-quoted attribute', () => {
    readTokens('<aaa xxx="bbb<zzz>ccc</zzz>">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 28, 29);
  });

  test('does not read tags in single-quoted attribute', () => {
    readTokens("<aaa xxx='bbb<zzz>ccc</zzz>'>", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 28, 29);
  });

  test('does not read tags in unquoted attribute', () => {
    readTokens('<aaa xxx=bbb<zzz>ccc</zzz>>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 16, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG', 22, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'TEXT', 26, 27);
  });

  test('escapes inside a unquoted attribute', () => {
    readTokens('<aaa xxx=zzz\\{yyy></aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 17, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 20, 23);
  });

  test('does not escape char in a tag name', () => {
    readTokens('<a\\aa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 5, 6);
  });

  test('does not escape char in an attribute name', () => {
    readTokens('<aaa b\\bb>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 9, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
  });

  test('reads an ICU argument', () => {
    readTokens('{aaa}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_END', 4, 5);
  });

  test('reads an ICU argument inside a tag', () => {
    readTokens('<xxx>{aaa}</xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 12, 15);
  });

  test('reads an ICU argument inside a double-quoted attribute', () => {
    readTokens('<xxx aaa="{bbb}"></xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_START', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG', 19, 22);
  });

  test('reads an ICU argument inside a single-quoted attribute', () => {
    readTokens("<xxx aaa='{bbb}'></xxx>", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_START', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG', 19, 22);
  });

  test('ignores an ICU argument inside an unquoted attribute', () => {
    readTokens('<xxx aaa={bbb}></xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 17, 20);
  });

  test('reads an ICU argument with name surrounded by spaces', () => {
    readTokens('{   aaa   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_END', 10, 11);
  });

  test('reads an ICU argument and its type', () => {
    readTokens('{aaa  ,  bbb   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_END', 15, 16);
  });

  test('reads an ICU argument with type and style', () => {
    readTokens('{aaa  ,  bbb   ,   ccc   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_STYLE', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 25, 26);
  });

  test('reads an ICU argument with type and select', () => {
    readTokens('{aaa,bbb,ccc   {   ddd   }   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 16, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_CATEGORY_END', 25, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ICU_ARGUMENT_END', 29, 30);
  });

  test('reads tags in an ICU argument with type and select', () => {
    readTokens('{aaa,bbb,ccc{<xxx>ddd</xxx>}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_START', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG', 23, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_CATEGORY_END', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'ICU_ARGUMENT_END', 28, 29);
  });

  test('reads an ICU octothorpe as text outside of select', () => {
    readTokens('aaa # bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 9);
  });

  test('reads an ICU octothorpe in a select', () => {
    readTokens('{aaa,bbb,ccc{ddd#eee}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OCTOTHORPE', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_CATEGORY_END', 20, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_ARGUMENT_END', 21, 22);
  });

  test('reads an ICU octothorpe in a select with spaces', () => {
    readTokens('{   xxx   ,   yyy   ,   zzz   {   #   }   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_START', 24, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 31, 34);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OCTOTHORPE', 34, 35);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 35, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_CATEGORY_END', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_ARGUMENT_END', 42, 43);
  });

  test('reads an ICU octothorpe in a nested select', () => {
    readTokens('{aaa,bbb,ccc{{aaa,bbb,ccc{<zzz>#</zzz>}}}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(14);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_START', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_ARGUMENT_TYPE', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ICU_CATEGORY_START', 22, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_OPENING_TAG_START', 27, 30);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_OPENING_TAG_END', 30, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'ICU_OCTOTHORPE', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_CLOSING_TAG', 34, 37);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'ICU_CATEGORY_END', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'ICU_ARGUMENT_END', 39, 40);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'ICU_CATEGORY_END', 40, 41);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'ICU_ARGUMENT_END', 41, 42);
  });
});

describe('tokenizeMarkup', () => {
  test('reads the balanced start tag', () => {
    tokenizeMarkup('<aaa>bbb</aaa>', callbackMock);

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_CLOSING_TAG', 10, 13);
  });

  test('reads the unbalanced start tag', () => {
    tokenizeMarkup('<aaa><bbb>ccc', callbackMock, { isUnbalancedTagsImplicitlyClosed: true });

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'TEXT', 10, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 13, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG', 13, 13);
  });

  test('implicitly closes the immediate parent', () => {
    tokenizeMarkup(
      '<aaa>bbb<ccc>ddd',
      callbackMock,
      parseConfig({ isUnbalancedTagsImplicitlyClosed: true, implicitlyClosedTags: { ccc: ['aaa'] } })
    );

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_CLOSING_TAG', 8, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_CLOSING_TAG', 16, 16);
  });

  test('implicitly closes the ancestor', () => {
    tokenizeMarkup(
      '<aaa>bbb<ccc>ddd<eee>',
      callbackMock,
      parseConfig({ isUnbalancedTagsImplicitlyClosed: true, implicitlyClosedTags: { eee: ['aaa'] } })
    );

    expect(callbackMock).toHaveBeenCalledTimes(11);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG', 16, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_CLOSING_TAG', 16, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'XML_OPENING_TAG_START', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_OPENING_TAG_END', 20, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'XML_CLOSING_TAG', 21, 21);
  });

  test('implicitly closes the topmost ancestor', () => {
    tokenizeMarkup(
      '<aaa>bbb<ccc>ddd<eee>fff<ggg>',
      callbackMock,
      parseConfig({ isUnbalancedTagsImplicitlyClosed: true, implicitlyClosedTags: { ggg: ['aaa', 'eee'] } })
    );

    expect(callbackMock).toHaveBeenCalledTimes(15);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_OPENING_TAG_START', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_OPENING_TAG_END', 20, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_CLOSING_TAG', 24, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'XML_CLOSING_TAG', 24, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'XML_CLOSING_TAG', 24, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'XML_OPENING_TAG_START', 25, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'XML_OPENING_TAG_END', 28, 29);
    expect(callbackMock).toHaveBeenNthCalledWith(15, 'XML_CLOSING_TAG', 29, 29);
  });

  test('reads the void tag', () => {
    tokenizeMarkup('<aaa>bbb', callbackMock, parseConfig({ voidTags: ['aaa'] }));

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 5, 8);
  });

  test('reads consequent void tags', () => {
    tokenizeMarkup('<aaa><bbb>', callbackMock, parseConfig({ voidTags: ['aaa', 'bbb'] }));

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 10, 10);
  });

  test('reads the void tag in the container', () => {
    tokenizeMarkup('<aaa><bbb></aaa>', callbackMock, parseConfig({ voidTags: ['bbb'] }));

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 10, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 12, 15);
  });

  test('implicitly closes a tag', () => {
    tokenizeMarkup('<aaa><bbb></aaa>', callbackMock, parseConfig({ isUnbalancedTagsImplicitlyClosed: true }));

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 10, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 12, 15);
  });

  test('ignores an orphan closing tag', () => {
    tokenizeMarkup('</aaa>', callbackMock, parseConfig({ isOrphanClosingTagsIgnored: true }));

    expect(callbackMock).toHaveBeenCalledTimes(0);
  });

  test('ignores an orphan closing tag in a container', () => {
    tokenizeMarkup('<aaa></bbb></aaa>', callbackMock, parseConfig({ isOrphanClosingTagsIgnored: true }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 13, 16);
  });

  test('inserts opening tags for orphan closing tags', () => {
    tokenizeMarkup('</aaa>', callbackMock, parseConfig({ implicitlyOpenedTags: ['aaa'] }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 0, 0);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 0, 0);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 2, 5);
  });

  test('inserts opening tag that forcefully closes preceding tag', () => {
    tokenizeMarkup(
      '<aaa></bbb>',
      callbackMock,
      parseConfig({ implicitlyClosedTags: { bbb: ['aaa'] }, implicitlyOpenedTags: ['bbb'] })
    );

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_START', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 7, 10);
  });

  test('inserts opening tags and closing tags during nesting of the same tag', () => {
    tokenizeMarkup(
      'aaa<xxx>bbb<xxx>ccc</xxx>ddd</xxx>eee',
      callbackMock,
      parseConfig({ implicitlyClosedTags: { xxx: ['xxx'] }, implicitlyOpenedTags: ['xxx'] })
    );

    expect(callbackMock).toHaveBeenCalledTimes(14);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 11, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_START', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_OPENING_TAG_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'XML_CLOSING_TAG', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'TEXT', 25, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'XML_OPENING_TAG_START', 28, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'XML_OPENING_TAG_END', 28, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'XML_CLOSING_TAG', 30, 33);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'TEXT', 34, 37);
  });

  test('reads case-sensitive closing tags by default', () => {
    tokenizeMarkup('<aaa></AAA>', callbackMock, {
      isUnbalancedTagsImplicitlyClosed: true,
      isOrphanClosingTagsIgnored: true,
    });

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 11, 11);
  });

  test('reads case-insensitive closing tags', () => {
    tokenizeMarkup('<aaa></AAA>', callbackMock, parseConfig({ isCaseInsensitiveTags: true }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 7, 10);
  });

  test('read non ASCII alpha-chars as case-sensitive in case-insensitive tag matching mode', () => {
    tokenizeMarkup(
      '<aaaффф></AAAФФФ>',
      callbackMock,
      parseConfig({
        isCaseInsensitiveTags: true,
        isUnbalancedTagsImplicitlyClosed: true,
        isOrphanClosingTagsIgnored: true,
      })
    );

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 17, 17);
  });

  test('closes unbalanced tags', () => {
    tokenizeMarkup(
      '<a><b></a></b>',
      callbackMock,
      parseConfig({ isUnbalancedTagsImplicitlyClosed: true, isOrphanClosingTagsIgnored: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 2);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 2, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_START', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 6, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 8, 9);
  });

  test('reads ICU select with octothorpe', () => {
    tokenizeMarkup('{   xxx   ,   yyy   ,   zzz   {   #   }   }', callbackMock);

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_START', 24, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 31, 34);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OCTOTHORPE', 34, 35);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 35, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_CATEGORY_END', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_ARGUMENT_END', 42, 43);
  });

  test('throws if opening tag is not ended before EOF', () => {
    expect(() => tokenizeMarkup('<aaa xxx="bbb"', callbackMock)).toThrow(new SyntaxError('Missing closing tag at 14'));
  });

  test('throws if argument is not ended before EOF', () => {
    expect(() => tokenizeMarkup('<aaa>{xxx', callbackMock)).toThrow(new SyntaxError('Unexpected ICU syntax at 9'));
  });
});
