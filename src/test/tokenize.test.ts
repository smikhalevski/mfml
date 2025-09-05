import { describe, expect, test, vi } from 'vitest';
import { readTokens, tokenize } from '../main/tokenize.js';
import { parseConfig } from '../main/parseConfig.js';

describe('readTokens', () => {
  test('reads empty string', () => {
    const callbackMock = vi.fn();

    readTokens('', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(0);
  });

  test('reads text', () => {
    const callbackMock = vi.fn();

    readTokens('aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
  });

  test('reads the leading lt as text', () => {
    const callbackMock = vi.fn();

    readTokens('>aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 5);
  });

  test('treats gt followed by non tag name character as text', () => {
    const callbackMock = vi.fn();

    readTokens('aaa<+ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 8);
  });

  test('reads the opening tag that starts with the weird char as a text', () => {
    const callbackMock = vi.fn();

    readTokens('<@#$%*>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('reads the opening tag that starts with the weird char as a text', () => {
    const callbackMock = vi.fn();

    readTokens('<xxx@#$%*>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 9, 10);
  });

  test('ignores bullshit in closing tags', () => {
    const callbackMock = vi.fn();

    readTokens('</xxx @#$%*/>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_CLOSING_TAG', 2, 5);
  });

  test('reads the opening tag in double brackets', () => {
    const callbackMock = vi.fn();

    readTokens('<<xxx>>aaa</xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 1);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_START', 2, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 6, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 12, 15);
  });

  test('reads empty tag names as text', () => {
    const callbackMock = vi.fn();

    readTokens('< ></ >', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('reads non-alpha tag names as text', () => {
    const callbackMock = vi.fn();

    readTokens('<111></111>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 11);
  });

  test('reads the malformed closing tag as a text', () => {
    const callbackMock = vi.fn();

    readTokens('</ xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('reads unterminated opening tags', () => {
    const callbackMock = vi.fn();

    readTokens('<aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
  });

  test('reads unterminated attributes', () => {
    const callbackMock = vi.fn();

    readTokens('<aaa xxx="zzz', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 13);
  });

  test('reads unterminated closing tags', () => {
    const callbackMock = vi.fn();

    readTokens('</aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_CLOSING_TAG', 2, 5);
  });

  test('reads opening and closing tags', () => {
    const callbackMock = vi.fn();

    readTokens('aaa<xxx>bbb</xxx>ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
  });

  test('does not reads emojis as tag names', () => {
    const callbackMock = vi.fn();

    readTokens('aaa<❤️>bbb</👨‍❤️‍💋‍👨>ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 27);
  });

  test('reads lt as an attribute name', () => {
    const callbackMock = vi.fn();

    readTokens('<aaa <></aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 6, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 6, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 9, 12);
  });

  test('ignores redundant spaces before opening tag end', () => {
    const callbackMock = vi.fn();

    readTokens('aaa<xxx   >bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_END', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 11, 14);
  });

  test('ignores redundant spaces before closing tag end', () => {
    const callbackMock = vi.fn();

    readTokens('aaa</xxx   >bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_CLOSING_TAG', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 12, 15);
  });

  test('reads nested tags', () => {
    const callbackMock = vi.fn();

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
    const callbackMock = vi.fn();

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
    const callbackMock = vi.fn();

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
    const callbackMock = vi.fn();

    readTokens('<xxx yyy=aaa"bbb\'ccc>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 20, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 20, 21);
  });

  test('reads valueless attributes', () => {
    const callbackMock = vi.fn();

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
    const callbackMock = vi.fn();

    readTokens('<xxx aaa= bbb=>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 14, 15);
  });

  test('reads entities in attributes', () => {
    const callbackMock = vi.fn();

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
    const callbackMock = vi.fn();

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
    const callbackMock = vi.fn();

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
    const callbackMock = vi.fn();

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
    const callbackMock = vi.fn();

    readTokens('<xxx/>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 5, 6);
  });

  test('reads self-closing tag', () => {
    const callbackMock = vi.fn();

    readTokens('<xxx/>', callbackMock, { enableSelfClosingTags: true });

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_SELF_CLOSE', 4, 6);
  });

  test('does not read self-closing tag with the unquoted attribute that ends with a slash', () => {
    const callbackMock = vi.fn();

    readTokens('<xxx aaa=bbb//>', callbackMock, { enableSelfClosingTags: true });

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 12, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_SELF_CLOSE', 13, 15);
  });

  test('ignores redundant spaces in attributes', () => {
    const callbackMock = vi.fn();

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

  test('does not read tags in quoted attributes', () => {
    const callbackMock = vi.fn();

    readTokens('<aaa xxx="bbb<zzz>ccc</zzz>">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 28, 29);
  });

  test('does not read tags in curly braces attributes by default', () => {
    const callbackMock = vi.fn();

    readTokens('<aaa xxx={bbb<zzz>ccc</zzz>}></aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_END', 17, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG', 23, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'TEXT', 27, 29);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'XML_CLOSING_TAG', 31, 34);
  });

  test('reads opening tag with attributes in a curly braces attribute', () => {
    const callbackMock = vi.fn();

    readTokens('<aaa xxx={<zzz vvv=yyy>}>', callbackMock, { enableJSXAttributes: true });

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_START', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_ATTRIBUTE_START', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'TEXT', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_ATTRIBUTE_END', 22, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_OPENING_TAG_END', 22, 23);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_ATTRIBUTE_END', 23, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'XML_OPENING_TAG_END', 24, 25);
  });

  test('escape char escapes opening tag start', () => {
    const callbackMock = vi.fn();

    readTokens('\\<aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 1, 6);
  });

  test('escapes opening tag', () => {
    const callbackMock = vi.fn();

    readTokens('\\<aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 1, 6);
  });

  test('escapes inside curly braces attribute', () => {
    const callbackMock = vi.fn();

    readTokens('<aaa xxx={zzz\\}yyy}>', callbackMock, { enableJSXAttributes: true });

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 14, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_ATTRIBUTE_END', 18, 19);
  });

  test('does not escape char in a tag name', () => {
    const callbackMock = vi.fn();

    readTokens('<a\\aa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 5, 6);
  });

  test('does not escape char in an attribute name', () => {
    const callbackMock = vi.fn();

    readTokens('<aaa b\\bb>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_ATTRIBUTE_START', 5, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_ATTRIBUTE_END', 9, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
  });

  test('reads an ICU argument', () => {
    const callbackMock = vi.fn();

    readTokens('{aaa}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_END', 4, 5);
  });

  test('reads an ICU argument inside a tag', () => {
    const callbackMock = vi.fn();

    readTokens('<xxx>{aaa}</xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 12, 15);
  });

  test('reads an ICU argument with name surrounded by spaces', () => {
    const callbackMock = vi.fn();

    readTokens('{   aaa   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_END', 10, 11);
  });

  test('reads an ICU argument with type', () => {
    const callbackMock = vi.fn();

    readTokens('{aaa  ,  bbb   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_END', 15, 16);
  });

  test('reads an ICU argument with type and style', () => {
    const callbackMock = vi.fn();

    readTokens('{aaa  ,  bbb   ,   ccc   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_ARGUMENT_STYLE', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_END', 25, 26);
  });

  test('reads an ICU argument with type and choice', () => {
    const callbackMock = vi.fn();

    readTokens('{aaa,bbb,ccc   {   ddd   }   }', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CASE_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 16, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_CASE_END', 25, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ICU_ARGUMENT_END', 29, 30);
  });

  test('reads tags in an ICU argument with type and choice', () => {
    const callbackMock = vi.fn();

    readTokens('{aaa,bbb,ccc{<xxx>ddd</xxx>}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CASE_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_START', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG', 23, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_CASE_END', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'ICU_ARGUMENT_END', 28, 29);
  });

  test('reads an ICU octothorpe as text outside of choice', () => {
    const callbackMock = vi.fn();

    readTokens('aaa # bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 9);
  });

  test('reads an ICU octothorpe in a choice', () => {
    const callbackMock = vi.fn();

    readTokens('{aaa,bbb,ccc{ddd#eee}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CASE_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_OCTOTHORPE', 16, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ICU_CASE_END', 20, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ICU_ARGUMENT_END', 21, 22);
  });

  test('reads an ICU octothorpe in a nested choice', () => {
    const callbackMock = vi.fn();

    readTokens('{aaa,bbb,ccc{{aaa,bbb,ccc{<zzz>#</zzz>}}}}', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(14);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'ICU_ARGUMENT_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ICU_ARGUMENT_TYPE', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ICU_CASE_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ICU_ARGUMENT_START', 14, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ICU_ARGUMENT_TYPE', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ICU_CASE_START', 22, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_OPENING_TAG_START', 27, 30);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'XML_OPENING_TAG_END', 30, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'ICU_OCTOTHORPE', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'XML_CLOSING_TAG', 34, 37);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'ICU_CASE_END', 38, 39);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'ICU_ARGUMENT_END', 39, 40);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'ICU_CASE_END', 40, 41);
    expect(callbackMock).toHaveBeenNthCalledWith(14, 'ICU_ARGUMENT_END', 41, 42);
  });
});

describe('tokenize', () => {
  test('reads the balanced start tag', () => {
    const callbackMock = vi.fn();

    tokenize('<aaa>bbb</aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_CLOSING_TAG', 10, 13);
  });

  test('reads the unbalanced start tag', () => {
    const callbackMock = vi.fn();

    tokenize('<aaa><bbb>ccc', callbackMock, { autoBalanceClosingTags: true });

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'TEXT', 10, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 13, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'XML_CLOSING_TAG', 13, 13);
  });

  test('auto closes the immediate parent', () => {
    const callbackMock = vi.fn();

    tokenize(
      '<aaa>bbb<ccc>ddd',
      callbackMock,
      parseConfig({ autoBalanceClosingTags: true, forceClosingTags: { ccc: ['aaa'] } })
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

  test('auto closes the ancestor', () => {
    const callbackMock = vi.fn();

    tokenize(
      '<aaa>bbb<ccc>ddd<eee>',
      callbackMock,
      parseConfig({ autoBalanceClosingTags: true, forceClosingTags: { eee: ['aaa'] } })
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

  test('auto closes the topmost ancestor', () => {
    const callbackMock = vi.fn();

    tokenize(
      '<aaa>bbb<ccc>ddd<eee>fff<ggg>',
      callbackMock,
      parseConfig({ autoBalanceClosingTags: true, forceClosingTags: { ggg: ['aaa', 'eee'] } })
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
    const callbackMock = vi.fn();

    tokenize('<aaa>bbb', callbackMock, parseConfig({ voidTags: ['aaa'] }));

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 5, 8);
  });

  test('reads consequent void tags', () => {
    const callbackMock = vi.fn();

    tokenize('<aaa><bbb>', callbackMock, parseConfig({ voidTags: ['aaa', 'bbb'] }));

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 5, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 10, 10);
  });

  test('reads the void tag in the container', () => {
    const callbackMock = vi.fn();

    tokenize('<aaa><bbb></aaa>', callbackMock, parseConfig({ voidTags: ['bbb'] }));

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 10, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 12, 15);
  });

  test('auto closes a tag', () => {
    const callbackMock = vi.fn();

    tokenize('<aaa><bbb></aaa>', callbackMock, parseConfig({ autoBalanceClosingTags: true }));

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_OPENING_TAG_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'XML_OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'XML_CLOSING_TAG', 10, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'XML_CLOSING_TAG', 12, 15);
  });

  test('ignores an orphan closing tag', () => {
    const callbackMock = vi.fn();

    tokenize('</aaa>', callbackMock, parseConfig({ ignoreOrphanClosingTags: true }));

    expect(callbackMock).toHaveBeenCalledTimes(0);
  });

  test('ignores an orphan closing tag in a container', () => {
    const callbackMock = vi.fn();

    tokenize('<aaa></bbb></aaa>', callbackMock, parseConfig({ ignoreOrphanClosingTags: true }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 13, 16);
  });

  test('inserts opening tags for orphan closing tags', () => {
    const callbackMock = vi.fn();

    tokenize('</aaa>', callbackMock, parseConfig({ forceOpeningTags: ['aaa'] }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 0, 0);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 0, 0);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 2, 5);
  });

  test('inserts opening tag that forcefully closes preceding tag', () => {
    const callbackMock = vi.fn();

    tokenize(
      '<aaa></bbb>',
      callbackMock,
      parseConfig({ forceClosingTags: { bbb: ['aaa'] }, forceOpeningTags: ['bbb'] })
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
    const callbackMock = vi.fn();

    tokenize(
      'aaa<xxx>bbb<xxx>ccc</xxx>ddd</xxx>eee',
      callbackMock,
      parseConfig({ forceClosingTags: { xxx: ['xxx'] }, forceOpeningTags: ['xxx'] })
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
    const callbackMock = vi.fn();

    tokenize('<aaa></AAA>', callbackMock, { autoBalanceClosingTags: true, ignoreOrphanClosingTags: true });

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 11, 11);
  });

  test('reads case-insensitive closing tags', () => {
    const callbackMock = vi.fn();

    tokenize('<aaa></AAA>', callbackMock, parseConfig({ isCaseInsensitiveTags: true }));

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 4, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 7, 10);
  });

  test('read non ASCII alpha-chars as case-sensitive in case-insensitive tag matching mode', () => {
    const callbackMock = vi.fn();

    tokenize(
      '<aaaффф></AAAФФФ>',
      callbackMock,
      parseConfig({ isCaseInsensitiveTags: true, autoBalanceClosingTags: true, ignoreOrphanClosingTags: true })
    );

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'XML_OPENING_TAG_START', 1, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'XML_OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'XML_CLOSING_TAG', 17, 17);
  });
});
