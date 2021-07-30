export function trimFileExtension(filePath: string): string {
  return filePath.replace(/\.[^.]*$/, '');
}
