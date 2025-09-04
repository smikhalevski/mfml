export function formatError(error: unknown): string {
  if (error === null || error === undefined) {
    return '';
  }

  if (error instanceof Error) {
    let message = error.message;

    if (error.cause instanceof Error) {
      message += '\n  Caused by: ' + formatError(error.cause).replace(/\n/g, '\n  ');
    }

    return message;
  }

  return '' + error;
}

export function printHelp(): void {
  console.log(`ICU MessageFormat + XML/HTML compiler tool. 

Visit ${decorateLink('https://megastack.dev/mfml')} for API docs and tutorials.


${decorateHeader('USAGE')}

${decorateCommand('mfml [...options]')}


${decorateHeader('OPTIONS')}

${decorateCommand('--config')}  A path to a configuration file.

  ${decorateCommand('--help')}  Print this message.
`);
}

export function printError(error: unknown): void {
  console.log(bgRed(black(' ERROR ')) + ' ' + formatError(error));
}

function bgRed(text: string): string {
  return formatCLI(text, 41, 49);
}

function black(text: string): string {
  return formatCLI(text, 30, 39);
}

function blue(text: string): string {
  return formatCLI(text, 34, 39);
}

function dim(text: string): string {
  return formatCLI(text, 2, 22);
}

function underline(text: string): string {
  return formatCLI(text, 4, 24);
}

function bold(text: string): string {
  return formatCLI(text, 1, 22);
}

function decorateHeader(text: string): string {
  return bold(text);
}

function decorateCommand(text: string): string {
  return dim(text);
}

function decorateLink(text: string): string {
  return blue(underline(text));
}

function formatCLI(text: string, startCode: number, endCode: number): string {
  return `\x1b[${startCode}m${text}\x1b[${endCode}m`;
}
