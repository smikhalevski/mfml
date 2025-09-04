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

  test('reads the start tag as a text if name begins with a non-valid char', () => {
    readTokens('<@#$%*>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('reads the start tag if name begins with a valid char followed by invalid chars', () => {
    readTokens('<xxx@#$%*>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 9, 10);
  });

  test('ignores bullshit in end tags', () => {
    readTokens('</xxx @#$%*/>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'END_TAG_NAME', 2, 5);
  });

  test('reads the start tag in double brackets', () => {
    readTokens('<<xxx>>aaa</xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 1);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_NAME', 2, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_CLOSING', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 6, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 12, 15);
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

  test('reads the malformed end tag as a text', () => {
    readTokens('</ xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('reads unterminated start tags', () => {
    readTokens('<aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
  });

  test('reads unterminated attributes', () => {
    readTokens('<aaa xxx="zzz', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 13);
  });

  test('reads unterminated end tags', () => {
    readTokens('</aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'END_TAG_NAME', 2, 5);
  });

  test('reads start and end tags', () => {
    readTokens('aaa<xxx>bbb</xxx>ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
  });

  test('ignores comments', () => {
    readTokens('aaa<xxx>bbb<!--</xxx>ccc--></xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 29, 32);
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
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'TEXT', 19, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'END_TAG_NAME', 27, 30);
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
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ATTRIBUTE_CLOSING', 6, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_CLOSING', 6, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 9, 12);
  });

  test('ignores redundant spaces before start tag closing', () => {
    readTokens('aaa<xxx   >bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_CLOSING', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 11, 14);
  });

  test('ignores redundant spaces before end tag closing', () => {
    readTokens('aaa</xxx   >bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'END_TAG_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 12, 15);
  });

  test('reads nested tags', () => {
    readTokens('aaa<yyy>bbb<xxx>ccc</xxx>ddd</yyy>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(10);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_NAME', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'START_TAG_CLOSING', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'END_TAG_NAME', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 25, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'END_TAG_NAME', 30, 33);
  });

  test('reads single-quoted attributes', () => {
    readTokens("<xxx yyy='aaa\"bbb' zzz='aaa\"bbb'>", callbackMock, {});

    // expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_NAME', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 24, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ATTRIBUTE_CLOSING', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'START_TAG_CLOSING', 32, 33);
  });

  test('reads double-quoted attributes', () => {
    readTokens('<xxx yyy="aaa\'bbb" zzz="aaa\'bbb">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_NAME', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 24, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ATTRIBUTE_CLOSING', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'START_TAG_CLOSING', 32, 33);
  });

  test('reads unquoted attributes', () => {
    readTokens('<xxx yyy=aaa"bbb\'ccc>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 20, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 20, 21);
  });

  test('reads valueless attributes', () => {
    readTokens('<xxx aaa bbb>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ATTRIBUTE_CLOSING', 9, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_CLOSING', 12, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'START_TAG_CLOSING', 12, 13);
  });

  test('reads valueless unquoted attributes', () => {
    readTokens('<xxx aaa= bbb=>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 14, 15);
  });

  test('reads entities in attributes', () => {
    readTokens('<xxx aaa=&amp; bbb="&amp;" ccc=\'&amp;\' ddd=>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(13);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_NAME', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 20, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ATTRIBUTE_CLOSING', 25, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ATTRIBUTE_NAME', 27, 30);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 32, 37);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'ATTRIBUTE_CLOSING', 37, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'ATTRIBUTE_NAME', 39, 42);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'ATTRIBUTE_CLOSING', 43, 43);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'START_TAG_CLOSING', 43, 44);
  });

  test('ignores leading slash in an attribute name', () => {
    readTokens('<aaa /xxx></xxx aaa>bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ATTRIBUTE_CLOSING', 9, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_CLOSING', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 20, 23);
  });

  test('reads bullshit attribute names', () => {
    readTokens("<xxx < = '' fff>vvv</xxx>", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ATTRIBUTE_CLOSING', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_NAME', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_CLOSING', 15, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'START_TAG_CLOSING', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'END_TAG_NAME', 21, 24);
  });

  test('reads attributes with unbalanced end quotes', () => {
    readTokens('<xxx yyy="aaa"bbb">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 13, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_NAME', 14, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ATTRIBUTE_CLOSING', 18, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'START_TAG_CLOSING', 18, 19);
  });

  test('does not read self-closing tags by default', () => {
    readTokens('<xxx/>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 5, 6);
  });

  test('reads self-closing tag', () => {
    readTokens('<xxx/>', callbackMock, { isSelfClosingTagsRecognized: true });

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_SELF_CLOSING', 4, 6);
  });

  test('does not read self-closing tag with the unquoted attribute that ends with a slash', () => {
    readTokens('<xxx aaa=bbb//>', callbackMock, { isSelfClosingTagsRecognized: true });

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 12, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_SELF_CLOSING', 13, 15);
  });

  test('ignores redundant spaces in attributes', () => {
    readTokens('aaa<yyy xxx   =   "zzz">bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ATTRIBUTE_NAME', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_CLOSING', 22, 23);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'START_TAG_CLOSING', 23, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 24, 27);
  });

  test('does not read tags in double-quoted attribute', () => {
    readTokens('<aaa xxx="bbb<zzz>ccc</zzz>">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 28, 29);
  });

  test('does not read tags in single-quoted attribute', () => {
    readTokens("<aaa xxx='bbb<zzz>ccc</zzz>'>", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 28, 29);
  });

  test('does not read tags in unquoted attribute', () => {
    readTokens('<aaa xxx=bbb<zzz>ccc</zzz>>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 16, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'END_TAG_NAME', 22, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'TEXT', 26, 27);
  });

  test('ignores tags in raw text tags', () => {
    readTokens('<script><aaa>bbb</aaa></script>', callbackMock, resolveTokenizerOptions({ rawTextTags: ['script'] }));

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 8, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'END_TAG_NAME', 24, 30);
  });

  test('reads attributes of a raw text tag', () => {
    readTokens(
      '<script aaa="xxx" ccc="yyy">zzz</script>',
      callbackMock,
      resolveTokenizerOptions({ rawTextTags: ['script'] })
    );

    expect(callbackMock).toHaveBeenCalledTimes(10);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_NAME', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 23, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ATTRIBUTE_CLOSING', 26, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'START_TAG_CLOSING', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 28, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'END_TAG_NAME', 33, 39);
  });

  test('ignores comments in raw text tags', () => {
    readTokens('<script><!-->bbb</--></script>', callbackMock, resolveTokenizerOptions({ rawTextTags: ['script'] }));

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 8, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'END_TAG_NAME', 23, 29);
  });

  test('matches case-insensitive end raw text tags', () => {
    readTokens(
      '<script><!-->bbb</--></SCRIPT>',
      callbackMock,
      resolveTokenizerOptions({ rawTextTags: ['script'], isCaseInsensitiveTags: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 8, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'END_TAG_NAME', 23, 29);
  });

  test('does not read an argument in raw text tag content by default', () => {
    readTokens('<script>{aaa}</script>', callbackMock, resolveTokenizerOptions({ rawTextTags: ['script'] }));

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 8, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'END_TAG_NAME', 15, 21);
  });

  test('reads an argument in raw text tag content', () => {
    readTokens(
      '<script>{aaa}</script>',
      callbackMock,
      resolveTokenizerOptions({ rawTextTags: ['script'], isRawTextInterpolated: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_CLOSING', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 15, 21);
  });

  test('reads an argument in a raw text tag attribute', () => {
    readTokens(
      '<script aaa="{bbb}">{ccc}</script>',
      callbackMock,
      resolveTokenizerOptions({ rawTextTags: ['script'], isRawTextInterpolated: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_CLOSING', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_CLOSING', 18, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'START_TAG_CLOSING', 19, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ARGUMENT_NAME', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ARGUMENT_CLOSING', 24, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'END_TAG_NAME', 27, 33);
  });

  test('reads an argument with categories in a raw text tag attribute', () => {
    readTokens(
      '<script aaa="{bbb,xxx,yyy{zzz}ppp{<vvv>qqq</vvv>}}"></script>',
      callbackMock,
      resolveTokenizerOptions({ rawTextTags: ['script'] })
    );

    expect(callbackMock).toHaveBeenCalledTimes(14);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_TYPE', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'CATEGORY_NAME', 22, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 26, 29);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'CATEGORY_CLOSING', 29, 30);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'CATEGORY_NAME', 30, 33);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 34, 48);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'CATEGORY_CLOSING', 48, 49);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'ATTRIBUTE_CLOSING', 50, 51);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'START_TAG_CLOSING', 51, 52);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'END_TAG_NAME', 54, 60);
  });

  test('reads an argument', () => {
    readTokens('{aaa}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_CLOSING', 4, 5);
  });

  test('reads an argument inside a tag', () => {
    readTokens('<xxx>{aaa}</xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_CLOSING', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 12, 15);
  });

  test('reads an argument inside a double-quoted attribute', () => {
    readTokens('<xxx aaa="{bbb}"></xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_CLOSING', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_CLOSING', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'START_TAG_CLOSING', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'END_TAG_NAME', 19, 22);
  });

  test('reads an argument inside a single-quoted attribute', () => {
    readTokens("<xxx aaa='{bbb}'></xxx>", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_CLOSING', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_CLOSING', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'START_TAG_CLOSING', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'END_TAG_NAME', 19, 22);
  });

  test('ignores an argument inside an unquoted attribute', () => {
    readTokens('<xxx aaa={bbb}></xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_CLOSING', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'END_TAG_NAME', 17, 20);
  });

  test('reads an argument with name surrounded by spaces', () => {
    readTokens('{   aaa   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_CLOSING', 10, 11);
  });

  test('reads an argument and its type', () => {
    readTokens('{aaa  ,  bbb   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_CLOSING', 15, 16);
  });

  test('reads an argument with type and style', () => {
    readTokens('{aaa  ,  bbb   ,   ccc   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_STYLE', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_CLOSING', 25, 26);
  });

  test('reads an argument with type and select', () => {
    readTokens('{aaa,bbb,ccc   {   ddd   }   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 16, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'CATEGORY_CLOSING', 25, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ARGUMENT_CLOSING', 29, 30);
  });

  test('reads tags in an argument with type and select', () => {
    readTokens('{aaa,bbb,ccc{<xxx>ddd</xxx>}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_NAME', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'END_TAG_NAME', 23, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'CATEGORY_CLOSING', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'ARGUMENT_CLOSING', 28, 29);
  });

  test('reads an octothorpe as text outside of select', () => {
    readTokens('aaa # bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 9);
  });

  test('reads an octothorpe in a select', () => {
    readTokens('{aaa,bbb,ccc{ddd#eee}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OCTOTHORPE', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'CATEGORY_CLOSING', 20, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ARGUMENT_CLOSING', 21, 22);
  });

  test('reads an octothorpe in a select with spaces', () => {
    readTokens('{   xxx   ,   yyy   ,   zzz   {   #   }   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'CATEGORY_NAME', 24, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 31, 34);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OCTOTHORPE', 34, 35);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 35, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'CATEGORY_CLOSING', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ARGUMENT_CLOSING', 42, 43);
  });

  test('reads an octothorpe in a nested select', () => {
    readTokens('{aaa,bbb,ccc{{aaa,bbb,ccc{<zzz>#</zzz>}}}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(14);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_NAME', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ARGUMENT_TYPE', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'CATEGORY_NAME', 22, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'START_TAG_NAME', 27, 30);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'START_TAG_CLOSING', 30, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'OCTOTHORPE', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'END_TAG_NAME', 34, 37);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'CATEGORY_CLOSING', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'ARGUMENT_CLOSING', 39, 40);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'CATEGORY_CLOSING', 40, 41);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'ARGUMENT_CLOSING', 41, 42);
  });

  test('does not read an octothorpe after an argument was closed', () => {
    readTokens('{aaa,bbb,ccc{#}}#', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'OCTOTHORPE', 13, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'CATEGORY_CLOSING', 14, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ARGUMENT_CLOSING', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 16, 17);
  });

  test('does not read tags in an argument with categories in an attribute', () => {
    readTokens('<aaa xxx="{zzz,yyy,fff{<bbb>bbb</bbb>}}"></aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(11);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_TYPE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'CATEGORY_NAME', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 23, 37);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'CATEGORY_CLOSING', 37, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ARGUMENT_CLOSING', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'ATTRIBUTE_CLOSING', 39, 40);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'START_TAG_CLOSING', 40, 41);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'END_TAG_NAME', 43, 46);
  });

  test('ignores trailing comma if an argument type is empty', () => {
    readTokens('{xxx , }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_CLOSING', 7, 8);
  });

  test('throws if argument type is empty', () => {
    expect(() => readTokens('{xxx,,}', callbackMock, {})).toThrow(
      new ParserError('An argument type cannot be empty.', '{xxx,,}', 5)
    );

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
  });

  test('ignores trailing comma if an argument style is empty', () => {
    readTokens('{xxx,yyy , }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_CLOSING', 11, 12);
  });

  test('throws if argument style is empty', () => {
    expect(() => readTokens('{xxx,yyy,,}', callbackMock, {})).toThrow(
      new ParserError('Expected an argument style, category name or option name.', '{xxx,yyy,,}', 9)
    );

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
  });

  test('reads an unquoted option value', () => {
    readTokens('{xxx,yyy , zzz = kkk }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'OPTION_VALUE', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ARGUMENT_CLOSING', 21, 22);
  });

  test('reads an empty option value', () => {
    readTokens('{xxx,yyy , zzz = }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'OPTION_VALUE', 17, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ARGUMENT_CLOSING', 17, 18);
  });

  test('reads a double-quoted option value', () => {
    readTokens('{xxx,yyy , zzz = "kkk\'{,}vvv" }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'OPTION_VALUE', 18, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ARGUMENT_CLOSING', 30, 31);
  });

  test('reads a single-quoted option value', () => {
    readTokens("{xxx,yyy , zzz = 'kkk\"{,}vvv' }", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'OPTION_VALUE', 18, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ARGUMENT_CLOSING', 30, 31);
  });

  test('throws if a quoted option value is unterminated', () => {
    expect(() => readTokens('{xxx,yyy,zzz="  ', callbackMock, {})).toThrow(
      new ParserError('Unterminated argument.', '{xxx,yyy,zzz="  ', 14)
    );

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPTION_NAME', 9, 12);
  });

  test('reads multiple options', () => {
    readTokens('{xxx,yyy , zzz = \'aaa\' vvv="bbb" ppp=qqq }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'OPTION_VALUE', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OPTION_NAME', 23, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'OPTION_VALUE', 28, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'OPTION_NAME', 33, 36);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'OPTION_VALUE', 37, 40);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'ARGUMENT_CLOSING', 41, 42);
  });

  test('reads options mixed with categories', () => {
    readTokens('{xxx,yyy , zzz=aaa kkk {ccc} vvv="bbb" }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(10);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPTION_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'OPTION_VALUE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'CATEGORY_NAME', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 24, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'CATEGORY_CLOSING', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'OPTION_NAME', 29, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'OPTION_VALUE', 34, 37);
  });

  test('throws if a style and options are mixed', () => {
    expect(() => readTokens('{xxx,yyy,kkk zzz=vvv}', callbackMock, {})).toThrow(
      new ParserError(
        'Expected an argument category start ("{") or an option value start ("=").',
        '{xxx,yyy,kkk zzz=vvv}',
        13
      )
    );

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
  });

  test('reads options in an attribute', () => {
    expect(() => readTokens('<aaa bbb="{xxx,yyy,zzz=kkk"></aaa>', callbackMock, {})).toThrow(
      new ParserError('Unterminated argument.', '<aaa bbb="{xxx,yyy,zzz=kkk"></aaa>', 26)
    );

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_TYPE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OPTION_NAME', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'OPTION_VALUE', 23, 26);
  });

  test('throws on non-terminated argument in an attribute', () => {
    expect(() => readTokens('<aaa bbb="{xxx,"></aaa>', callbackMock, {})).toThrow(
      new ParserError('An argument type cannot be empty.', '<aaa bbb="{xxx,"></aaa>', 15)
    );

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 11, 14);
  });

  test('throws on invalid double-quoted argument option in a double-quoted attribute', () => {
    expect(() => readTokens('<aaa bbb="{xxx,yyy,zzz="kkk"}"></aaa>', callbackMock, {})).toThrow(
      new ParserError('Unterminated argument.', '<aaa bbb="{xxx,yyy,zzz="kkk"}"></aaa>', 23)
    );

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_TYPE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OPTION_NAME', 19, 22);
  });

  test('throws on invalid single-quoted argument option in a single-quoted attribute', () => {
    expect(() => readTokens("<aaa bbb='{xxx,yyy,zzz='kkk'}'></aaa>", callbackMock, {})).toThrow(
      new ParserError('Unterminated argument.', "<aaa bbb='{xxx,yyy,zzz='kkk'}'></aaa>", 23)
    );

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_TYPE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OPTION_NAME', 19, 22);
  });

  test('throws on non-escaped quote in an argument with categories inside an attribute', () => {
    expect(() => readTokens('<aaa xxx="{zzz,yyy,fff{"}}"></aaa>', callbackMock, {})).toThrow(
      new ParserError('Unterminated argument.', '<aaa xxx="{zzz,yyy,fff{"}}"></aaa>', 23)
    );

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_NAME', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ARGUMENT_NAME', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ARGUMENT_TYPE', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'CATEGORY_NAME', 19, 22);
  });

  test('reads unterminated category', () => {
    readTokens('{xxx,yyy,zzz{kkk', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'CATEGORY_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 13, 16);
  });
});

describe('tokenizeMessage', () => {
  test('reads the balanced start tag', () => {
    tokenizeMessage('<aaa>bbb</aaa>', callbackMock);

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'END_TAG_NAME', 10, 13);
  });

  test('reads the unbalanced start tag', () => {
    tokenizeMessage('<aaa><bbb>ccc', callbackMock, { isUnbalancedStartTagsImplicitlyClosed: true });

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_CLOSING', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'TEXT', 10, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'END_TAG_NAME', 13, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'END_TAG_NAME', 13, 13);
  });

  test('implicitly closes the immediate parent', () => {
    tokenizeMessage(
      '<aaa>bbb<ccc>ddd',
      callbackMock,
      resolveTokenizerOptions({ isUnbalancedStartTagsImplicitlyClosed: true, implicitlyClosedTags: { ccc: ['aaa'] } })
    );

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'END_TAG_NAME', 8, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'START_TAG_CLOSING', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'END_TAG_NAME', 16, 16);
  });

  test('implicitly closes the ancestor', () => {
    tokenizeMessage(
      '<aaa>bbb<ccc>ddd<eee>',
      callbackMock,
      resolveTokenizerOptions({ isUnbalancedStartTagsImplicitlyClosed: true, implicitlyClosedTags: { eee: ['aaa'] } })
    );

    expect(callbackMock).toHaveBeenCalledTimes(11);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'END_TAG_NAME', 16, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'END_TAG_NAME', 16, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'START_TAG_NAME', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'START_TAG_CLOSING', 20, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'END_TAG_NAME', 21, 21);
  });

  test('implicitly closes the topmost ancestor', () => {
    tokenizeMessage(
      '<aaa>bbb<ccc>ddd<eee>fff<ggg>',
      callbackMock,
      resolveTokenizerOptions({
        isUnbalancedStartTagsImplicitlyClosed: true,
        implicitlyClosedTags: { ggg: ['aaa', 'eee'] },
      })
    );

    expect(callbackMock).toHaveBeenCalledTimes(15);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_NAME', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 12, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'START_TAG_NAME', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'START_TAG_CLOSING', 20, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'END_TAG_NAME', 24, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'END_TAG_NAME', 24, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'END_TAG_NAME', 24, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'START_TAG_NAME', 25, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'START_TAG_CLOSING', 28, 29);
    expect(callbackMock).toHaveBeenNthCalledWith(15, 'END_TAG_NAME', 29, 29);
  });

  test('reads the void tag', () => {
    tokenizeMessage('<aaa>bbb', callbackMock, resolveTokenizerOptions({ voidTags: ['aaa'] }));

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'END_TAG_NAME', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 5, 8);
  });

  test('reads consequent void tags', () => {
    tokenizeMessage('<aaa><bbb>', callbackMock, resolveTokenizerOptions({ voidTags: ['aaa', 'bbb'] }));

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'END_TAG_NAME', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'END_TAG_NAME', 10, 10);
  });

  test('reads the void tag in the container', () => {
    tokenizeMessage('<aaa><bbb></aaa>', callbackMock, resolveTokenizerOptions({ voidTags: ['bbb'] }));

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_CLOSING', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 10, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'END_TAG_NAME', 12, 15);
  });

  test('implicitly closes a tag', () => {
    tokenizeMessage(
      '<aaa><bbb></aaa>',
      callbackMock,
      resolveTokenizerOptions({ isUnbalancedStartTagsImplicitlyClosed: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_NAME', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_CLOSING', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 10, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'END_TAG_NAME', 12, 15);
  });

  test('ignores an unbalanced end tag', () => {
    tokenizeMessage('</aaa>', callbackMock, resolveTokenizerOptions({ isUnbalancedEndTagsIgnored: true }));

    expect(callbackMock).toHaveBeenCalledTimes(0);
  });

  test('ignores an unbalanced end tag in a container', () => {
    tokenizeMessage('<aaa></bbb></aaa>', callbackMock, resolveTokenizerOptions({ isUnbalancedEndTagsIgnored: true }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'END_TAG_NAME', 13, 16);
  });

  test('inserts start tags for unbalanced end tags', () => {
    tokenizeMessage('</aaa>', callbackMock, resolveTokenizerOptions({ implicitlyOpenedTags: ['aaa'] }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 2, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'END_TAG_NAME', 2, 5);
  });

  test('inserts start tag that forcefully closes preceding tag', () => {
    tokenizeMessage(
      '<aaa></bbb>',
      callbackMock,
      resolveTokenizerOptions({ implicitlyClosedTags: { bbb: ['aaa'] }, implicitlyOpenedTags: ['bbb'] })
    );

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'END_TAG_NAME', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_NAME', 7, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'START_TAG_CLOSING', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'END_TAG_NAME', 7, 10);
  });

  test('inserts start tags and end tags during nesting of the same tag', () => {
    tokenizeMessage(
      'aaa<xxx>bbb<xxx>ccc</xxx>ddd</xxx>eee',
      callbackMock,
      resolveTokenizerOptions({ implicitlyClosedTags: { xxx: ['xxx'] }, implicitlyOpenedTags: ['xxx'] })
    );

    expect(callbackMock).toHaveBeenCalledTimes(14);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 11, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'START_TAG_NAME', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'START_TAG_CLOSING', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'END_TAG_NAME', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'TEXT', 25, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'START_TAG_NAME', 30, 33);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'START_TAG_CLOSING', 33, 34);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'END_TAG_NAME', 30, 33);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'TEXT', 34, 37);
  });

  test('reads case-sensitive end tags by default', () => {
    tokenizeMessage('<aaa></AAA>', callbackMock, {
      isUnbalancedStartTagsImplicitlyClosed: true,
      isUnbalancedEndTagsIgnored: true,
    });

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'END_TAG_NAME', 11, 11);
  });

  test('reads case-insensitive end tags', () => {
    tokenizeMessage('<aaa></AAA>', callbackMock, resolveTokenizerOptions({ isCaseInsensitiveTags: true }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'END_TAG_NAME', 7, 10);
  });

  test('read non ASCII alpha-chars as case-sensitive in case-insensitive tag matching mode', () => {
    tokenizeMessage(
      '<aaaффф></AAAФФФ>',
      callbackMock,
      resolveTokenizerOptions({
        isCaseInsensitiveTags: true,
        isUnbalancedStartTagsImplicitlyClosed: true,
        isUnbalancedEndTagsIgnored: true,
      })
    );

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'END_TAG_NAME', 17, 17);
  });

  test('closes unbalanced tags', () => {
    tokenizeMessage(
      '<a><b></a></b>',
      callbackMock,
      resolveTokenizerOptions({ isUnbalancedStartTagsImplicitlyClosed: true, isUnbalancedEndTagsIgnored: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'START_TAG_NAME', 1, 2);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'START_TAG_CLOSING', 2, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'START_TAG_NAME', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'START_TAG_CLOSING', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'END_TAG_NAME', 6, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'END_TAG_NAME', 8, 9);
  });

  test('reads an argument with categories with octothorpe', () => {
    tokenizeMessage('{   xxx   ,   yyy   ,   zzz   {   #   }   }', callbackMock);

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ARGUMENT_NAME', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ARGUMENT_TYPE', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'CATEGORY_NAME', 24, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 31, 34);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OCTOTHORPE', 34, 35);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 35, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'CATEGORY_CLOSING', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ARGUMENT_CLOSING', 42, 43);
  });

  test('throws if start tag is not closed before EOF', () => {
    expect(() => tokenizeMessage('<aaa xxx="bbb"', callbackMock)).toThrow(
      new ParserError('Missing end tag.', '<aaa xxx="bbb"', 14)
    );
  });

  test('throws if an argument is not closed before EOF', () => {
    expect(() => tokenizeMessage('{aaa', callbackMock)).toThrow(
      new ParserError(
        'Expected an argument type separated by a comma (",") or the end of the argument ("}").',
        '{aaa',
        4
      )
    );

    expect(() => tokenizeMessage('{aaa,', callbackMock)).toThrow(
      new ParserError('An argument type cannot be empty.', '{aaa,', 5)
    );

    expect(() => tokenizeMessage('{aaa,bbb', callbackMock)).toThrow(
      new ParserError(
        'Expected an argument style, category name, or option name separated by a comma (",") or the end of the argument ("}").',
        '{aaa,bbb',
        8
      )
    );

    expect(() => tokenizeMessage('{aaa,bbb,', callbackMock)).toThrow(
      new ParserError('Expected an argument style, category name or option name.', '{aaa,bbb,', 9)
    );

    expect(() => tokenizeMessage('{aaa,bbb,ccc', callbackMock)).toThrow(
      new ParserError('Expected an argument category start ("{") or an option value start ("=").', '{aaa,bbb,ccc', 12)
    );

    expect(() => tokenizeMessage('{aaa,bbb,ccc{', callbackMock)).toThrow(
      new ParserError('Unterminated argument.', '{aaa,bbb,ccc{', 13)
    );

    expect(() => tokenizeMessage('{aaa,bbb,ccc{ddd', callbackMock)).toThrow(
      new ParserError('Unterminated argument.', '{aaa,bbb,ccc{ddd', 16)
    );

    expect(() => tokenizeMessage('{aaa,bbb,ccc{{xxx,yyy,zzz{kkk', callbackMock)).toThrow(
      new ParserError('Unterminated argument.', '{aaa,bbb,ccc{{xxx,yyy,zzz{kkk', 29)
    );

    expect(() => tokenizeMessage('{aaa,bbb,ccc{<ppp>{xxx,yyy,zzz{kkk', callbackMock)).toThrow(
      new ParserError('Unterminated argument.', '{aaa,bbb,ccc{<ppp>{xxx,yyy,zzz{kkk', 34)
    );

    expect(() =>
      tokenizeMessage('{aaa,bbb,ccc{<ppp>', callbackMock, { isUnbalancedStartTagsImplicitlyClosed: true })
    ).toThrow(new ParserError('Unterminated argument.', '{aaa,bbb,ccc{<ppp>', 18));

    expect(() => tokenizeMessage('{aaa,bbb,ccc{<ppp>', callbackMock)).toThrow(
      new ParserError('Missing end tag.', '{aaa,bbb,ccc{<ppp>', 18)
    );
  });

  test('throws if an argument inside a tag is not closed before EOF', () => {
    expect(() => tokenizeMessage('<aaa>{xxx', callbackMock)).toThrow(
      new ParserError(
        'Expected an argument type separated by a comma (",") or the end of the argument ("}").',
        '<aaa>{xxx',
        9
      )
    );
  });
});
