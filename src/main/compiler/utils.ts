export async function toHashCode(str: string, length: number): Promise<string> {
  let hashCode = '';

  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)));

  for (let i = 0; i < bytes.length && hashCode.length < length; ++i) {
    hashCode += bytes[i].toString(16).padStart(2, '0');
  }

  return hashCode;
}

export function formatMarkdownBold(text: string): string {
  return '**' + text + '**';
}

export function formatMarkdownFence(text: string, language = ''): string {
  return '```' + language + '\n' + text.replace(/```/g, '\\```') + '\n```';
}

export function formatJSDocComment(text: string): string {
  return '/**\n * ' + text.replace(/\n/g, '\n * ') + '\n */';
}

export function truncateMessage(text: string, charCount = 300, ellipsis = '…'): string {
  if (text.length < charCount) {
    return text;
  }

  for (let i = 0, truncateIndex = 0, isPrevCharSignificant = false; i < text.length; ++i) {
    const charCode = text.charCodeAt(i);

    if (charCode == /* \s */ 32 || charCode === /* \n */ 10 || charCode === /* \t */ 9 || charCode === /* \r */ 13) {
      if (isPrevCharSignificant) {
        truncateIndex = i;
      }
      isPrevCharSignificant = false;
      continue;
    }

    if (i > charCount && truncateIndex !== 0) {
      return text.substring(0, truncateIndex) + ellipsis;
    }

    isPrevCharSignificant = true;
  }

  return text;
}

export function escapeJSIdentifier(str: string): string {
  if (jsKeywords.has(str)) {
    return '_' + str;
  }

  str = str.replace(/[^$_\p{L}\p{Nl}\p{Mn}\p{Mc}\p{Nd}\p{Pc}]/gu, '_');

  return /^[$_\p{L}\p{Nl}]/u.test(str) ? str : '_' + str;
}

const jsKeywords = new Set(
  (
    'break case catch class const continue debugger default delete do else enum export extends false ' +
    'finally for function if import in instanceof new null return super switch this throw true try ' +
    'typeof var void while with yield let static implements interface package private protected public'
  ).split(' ')
);
