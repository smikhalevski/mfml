export async function hashCode(str: string, charCount: number): Promise<string> {
  let hashCode = '';

  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)));

  for (let i = 0; i < bytes.length && hashCode.length < charCount; ++i) {
    hashCode += bytes[i].toString(16).padStart(2, '0');
  }

  return hashCode;
}

export function formatMarkdownBold(text: string): string {
  return '**' + text + '**';
}

export function formatMarkdownFence(text: string, language = ''): string {
  return '```' + language + '\n' + text.replace(/`/g, '\\&$') + '\n```';
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
