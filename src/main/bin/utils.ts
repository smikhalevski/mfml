import { ParserError } from '../parser/index.js';
import { CompilerError } from '../compiler/index.js';

export function print(text: string): void {
  if (!print.isSilent) {
    console.log(text);
  }
}

print.isColorized = false;
print.isSilent = false;

export function printHelp(): void {
  print(`mfml: ICU MessageFormat + XML/HTML compiler tool. 

${dim('mfml [...options]')}

    ${dim('--help')}  Print this message.
    
  ${dim('--config')}  Compile the project given the path to its configuration file.

  ${dim('--silent')}  Suppress all output.

   ${dim('--color')}  Force colorized output.

Visit ${blue(underline('https://megastack.dev/mfml'))} for API docs and tutorials.
`);
}

export function printError(error: unknown): void {
  print(formatError(error));
}

export function formatError(error: unknown): string {
  if (error instanceof AggregateError) {
    return error.errors.map(formatError).join('\n\n');
  }

  if (error instanceof CompilerError) {
    const prefix = dim(error.locale) + ': ' + dim(error.messageKey) + ' - ' + red('error') + ' ';

    if (error.cause instanceof AggregateError) {
      return error.cause.errors.map(error => prefix + formatError(error)).join('\n\n');
    }

    return prefix + formatError(error.cause);
  }

  if (error instanceof ParserError) {
    let message = error.message;

    if (error.startIndex !== -1) {
      message += '\n\n' + formatSyntaxError(error.text, error.startIndex, Math.max(error.startIndex, error.endIndex));
    }

    return message;
  }

  if (error instanceof Error) {
    return error.message + (error.cause !== undefined ? '\nCaused by: ' + formatError(error.cause) : '');
  }

  return '' + error;
}

function formatSyntaxError(text: string, errorStartIndex: number, errorEndIndex: number, excerptLength = 80): string {
  let startIndex = text.lastIndexOf('\n', errorStartIndex) + 1;
  let endIndex = text.indexOf('\n', errorStartIndex);

  let lineIndex = 0;

  if (endIndex === -1) {
    endIndex = text.length;
  }

  for (let i = -1; (i = text.indexOf('\n', i + 1)) !== -1 && i < startIndex; ) {
    lineIndex++;
  }

  if (errorEndIndex + excerptLength / 2 > endIndex) {
    // Overflows at end
    endIndex = Math.min(endIndex, errorEndIndex + excerptLength);
    startIndex = Math.max(startIndex, endIndex - excerptLength);
  } else if (errorStartIndex - excerptLength / 2 < startIndex) {
    // Overflows at start
    startIndex = Math.max(startIndex, errorStartIndex - excerptLength);
    endIndex = Math.min(startIndex + excerptLength, endIndex);
  } else {
    // No overflow
    startIndex = errorStartIndex - excerptLength / 2;
    endIndex = errorEndIndex + excerptLength / 2;
  }

  const prefix = lineIndex + 1 + '';

  return (
    inverse(prefix) +
    ' ' +
    text.substring(startIndex, endIndex) +
    '\n' +
    inverse(' '.repeat(prefix.length)) +
    ' ' +
    ' '.repeat(errorStartIndex - startIndex) +
    red('~'.repeat(Math.max(1, Math.min(errorEndIndex, endIndex) - errorStartIndex)))
  );
}

function colorize(text: string, startCode: number, endCode: number): string {
  return print.isColorized ? `\x1b[${startCode}m${text}\x1b[${endCode}m` : text;
}

function inverse(text: string): string {
  return colorize(text, 7, 27);
}

function red(text: string): string {
  return colorize(text, 31, 39);
}

function blue(text: string): string {
  return colorize(text, 34, 39);
}

function dim(text: string): string {
  return colorize(text, 2, 22);
}

function underline(text: string): string {
  return colorize(text, 4, 24);
}
