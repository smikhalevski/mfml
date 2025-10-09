export function print(text: string): void {
  if (!print.isSilent) {
    console.log(text);
  }
}

print.isColorized = false;
print.isSilent = false;

export function inverse(text: string): string {
  return colorize(text, 7, 27);
}

export function red(text: string): string {
  return colorize(text, 31, 39);
}

export function cyan(text: string): string {
  return colorize(text, 36, 39);
}

export function green(text: string): string {
  return colorize(text, 32, 39);
}

export function magenta(text: string): string {
  return colorize(text, 35, 39);
}

export function yellow(text: string): string {
  return colorize(text, 33, 39);
}

export function blue(text: string): string {
  return colorize(text, 34, 39);
}

export function dim(text: string): string {
  return colorize(text, 2, 22);
}

export function underline(text: string): string {
  return colorize(text, 4, 24);
}

function colorize(text: string, startCode: number, endCode: number): string {
  return print.isColorized ? `\x1b[${startCode}m${text}\x1b[${endCode}m` : text;
}
