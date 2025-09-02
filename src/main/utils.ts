export function skipTagName(text: string, index: number): number {
  return isTagNameStartChar(getCharCodeAt(text, index)) ? skipChars(text, index + 1, isTagNameChar) : index;
}

/**
 * https://www.w3.org/TR/xml/#NT-NameStartChar
 */
function isTagNameStartChar(charCode: number): boolean {
  return (
    (charCode >= /* a */ 97 && charCode <= /* z */ 122) ||
    (charCode >= /* A */ 65 && charCode <= /* Z */ 90) ||
    charCode === /* _ */ 95 ||
    charCode === /* : */ 58 ||
    (charCode >= 0x000c0 && charCode <= 0x000d6) ||
    (charCode >= 0x000d8 && charCode <= 0x000f6) ||
    (charCode >= 0x000f8 && charCode <= 0x002ff) ||
    (charCode >= 0x00370 && charCode <= 0x0037d) ||
    (charCode >= 0x0037f && charCode <= 0x01fff) ||
    (charCode >= 0x0200c && charCode <= 0x0200d) ||
    (charCode >= 0x02070 && charCode <= 0x0218f) ||
    (charCode >= 0x02c00 && charCode <= 0x02fef) ||
    (charCode >= 0x03001 && charCode <= 0x0d7ff) ||
    (charCode >= 0x0f900 && charCode <= 0x0fdcf) ||
    (charCode >= 0x0fdf0 && charCode <= 0x0fffd) ||
    (charCode >= 0x10000 && charCode <= 0xeffff)
  );
}

function isTagNameChar(charCode: number): boolean {
  return !(isSpaceChar(charCode) || charCode === /* / */ 47 || charCode === /* > */ 62);
}

/**
 * Reads chars until predicate returns `true`.
 */
export function skipChars(text: string, index: number, predicate: (charCode: number) => boolean): number {
  while (index < text.length && predicate(text.charCodeAt(index))) {
    ++index;
  }
  return index;
}

export function getCharCodeAt(text: string, index: number): number {
  return index < text.length ? text.charCodeAt(index) : -1;
}

// https://www.w3.org/TR/xml/#NT-S
export function isSpaceChar(charCode: number): boolean {
  return charCode == /* \s */ 32 || charCode === /* \t */ 9 || charCode === /* \r */ 13 || charCode === /* \n */ 10;
}

export function isAttributeNameChar(charCode: number): boolean {
  return !(isSpaceChar(charCode) || charCode === /* > */ 62 || charCode === /* = */ 61);
}
