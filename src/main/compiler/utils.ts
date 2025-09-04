import { Child, MessageNode } from '../ast.js';

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

export function collectArgumentTsTypes(
  node: MessageNode | Child | Child[],
  getArgumentTsType: (argumentType: string | undefined, argumentName: string) => string | undefined,
  argumentTypes: Map<string, Set<string>>
): void {
  if (typeof node === 'string') {
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      collectArgumentTsTypes(child, getArgumentTsType, argumentTypes);
    }
    return;
  }

  if (node.nodeType === 'message') {
    collectArgumentTsTypes(node.children, getArgumentTsType, argumentTypes);
    return;
  }

  if (node.nodeType === 'element') {
    if (node.attributes !== null) {
      for (const key in node.attributes) {
        collectArgumentTsTypes(node.attributes[key], getArgumentTsType, argumentTypes);
      }
    }

    if (node.children !== null) {
      collectArgumentTsTypes(node.children, getArgumentTsType, argumentTypes);
    }
    return;
  }

  if (node.nodeType === 'select') {
    addArgumentTsType(argumentTypes, node.argumentName, getArgumentTsType(node.type, node.argumentName));

    for (const key in node.categories) {
      collectArgumentTsTypes(node.categories[key], getArgumentTsType, argumentTypes);
    }
    return;
  }

  if (node.nodeType === 'argument') {
    addArgumentTsType(argumentTypes, node.name, getArgumentTsType(node.type, node.name));
  }
}

function addArgumentTsType(
  argumentTsTypes: Map<string, Set<string | undefined>>,
  argumentName: string,
  tsType: string | undefined
) {
  let tsTypes = argumentTsTypes.get(argumentName);

  if (tsTypes === undefined) {
    tsTypes = new Set();
    argumentTsTypes.set(argumentName, tsTypes);
  }

  if (tsType === undefined || tsType === null || tsType === '') {
    return;
  }

  tsTypes.add(tsType);
}

export function escapeJsIdentifier(str: string): string {
  if (jsKeywords.has(str)) {
    return '_' + str;
  }

  return str
    .replace(/[^$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}\u200C\u200D\p{Mn}\p{Mc}\p{Nd}\p{Pc}]/gu, '_')
    .replace(/^[^$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}]/u, '_$&');
}

const jsKeywords = new Set([
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'debugger',
  'default',
  'delete',
  'do',
  'else',
  'enum',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'function',
  'if',
  'import',
  'in',
  'instanceof',
  'new',
  'null',
  'return',
  'super',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'typeof',
  'var',
  'void',
  'while',
  'with',
  'yield',
  'let',
  'static',
  'implements',
  'interface',
  'package',
  'private',
  'protected',
  'public',
]);
