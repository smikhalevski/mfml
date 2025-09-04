export function isLowerCaseAlpha(str: string): boolean {
  for (let i = 0; i < str.length; ++i) {
    const charCode = str.charCodeAt(i);

    if (charCode < /* a */ 97 || charCode > /* z */ 122) {
      return false;
    }
  }

  return true;
}
