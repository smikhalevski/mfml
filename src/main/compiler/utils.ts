export async function sha256(str: string): Promise<string> {
  let hashCode = '';

  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)));

  for (let i = 0; i < bytes.length; ++i) {
    hashCode += bytes[i].toString(16).padStart(2, '0');
  }

  return hashCode;
}

export function formatMessagePreview(text: string, lineLength = 80, lineCount = 3, ellipsis = '…'): string {
  const lines = [];

  let startIndex = 0;
  let endIndex = 0;
  let nextStartIndex = 0;
  let isTruncated = true;

  for (let i = 0, isPrevCharSpace = false; i < text.length && lines.length < lineCount; ++i) {
    const charCode = text.charCodeAt(i);

    // Line breaks
    if (charCode === /* \n */ 10 || charCode === /* \r */ 13) {
      lines.push(text.substring(startIndex, startIndex === endIndex ? i : endIndex));

      startIndex = endIndex = nextStartIndex = i + 1;
      isPrevCharSpace = false;
      continue;
    }

    // Whitespaces
    if (charCode === /* \s */ 32 || charCode === /* \t */ 9) {
      if (startIndex === i) {
        // Ignore spaces at the start of the line
        startIndex = endIndex = i + 1;
      } else if (!isPrevCharSpace) {
        endIndex = i;
      }

      nextStartIndex = i + 1;
      isPrevCharSpace = true;
      continue;
    }

    if (i - startIndex > lineLength) {
      lines.push(text.substring(startIndex, endIndex));
      startIndex = endIndex = nextStartIndex;
    }

    isPrevCharSpace = false;
  }

  if (lines.length < lineCount && startIndex !== endIndex) {
    if (nextStartIndex === text.length) {
      lines.push(text.substring(startIndex, endIndex));
    } else {
      lines.push(text.substring(startIndex));
      nextStartIndex = text.length;
    }
    isTruncated = false;
  }

  if (lines.length < lineCount && nextStartIndex !== text.length) {
    lines.push(text.substring(nextStartIndex));
    isTruncated = false;
  }

  if (isTruncated) {
    lines[lines.length - 1] += ellipsis;
  }

  return lines.join('\n');
}
