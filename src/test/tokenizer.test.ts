import { describe, expect, test, vi } from 'vitest';
import { uncheckedTokenize } from '../main/tokenize.js';

describe('HTML behavior', () => {
  test('tokenizes empty string', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(0);
  });

  test('tokenizes text', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
  });

  test('tokenizes the leading lt as text', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('>aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 5);
  });

  test('treats gt followed by non tag name character as text', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('aaa<+ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 8);
  });

  test('tokenizes the opening tag that starts with the weird char as a text', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<@#$%*>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('tokenizes the opening tag that starts with the weird char as a text', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<xxx@#$%*>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'OPENING_TAG_END', 9, 10);
  });

  test('ignores bullshit in closing tags', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('</xxx @#$%*/>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'CLOSING_TAG', 2, 5);
  });

  test('tokenizes the opening tag in double brackets', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<<xxx>>aaa</xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 1);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'OPENING_TAG_START', 2, 5);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPENING_TAG_END', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 6, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'CLOSING_TAG', 12, 15);
  });

  test('tokenizes empty tag names as text', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('< ></ >', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('tokenizes non-alpha tag names as text', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<111></111>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 11);
  });

  test('tokenizes the malformed closing tag as a text', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('</ xxx>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 7);
  });

  test('tokenizes unterminated opening tags', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
  });

  test('tokenizes unterminated attributes', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<aaa xxx="zzz', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 13);
  });

  test('tokenizes unterminated closing tags', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('</aaa', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(1);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'CLOSING_TAG', 2, 5);
  });

  test('tokenizes opening and closing tags', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('aaa<xxx>bbb</xxx>ccc', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'CLOSING_TAG', 13, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 17, 20);
  });

  test('ignores redundant spaces before opening tag end', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('aaa<xxx   >bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(4);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPENING_TAG_END', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 11, 14);
  });

  test('ignores redundant spaces before closing tag end', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('aaa</xxx   >bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(3);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'CLOSING_TAG', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 12, 15);
  });

  test('tokenizes nested tags', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('aaa<yyy>bbb<xxx>ccc</xxx>ddd</yyy>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(10);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPENING_TAG_END', 7, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OPENING_TAG_START', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'OPENING_TAG_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'CLOSING_TAG', 21, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 25, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'CLOSING_TAG', 30, 33);
  });

  test('tokenizes single-quoted attributes', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize("<xxx yyy='aaa\"bbb' zzz='aaa\"bbb'>", callbackMock, {});

    // expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_START', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 24, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ATTRIBUTE_END', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'OPENING_TAG_END', 32, 33);
  });

  test('tokenizes double-quoted attributes', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<xxx yyy="aaa\'bbb" zzz="aaa\'bbb">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_START', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 24, 31);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ATTRIBUTE_END', 31, 32);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'OPENING_TAG_END', 32, 33);
  });

  test('tokenizes unquoted attributes', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<xxx yyy=aaa"bbb\'ccc>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_END', 20, 20);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OPENING_TAG_END', 20, 21);
  });

  test('tokenizes valueless attributes', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<xxx aaa bbb>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ATTRIBUTE_END', 9, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_START', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_END', 12, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'OPENING_TAG_END', 12, 13);
  });

  test('tokenizes valueless unquoted attributes', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<xxx aaa= bbb=>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_END', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OPENING_TAG_END', 14, 15);
  });

  test('tokenizes entities in attributes', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<xxx aaa=&amp; bbb="&amp;" ccc=\'&amp;\' ddd=>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(13);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_END', 14, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_START', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 20, 25);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'ATTRIBUTE_END', 25, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ATTRIBUTE_START', 27, 30);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'TEXT', 32, 37);
    expect(callbackMock).toHaveBeenNthCalledWith(10, 'ATTRIBUTE_END', 37, 38);
    expect(callbackMock).toHaveBeenNthCalledWith(11, 'ATTRIBUTE_START', 39, 42);
    expect(callbackMock).toHaveBeenNthCalledWith(12, 'ATTRIBUTE_END', 43, 43);
    expect(callbackMock).toHaveBeenNthCalledWith(13, 'OPENING_TAG_END', 43, 44);
  });

  test('ignores leading slash in an attribute name', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<aaa /xxx></xxx aaa>bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(6);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 6, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ATTRIBUTE_END', 9, 9);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'OPENING_TAG_END', 9, 10);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'CLOSING_TAG', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 20, 23);
  });

  test('tokenizes bullshit attribute names', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize("<xxx < = '' fff>vvv</xxx>", callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(8);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 6);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ATTRIBUTE_END', 10, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_START', 12, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_END', 15, 15);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'OPENING_TAG_END', 15, 16);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 16, 19);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'CLOSING_TAG', 21, 24);
  });

  test('tokenizes attributes with unbalanced end quotes', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<xxx yyy="aaa"bbb">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 13);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_END', 13, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_START', 14, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ATTRIBUTE_END', 18, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'OPENING_TAG_END', 18, 19);
  });

  test('does not tokenize self-closing tags by default', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<xxx/>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'OPENING_TAG_END', 5, 6);
  });

  test('tokenizes self-closing tag', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<xxx/>', callbackMock, { enableSelfClosing: true });

    expect(callbackMock).toHaveBeenCalledTimes(2);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'OPENING_TAG_SELF_CLOSE', 4, 6);
  });

  test('does not tokenize self-closing tag with the unquoted attribute that ends with a slash', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<xxx aaa=bbb//>', callbackMock, { enableSelfClosing: true });

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_END', 12, 12);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OPENING_TAG_SELF_CLOSE', 13, 15);
  });

  test('ignores redundant spaces in attributes', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('aaa<yyy xxx   =   "zzz">bbb', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(7);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'TEXT', 0, 3);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'OPENING_TAG_START', 4, 7);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'ATTRIBUTE_START', 8, 11);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'TEXT', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'ATTRIBUTE_END', 22, 23);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'OPENING_TAG_END', 23, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'TEXT', 24, 27);
  });
});

describe('JSX behavior', () => {
  test('does not tokenize tags in quoted attributes', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<aaa xxx="bbb<zzz>ccc</zzz>">', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(5);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 10, 27);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_END', 27, 28);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OPENING_TAG_END', 28, 29);
  });

  test('does not tokenize tags in curly braces attributes by default', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<aaa xxx={bbb<zzz>ccc</zzz>}></aaa>', callbackMock, {});

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'TEXT', 9, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_END', 17, 17);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'OPENING_TAG_END', 17, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'TEXT', 18, 21);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'CLOSING_TAG', 23, 26);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'TEXT', 27, 29);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'CLOSING_TAG', 31, 34);
  });

  test('tokenizes opening tag with attributes in a curly braces attribute', () => {
    const callbackMock = vi.fn();

    uncheckedTokenize('<aaa xxx={<zzz vvv=yyy>}>', callbackMock, { enableJSXAttributes: true });

    expect(callbackMock).toHaveBeenCalledTimes(9);
    expect(callbackMock).toHaveBeenNthCalledWith(1, 'OPENING_TAG_START', 1, 4);
    expect(callbackMock).toHaveBeenNthCalledWith(2, 'ATTRIBUTE_START', 5, 8);
    expect(callbackMock).toHaveBeenNthCalledWith(3, 'OPENING_TAG_START', 11, 14);
    expect(callbackMock).toHaveBeenNthCalledWith(4, 'ATTRIBUTE_START', 15, 18);
    expect(callbackMock).toHaveBeenNthCalledWith(5, 'TEXT', 19, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(6, 'ATTRIBUTE_END', 22, 22);
    expect(callbackMock).toHaveBeenNthCalledWith(7, 'OPENING_TAG_END', 22, 23);
    expect(callbackMock).toHaveBeenNthCalledWith(8, 'ATTRIBUTE_END', 23, 24);
    expect(callbackMock).toHaveBeenNthCalledWith(9, 'OPENING_TAG_END', 24, 25);
  });
});
