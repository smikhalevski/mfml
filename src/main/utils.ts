import { Child, MessageNode } from './ast.js';

export function collectArgumentNames(node: MessageNode | Child | Child[], argumentNames: Set<string>): void {
  if (typeof node === 'string') {
    return;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      collectArgumentNames(child, argumentNames);
    }
    return;
  }

  if (node.nodeType === 'message') {
    collectArgumentNames(node.children, argumentNames);
    return;
  }

  if (node.nodeType === 'element') {
    if (node.attributes !== null) {
      for (const key in node.attributes) {
        collectArgumentNames(node.attributes[key], argumentNames);
      }
    }
    if (node.children !== null) {
      collectArgumentNames(node.children, argumentNames);
    }
    return;
  }

  if (node.nodeType === 'select') {
    argumentNames.add(node.argumentName);

    for (const key in node.categories) {
      collectArgumentNames(node.categories[key], argumentNames);
    }
    return;
  }

  if (node.nodeType === 'argument') {
    argumentNames.add(node.name);
  }
}

const keywords = new Set([
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

export function escapeIdentifier(str: string): string {
  if (keywords.has(str)) {
    return '_' + str;
  }

  return str
    .replace(/[^$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}\u200C\u200D\p{Mn}\p{Mc}\p{Nd}\p{Pc}]/gu, '_')
    .replace(/^[^$_\p{Lu}\p{Ll}\p{Lt}\p{Lm}\p{Lo}\p{Nl}]/u, '_$&');
}

export function isLowerCaseAlpha(str: string): boolean {
  for (let i = 0; i < str.length; ++i) {
    const charCode = str.charCodeAt(i);

    if (charCode < /* a */ 97 || charCode > /* z */ 122) {
      return false;
    }
  }

  return true;
}
