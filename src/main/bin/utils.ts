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

export function printError(error: unknown): void {
  console.log(bgRed(black(' ERROR ')) + ' ' + formatError(error));
}

function bgRed(text: string): string {
  return color(text, 41, 49);
}

function black(text: string): string {
  return color(text, 30, 39);
}

function color(text: string, startCode: number, endCode: number): string {
  return `\x1b[${startCode}m${text}\x1b[${endCode}m`;
}
