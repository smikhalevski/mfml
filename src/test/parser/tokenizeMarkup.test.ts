import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ParserError, readTokens, tokenizeMessage } from '../../main/parser/tokenizeMessage.js';
import { resolveTokenizerOptions } from '../../main/parser/createTokenizer.js';

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
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 9, 10);
  });

  test('ignores bullshit in closing tags', () => {
    readTokens('</xxx @#$%*/>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_CLOSING_TAG_NAME', 2, 5);
  });

  test('reads the opening tag in double brackets', () => {
    readTokens('<<xxx>>aaa</xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 1);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_NAME', 2, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 6, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 12, 15);
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
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
  });

  test('reads unterminated attributes', () => {
    readTokens('<aaa xxx="zzz', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 13);
  });

  test('reads unterminated closing tags', () => {
    readTokens('</aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_CLOSING_TAG_NAME', 2, 5);
  });

  test('reads opening and closing tags', () => {
    readTokens('aaa<xxx>bbb</xxx>ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
  });

  test('ignores comments', () => {
    readTokens('aaa<xxx>bbb<!--</xxx>ccc--></xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 29, 32);
  });

  test('ignores empty comments', () => {
    readTokens('aaa<!---->bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'TEXT', 10, 13);
  });

  test('ignores DTD', () => {
    readTokens('aaa<xxx>bbb<!</xxx>ccc--></xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'TEXT', 19, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG_NAME', 27, 30);
  });

  test('ignores empty DTD', () => {
    readTokens('aaa<!>bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'TEXT', 6, 9);
  });

  test('ignores empty DTD', () => {
    readTokens('aaa<!>bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'TEXT', 6, 9);
  });

  test('ignores processing instructions', () => {
    readTokens('aaa<?xml version="1.0"?>bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'TEXT', 24, 27);
  });

  test('ignores empty processing instructions', () => {
    readTokens('aaa<?>bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'TEXT', 6, 9);
  });

  test('does not reads emojis as tag names', () => {
    readTokens('aaa<❤️>bbb</👨‍❤️‍💋‍👨>ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 27);
  });

  test('reads lt as an attribute name', () => {
    readTokens('<aaa <></aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 6, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 6, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 9, 12);
  });

  test('ignores redundant spaces before opening tag end', () => {
    readTokens('aaa<xxx   >bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 11, 14);
  });

  test('ignores redundant spaces before closing tag end', () => {
    readTokens('aaa</xxx   >bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_CLOSING_TAG_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 12, 15);
  });

  test('reads nested tags', () => {
    readTokens('aaa<yyy>bbb<xxx>ccc</xxx>ddd</yyy>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(10);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_NAME', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_CLOSING_TAG_NAME', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 25, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_CLOSING_TAG_NAME', 30, 33);
  });

  test('reads single-quoted attributes', () => {
    readTokens("<xxx yyy='aaa\"bbb' zzz='aaa\"bbb'>", callbackMock, {});

    // expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_NAME', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 24, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_ATTRIBUTE_END', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_OPENING_TAG_END', 32, 33);
  });

  test('reads double-quoted attributes', () => {
    readTokens('<xxx yyy="aaa\'bbb" zzz="aaa\'bbb">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_NAME', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 24, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_ATTRIBUTE_END', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_OPENING_TAG_END', 32, 33);
  });

  test('reads unquoted attributes', () => {
    readTokens('<xxx yyy=aaa"bbb\'ccc>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 20, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 20, 21);
  });

  test('reads valueless attributes', () => {
    readTokens('<xxx aaa bbb>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 9, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 12, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 12, 13);
  });

  test('reads valueless unquoted attributes', () => {
    readTokens('<xxx aaa= bbb=>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 14, 15);
  });

  test('reads entities in attributes', () => {
    readTokens('<xxx aaa=&amp; bbb="&amp;" ccc=\'&amp;\' ddd=>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(13);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_NAME', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 20, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_ATTRIBUTE_END', 25, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_ATTRIBUTE_NAME', 27, 30);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 32, 37);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_ATTRIBUTE_END', 37, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'XML_ATTRIBUTE_NAME', 39, 42);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'XML_ATTRIBUTE_END', 43, 43);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'XML_OPENING_TAG_END', 43, 44);
  });

  test('ignores leading slash in an attribute name', () => {
    readTokens('<aaa /xxx></xxx aaa>bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 9, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 20, 23);
  });

  test('reads bullshit attribute names', () => {
    readTokens("<xxx < = '' fff>vvv</xxx>", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_NAME', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 15, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_CLOSING_TAG_NAME', 21, 24);
  });

  test('reads attributes with unbalanced end quotes', () => {
    readTokens('<xxx yyy="aaa"bbb">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 13, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_NAME', 14, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_ATTRIBUTE_END', 18, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_OPENING_TAG_END', 18, 19);
  });

  test('does not read self-closing tags by default', () => {
    readTokens('<xxx/>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 5, 6);
  });

  test('reads self-closing tag', () => {
    readTokens('<xxx/>', callbackMock, { isSelfClosingTagsRecognized: true });

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_SELF_CLOSE', 4, 6);
  });

  test('does not read self-closing tag with the unquoted attribute that ends with a slash', () => {
    readTokens('<xxx aaa=bbb//>', callbackMock, { isSelfClosingTagsRecognized: true });

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 12, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_SELF_CLOSE', 13, 15);
  });

  test('ignores redundant spaces in attributes', () => {
    readTokens('aaa<yyy xxx   =   "zzz">bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_NAME', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 22, 23);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 23, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 24, 27);
  });

  test('does not read tags in double-quoted attribute', () => {
    readTokens('<aaa xxx="bbb<zzz>ccc</zzz>">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 28, 29);
  });

  test('does not read tags in single-quoted attribute', () => {
    readTokens("<aaa xxx='bbb<zzz>ccc</zzz>'>", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 28, 29);
  });

  test('does not read tags in unquoted attribute', () => {
    readTokens('<aaa xxx=bbb<zzz>ccc</zzz>>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 16, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG_NAME', 22, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'TEXT', 26, 27);
  });

  test('ignores tags in raw text tags', () => {
    readTokens('<script><aaa>bbb</aaa></script>', callbackMock, resolveTokenizerOptions({ rawTextTags: ['script'] }));

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 8, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_CLOSING_TAG_NAME', 24, 30);
  });

  test('reads attributes of a raw text tag', () => {
    readTokens(
      '<script aaa="xxx" ccc="yyy">zzz</script>',
      callbackMock,
      resolveTokenizerOptions({ rawTextTags: ['script'] })
    );

    expect(callbackMock).toHaveBeenCalledTimes(10);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_NAME', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 23, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_ATTRIBUTE_END', 26, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_OPENING_TAG_END', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 28, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_CLOSING_TAG_NAME', 33, 39);
  });

  test('ignores comments in raw text tags', () => {
    readTokens('<script><!-->bbb</--></script>', callbackMock, resolveTokenizerOptions({ rawTextTags: ['script'] }));

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 8, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_CLOSING_TAG_NAME', 23, 29);
  });

  test('matches case-insensitive closing raw text tags', () => {
    readTokens(
      '<script><!-->bbb</--></SCRIPT>',
      callbackMock,
      resolveTokenizerOptions({ rawTextTags: ['script'], isCaseInsensitiveTags: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 8, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_CLOSING_TAG_NAME', 23, 29);
  });

  test('does not read ICU markup in raw text tag content by default', () => {
    readTokens('<script>{aaa}</script>', callbackMock, resolveTokenizerOptions({ rawTextTags: ['script'] }));

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 8, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_CLOSING_TAG_NAME', 15, 21);
  });

  test('reads ICU markup in raw text tag content', () => {
    readTokens(
      '<script>{aaa}</script>',
      callbackMock,
      resolveTokenizerOptions({ rawTextTags: ['script'], isRawTextInterpolated: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 15, 21);
  });

  test('reads an ICU argument in a raw text tag attribute', () => {
    readTokens(
      '<script aaa="{bbb}">{ccc}</script>',
      callbackMock,
      resolveTokenizerOptions({ rawTextTags: ['script'], isRawTextInterpolated: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 18, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 19, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_ARGUMENT_NAME', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_ARGUMENT_END', 24, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'XML_CLOSING_TAG_NAME', 27, 33);
  });

  test('reads an ICU select in a raw text tag attribute', () => {
    readTokens(
      '<script aaa="{bbb,xxx,yyy{zzz}ppp{<vvv>qqq</vvv>}}"></script>',
      callbackMock,
      resolveTokenizerOptions({ rawTextTags: ['script'] })
    );

    expect(callbackMock).toHaveBeenCalledTimes(14);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_TYPE', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_CATEGORY_NAME', 22, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 26, 29);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_CATEGORY_END', 29, 30);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_CATEGORY_NAME', 30, 33);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 34, 48);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'ICU_CATEGORY_END', 48, 49);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'XML_ATTRIBUTE_END', 50, 51);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'XML_OPENING_TAG_END', 51, 52);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'XML_CLOSING_TAG_NAME', 54, 60);
  });

  test('reads an ICU argument', () => {
    readTokens('{aaa}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_END', 4, 5);
  });

  test('reads an ICU argument inside a tag', () => {
    readTokens('<xxx>{aaa}</xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 12, 15);
  });

  test('reads an ICU argument inside a double-quoted attribute', () => {
    readTokens('<xxx aaa="{bbb}"></xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG_NAME', 19, 22);
  });

  test('reads an ICU argument inside a single-quoted attribute', () => {
    readTokens("<xxx aaa='{bbb}'></xxx>", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG_NAME', 19, 22);
  });

  test('ignores an ICU argument inside an unquoted attribute', () => {
    readTokens('<xxx aaa={bbb}></xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG_NAME', 17, 20);
  });

  test('reads an ICU argument with name surrounded by spaces', () => {
    readTokens('{   aaa   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_END', 10, 11);
  });

  test('reads an ICU argument and its type', () => {
    readTokens('{aaa  ,  bbb   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_END', 15, 16);
  });

  test('reads an ICU argument with type and style', () => {
    readTokens('{aaa  ,  bbb   ,   ccc   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_STYLE', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 25, 26);
  });

  test('reads an ICU argument with type and select', () => {
    readTokens('{aaa,bbb,ccc   {   ddd   }   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 16, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_CATEGORY_END', 25, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ICU_ARGUMENT_END', 29, 30);
  });

  test('reads tags in an ICU argument with type and select', () => {
    readTokens('{aaa,bbb,ccc{<xxx>ddd</xxx>}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_NAME', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG_NAME', 23, 26);
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
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OCTOTHORPE', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_CATEGORY_END', 20, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_ARGUMENT_END', 21, 22);
  });

  test('reads an ICU octothorpe in a select with spaces', () => {
    readTokens('{   xxx   ,   yyy   ,   zzz   {   #   }   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_NAME', 24, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 31, 34);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OCTOTHORPE', 34, 35);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 35, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_CATEGORY_END', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_ARGUMENT_END', 42, 43);
  });

  test('reads an ICU octothorpe in a nested select', () => {
    readTokens('{aaa,bbb,ccc{{aaa,bbb,ccc{<zzz>#</zzz>}}}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(14);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_NAME', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_ARGUMENT_TYPE', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ICU_CATEGORY_NAME', 22, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_OPENING_TAG_NAME', 27, 30);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_OPENING_TAG_END', 30, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'ICU_OCTOTHORPE', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_CLOSING_TAG_NAME', 34, 37);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'ICU_CATEGORY_END', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'ICU_ARGUMENT_END', 39, 40);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'ICU_CATEGORY_END', 40, 41);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'ICU_ARGUMENT_END', 41, 42);
  });

  test('does not read an ICU octothorpe after select has ended', () => {
    readTokens('{aaa,bbb,ccc{#}}#', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_OCTOTHORPE', 13, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_CATEGORY_END', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ICU_ARGUMENT_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 16, 17);
  });

  test('does not read tags in an ICU select in an XML attribute', () => {
    readTokens('<aaa xxx="{zzz,yyy,fff{<bbb>bbb</bbb>}}"></aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(11);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_TYPE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_CATEGORY_NAME', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 23, 37);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_CATEGORY_END', 37, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_ARGUMENT_END', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'XML_ATTRIBUTE_END', 39, 40);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_OPENING_TAG_END', 40, 41);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'XML_CLOSING_TAG_NAME', 43, 46);
  });

  test('ignores trailing comma if an argument type is empty', () => {
    readTokens('{xxx , }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_END', 7, 8);
  });

  test('throws if argument type is empty', () => {
    expect(() => readTokens('{xxx,,}', callbackMock, {})).toThrow(
      new ParserError('An ICU argument type cannot be empty.', '{xxx,,}', 5)
    );

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
  });

  test('ignores trailing comma if an argument style is empty', () => {
    readTokens('{xxx,yyy , }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_END', 11, 12);
  });

  test('throws if argument style is empty', () => {
    expect(() => readTokens('{xxx,yyy,,}', callbackMock, {})).toThrow(
      new ParserError('Expected an ICU argument style, category name or option name.', '{xxx,yyy,,}', 9)
    );

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
  });

  test('reads an unquoted ICU option value', () => {
    readTokens('{xxx,yyy , zzz = kkk }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_OPTION_VALUE', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_ARGUMENT_END', 21, 22);
  });

  test('reads an empty ICU option value', () => {
    readTokens('{xxx,yyy , zzz = }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_OPTION_VALUE', 17, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_ARGUMENT_END', 17, 18);
  });

  test('reads a double-quoted ICU option value', () => {
    readTokens('{xxx,yyy , zzz = "kkk\'{,}vvv" }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_OPTION_VALUE', 18, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_ARGUMENT_END', 30, 31);
  });

  test('reads a single-quoted ICU option value', () => {
    readTokens("{xxx,yyy , zzz = 'kkk\"{,}vvv' }", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_OPTION_VALUE', 18, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_ARGUMENT_END', 30, 31);
  });

  test('throws if a quoted option value is unterminated', () => {
    expect(() => readTokens('{xxx,yyy,zzz="  ', callbackMock, {})).toThrow(
      new ParserError('Unterminated ICU option value.', '{xxx,yyy,zzz="  ', 14, 16)
    );

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_OPTION_NAME', 9, 12);
  });

  test('reads multiple ICU options', () => {
    readTokens('{xxx,yyy , zzz = \'aaa\' vvv="bbb" ppp=qqq }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_OPTION_VALUE', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OPTION_NAME', 23, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ICU_OPTION_VALUE', 28, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_OPTION_NAME', 33, 36);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_OPTION_VALUE', 37, 40);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'ICU_ARGUMENT_END', 41, 42);
  });

  test('reads ICU options mixed with categories', () => {
    readTokens('{xxx,yyy , zzz=aaa kkk {ccc} vvv="bbb" }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(10);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_OPTION_VALUE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_CATEGORY_NAME', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 24, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_CATEGORY_END', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_OPTION_NAME', 29, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'ICU_OPTION_VALUE', 34, 37);
  });

  test('throws if a style and options are mixed', () => {
    expect(() => readTokens('{xxx,yyy,kkk zzz=vvv}', callbackMock, {})).toThrow(
      new ParserError(
        'Expected an ICU category start ("{") or an option value start ("=").',
        '{xxx,yyy,kkk zzz=vvv}',
        13
      )
    );

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
  });

  test('reads ICU options in an XML attribute', () => {
    expect(() => readTokens('<aaa bbb="{xxx,yyy,zzz=kkk"></aaa>', callbackMock, {})).toThrow(
      new ParserError('Unterminated ICU argument.', '<aaa bbb="{xxx,yyy,zzz=kkk"></aaa>', 26, 26)
    );

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_TYPE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OPTION_NAME', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ICU_OPTION_VALUE', 23, 26);
  });

  test('throws on non-terminated ICU argument in an XML attribute', () => {
    expect(() => readTokens('<aaa bbb="{xxx,"></aaa>', callbackMock, {})).toThrow(
      new ParserError('An ICU argument type cannot be empty.', '<aaa bbb="{xxx,"></aaa>', 15)
    );

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 11, 14);
  });

  test('throws on invalid double-quoted of ICU argument in a double-quoted XML attribute', () => {
    expect(() => readTokens('<aaa bbb="{xxx,yyy,zzz="kkk"}"></aaa>', callbackMock, {})).toThrow(
      new ParserError(
        'ICU option value must use different quotes than the enclosing XML attribute.',
        '<aaa bbb="{xxx,yyy,zzz="kkk"}"></aaa>',
        23
      )
    );

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_TYPE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OPTION_NAME', 19, 22);
  });

  test('throws on invalid single-quoted of ICU argument in a single-quoted XML attribute', () => {
    expect(() => readTokens("<aaa bbb='{xxx,yyy,zzz='kkk'}'></aaa>", callbackMock, {})).toThrow(
      new ParserError(
        'ICU option value must use different quotes than the enclosing XML attribute.',
        "<aaa bbb='{xxx,yyy,zzz='kkk'}'></aaa>",
        23
      )
    );

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_TYPE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OPTION_NAME', 19, 22);
  });

  test('throws on non-escaped quote in an ICU select inside an attribute', () => {
    expect(() => readTokens('<aaa xxx="{zzz,yyy,fff{"}}"></aaa>', callbackMock, {})).toThrow(
      new ParserError('Unterminated ICU argument.', '<aaa xxx="{zzz,yyy,fff{"}}"></aaa>', 23)
    );

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_TYPE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_CATEGORY_NAME', 19, 22);
  });
});

describe('tokenizeMessage', () => {
  test('reads the balanced start tag', () => {
    tokenizeMessage('<aaa>bbb</aaa>', callbackMock);

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_CLOSING_TAG_NAME', 10, 13);
  });

  test('reads the unbalanced start tag', () => {
    tokenizeMessage('<aaa><bbb>ccc', callbackMock, { isUnbalancedTagsImplicitlyClosed: true });

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'TEXT', 10, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG_NAME', 13, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG_NAME', 13, 13);
  });

  test('implicitly closes the immediate parent', () => {
    tokenizeMessage(
      '<aaa>bbb<ccc>ddd',
      callbackMock,
      resolveTokenizerOptions({ isUnbalancedTagsImplicitlyClosed: true, implicitlyClosedTags: { ccc: ['aaa'] } })
    );

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_CLOSING_TAG_NAME', 8, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_END', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_CLOSING_TAG_NAME', 16, 16);
  });

  test('implicitly closes the ancestor', () => {
    tokenizeMessage(
      '<aaa>bbb<ccc>ddd<eee>',
      callbackMock,
      resolveTokenizerOptions({ isUnbalancedTagsImplicitlyClosed: true, implicitlyClosedTags: { eee: ['aaa'] } })
    );

    expect(callbackMock).toHaveBeenCalledTimes(11);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG_NAME', 16, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_CLOSING_TAG_NAME', 16, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'XML_OPENING_TAG_NAME', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_OPENING_TAG_END', 20, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'XML_CLOSING_TAG_NAME', 21, 21);
  });

  test('implicitly closes the topmost ancestor', () => {
    tokenizeMessage(
      '<aaa>bbb<ccc>ddd<eee>fff<ggg>',
      callbackMock,
      resolveTokenizerOptions({
        isUnbalancedTagsImplicitlyClosed: true,
        implicitlyClosedTags: { ggg: ['aaa', 'eee'] },
      })
    );

    expect(callbackMock).toHaveBeenCalledTimes(15);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_OPENING_TAG_NAME', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_OPENING_TAG_END', 20, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_CLOSING_TAG_NAME', 24, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'XML_CLOSING_TAG_NAME', 24, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'XML_CLOSING_TAG_NAME', 24, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'XML_OPENING_TAG_NAME', 25, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'XML_OPENING_TAG_END', 28, 29);
    expect(callbackMock).toHaveBeenNthCalledWith(15, 'XML_CLOSING_TAG_NAME', 29, 29);
  });

  test('reads the void tag', () => {
    tokenizeMessage('<aaa>bbb', callbackMock, resolveTokenizerOptions({ voidTags: ['aaa'] }));

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG_NAME', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 5, 8);
  });

  test('reads consequent void tags', () => {
    tokenizeMessage('<aaa><bbb>', callbackMock, resolveTokenizerOptions({ voidTags: ['aaa', 'bbb'] }));

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG_NAME', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG_NAME', 10, 10);
  });

  test('reads the void tag in the container', () => {
    tokenizeMessage('<aaa><bbb></aaa>', callbackMock, resolveTokenizerOptions({ voidTags: ['bbb'] }));

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 10, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG_NAME', 12, 15);
  });

  test('implicitly closes a tag', () => {
    tokenizeMessage(
      '<aaa><bbb></aaa>',
      callbackMock,
      resolveTokenizerOptions({ isUnbalancedTagsImplicitlyClosed: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 10, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG_NAME', 12, 15);
  });

  test('ignores an orphan closing tag', () => {
    tokenizeMessage('</aaa>', callbackMock, resolveTokenizerOptions({ isOrphanClosingTagsIgnored: true }));

    expect(callbackMock).toHaveBeenCalledTimes(0);
  });

  test('ignores an orphan closing tag in a container', () => {
    tokenizeMessage('<aaa></bbb></aaa>', callbackMock, resolveTokenizerOptions({ isOrphanClosingTagsIgnored: true }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG_NAME', 13, 16);
  });

  test('inserts opening tags for orphan closing tags', () => {
    tokenizeMessage('</aaa>', callbackMock, resolveTokenizerOptions({ implicitlyOpenedTags: ['aaa'] }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 2, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG_NAME', 2, 5);
  });

  test('inserts opening tag that forcefully closes preceding tag', () => {
    tokenizeMessage(
      '<aaa></bbb>',
      callbackMock,
      resolveTokenizerOptions({ implicitlyClosedTags: { bbb: ['aaa'] }, implicitlyOpenedTags: ['bbb'] })
    );

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG_NAME', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_NAME', 7, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG_NAME', 7, 10);
  });

  test('inserts opening tags and closing tags during nesting of the same tag', () => {
    tokenizeMessage(
      'aaa<xxx>bbb<xxx>ccc</xxx>ddd</xxx>eee',
      callbackMock,
      resolveTokenizerOptions({ implicitlyClosedTags: { xxx: ['xxx'] }, implicitlyOpenedTags: ['xxx'] })
    );

    expect(callbackMock).toHaveBeenCalledTimes(14);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 11, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_OPENING_TAG_NAME', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_OPENING_TAG_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'XML_CLOSING_TAG_NAME', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'TEXT', 25, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'XML_OPENING_TAG_NAME', 30, 33);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'XML_OPENING_TAG_END', 33, 34);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'XML_CLOSING_TAG_NAME', 30, 33);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'TEXT', 34, 37);
  });

  test('reads case-sensitive closing tags by default', () => {
    tokenizeMessage('<aaa></AAA>', callbackMock, {
      isUnbalancedTagsImplicitlyClosed: true,
      isOrphanClosingTagsIgnored: true,
    });

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG_NAME', 11, 11);
  });

  test('reads case-insensitive closing tags', () => {
    tokenizeMessage('<aaa></AAA>', callbackMock, resolveTokenizerOptions({ isCaseInsensitiveTags: true }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG_NAME', 7, 10);
  });

  test('read non ASCII alpha-chars as case-sensitive in case-insensitive tag matching mode', () => {
    tokenizeMessage(
      '<aaaффф></AAAФФФ>',
      callbackMock,
      resolveTokenizerOptions({
        isCaseInsensitiveTags: true,
        isUnbalancedTagsImplicitlyClosed: true,
        isOrphanClosingTagsIgnored: true,
      })
    );

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG_NAME', 17, 17);
  });

  test('closes unbalanced tags', () => {
    tokenizeMessage(
      '<a><b></a></b>',
      callbackMock,
      resolveTokenizerOptions({ isUnbalancedTagsImplicitlyClosed: true, isOrphanClosingTagsIgnored: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_NAME', 1, 2);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 2, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_NAME', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG_NAME', 6, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG_NAME', 8, 9);
  });

  test('reads ICU select with octothorpe', () => {
    tokenizeMessage('{   xxx   ,   yyy   ,   zzz   {   #   }   }', callbackMock);

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CATEGORY_NAME', 24, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 31, 34);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OCTOTHORPE', 34, 35);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 35, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_CATEGORY_END', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_ARGUMENT_END', 42, 43);
  });

  test('throws if opening tag is not ended before EOF', () => {
    expect(() => tokenizeMessage('<aaa xxx="bbb"', callbackMock)).toThrow(
      new ParserError('Missing closing tag.', '<aaa xxx="bbb"', 14)
    );
  });

  test('throws if argument is not ended before EOF', () => {
    expect(() => tokenizeMessage('<aaa>{xxx', callbackMock)).toThrow(
      new ParserError(
        'Expected an ICU argument type separated by a comma (",") or the end of the argument ("}").',
        '<aaa>{xxx',
        9
      )
    );
  });
});
