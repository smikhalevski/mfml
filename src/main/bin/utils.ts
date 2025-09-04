import { ParserError } from '../parser/tokenizeMessage.js';
import { CompilerError } from '../compiler/createCompiler.js';

const isColorized = process.stdout.isTTY && process.env.FORCE_COLOR !== '0';

export function printHelp(): void {
  console.log(`mfml: ICU MessageFormat + XML/HTML compiler tool. 

${dim('mfml [...options]')}

  ${dim('--config')}  Compile the project given the path to its configuration file.

    ${dim('--help')}  Print this message.

Visit ${blue(underline('https://megastack.dev/mfml'))} for API docs and tutorials.
`);
}

export function printError(error: unknown): void {
  console.log(formatError(error));
}

export function formatError(error: unknown): string {
  if (error instanceof AggregateError) {
    return error.errors.map(formatError).join('\n\n');
  }

  if (error instanceof CompilerError) {
    const prefix = dim(error.locale) + ':' + dim(error.messageKey) + ' - ' + red('error') + ' ';

    if (error.cause instanceof AggregateError) {
      return error.cause.errors.map(error => prefix + formatError(error)).join('\n\n');
    }

    return prefix + formatError(error.cause);
  }

  if (error instanceof ParserError) {
    let message = error.message;

    if (error.startIndex !== -1) {
      message += '\n\n' + formatTextExcerpt(error.text, error.startIndex, Math.max(error.startIndex, error.endIndex));
    }

    return message;
  }

  if (error instanceof Error) {
    return error.message + (error.cause !== undefined ? '\nCaused by: ' + formatError(error.cause) : '');
  }

  return '' + error;
}

function formatTextExcerpt(text: string, startIndex: number, endIndex: number, excerptLength = 80): string {
  let excerptStartIndex = text.lastIndexOf('\n', startIndex) + 1;
  let excerptEndIndex = text.indexOf('\n', startIndex);

  let lineIndex = 0;

  if (excerptEndIndex === -1) {
    excerptEndIndex = text.length;
  }

  for (let i = -1; (i = text.indexOf('\n', i + 1)) !== -1 && i < excerptStartIndex; ) {
    lineIndex++;
  }

  if (endIndex + excerptLength / 2 > excerptEndIndex) {
    // Ends after line end
    excerptEndIndex = Math.min(excerptEndIndex, endIndex + excerptLength);
  } else if (startIndex - excerptLength / 2 < excerptStartIndex) {
    // Starts before line start
    excerptStartIndex = Math.max(excerptStartIndex, startIndex - excerptLength);
  } else {
    // Fits inside the line
    excerptStartIndex = startIndex - excerptLength / 2;
    excerptEndIndex = endIndex + excerptLength / 2;
  }

  const prefix = lineIndex + 1 + '';

  return (
    inverse(prefix) +
    ' ' +
    text.substring(excerptStartIndex, excerptEndIndex) +
    '\n' +
    inverse(' '.repeat(prefix.length)) +
    ' ' +
    ' '.repeat(startIndex - excerptStartIndex) +
    red('~'.repeat(Math.max(1, Math.min(endIndex, excerptEndIndex) - startIndex)))
  );
}

function colorize(text: string, startCode: number, endCode: number): string {
  return isColorized ? `\x1b[${startCode}m${text}\x1b[${endCode}m` : text;
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
