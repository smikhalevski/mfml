export function echo(text: string): void {
  if (!echo.isSilent) {
    console.log(text);
  }
}

echo.isColorized = false;
echo.isSilent = false;

function colorize(text: string, startCode: number, endCode: number): string {
  return echo.isColorized ? `\x1b[${startCode}m${text}\x1b[${endCode}m` : text;
}

// Modifiers

export function reset(text: string): string {
  return colorize(text, 0, 0);
}

export function bold(text: string): string {
  return colorize(text, 1, 22);
}

export function dim(text: string): string {
  return colorize(text, 2, 22);
}

export function italic(text: string): string {
  return colorize(text, 3, 23);
}

export function underline(text: string): string {
  return colorize(text, 4, 24);
}

export function inverse(text: string): string {
  return colorize(text, 7, 27);
}

export function hidden(text: string): string {
  return colorize(text, 8, 28);
}

export function strikethrough(text: string): string {
  return colorize(text, 9, 29);
}

// Colors

export function black(text: string): string {
  return colorize(text, 30, 39);
}

export function red(text: string): string {
  return colorize(text, 31, 39);
}

export function green(text: string): string {
  return colorize(text, 32, 39);
}

export function yellow(text: string): string {
  return colorize(text, 33, 39);
}

export function blue(text: string): string {
  return colorize(text, 34, 39);
}

export function magenta(text: string): string {
  return colorize(text, 35, 39);
}

export function cyan(text: string): string {
  return colorize(text, 36, 39);
}

export function white(text: string): string {
  return colorize(text, 37, 39);
}

export function gray(text: string): string {
  return colorize(text, 90, 39);
}

export function grey(text: string): string {
  return colorize(text, 90, 39);
}

// Background colors

export function bgBlack(text: string): string {
  return colorize(text, 40, 49);
}

export function bgRed(text: string): string {
  return colorize(text, 41, 49);
}

export function bgGreen(text: string): string {
  return colorize(text, 42, 49);
}

export function bgYellow(text: string): string {
  return colorize(text, 43, 49);
}

export function bgBlue(text: string): string {
  return colorize(text, 44, 49);
}

export function bgMagenta(text: string): string {
  return colorize(text, 45, 49);
}

export function bgCyan(text: string): string {
  return colorize(text, 46, 49);
}

export function bgWhite(text: string): string {
  return colorize(text, 47, 49);
}
