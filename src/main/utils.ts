import { AnyNode, ArgumentNode, CategoryNode, OctothorpeNode } from './types.js';

export function isLowerCaseAlpha(str: string): boolean {
  for (let i = 0; i < str.length; ++i) {
    const charCode = str.charCodeAt(i);

    if (charCode < /* a */ 97 || charCode > /* z */ 122) {
      return false;
    }
  }

  return true;
}

export function getArgumentType(argumentNode: ArgumentNode): string | null {
  return argumentNode.typeNode === null ? null : argumentNode.typeNode.value;
}

export function getArgumentStyle(argumentNode: ArgumentNode): string | null {
  return argumentNode.styleNode === null ? null : argumentNode.styleNode.value;
}

export function getArgumentOptions(argumentNode: ArgumentNode): Record<string, unknown> | null {
  if (argumentNode.optionNodes === null || argumentNode.optionNodes.length === 0) {
    return null;
  }

  const options: Record<string, unknown> = {};

  for (const optionNode of argumentNode.optionNodes) {
    options[optionNode.name] = optionNode.valueNode === null ? null : optionNode.valueNode.value;
  }
  return options;
}

export function getArgumentCategories(argumentNode: ArgumentNode): string[] | null {
  if (argumentNode.categoryNodes === null || argumentNode.categoryNodes.length === 0) {
    return null;
  }

  const categories = [];

  for (const categoryNode of argumentNode.categoryNodes) {
    categories.push(categoryNode.name);
  }
  return categories;
}

export function getArgumentCategory(argumentNode: ArgumentNode, category: string): CategoryNode | null {
  if (argumentNode.categoryNodes === null || argumentNode.categoryNodes.length === 0) {
    return null;
  }

  for (const categoryNode of argumentNode.categoryNodes) {
    if (categoryNode.name === category) {
      return categoryNode;
    }
  }
  return null;
}

/**
 * Returns an attribute node that is referenced by an octothorpe.
 */
export function getArgumentByOctothorpe(octothorpeNode: OctothorpeNode | null): ArgumentNode | null {
  for (let node: AnyNode | null = octothorpeNode; node !== null; node = node.parentNode) {
    if (node.nodeType === 'category') {
      return node.parentNode;
    }
  }
  return null;
}

/**
 * Walks the AST and invokes callback for each node in a tree in depth-first order.
 *
 * @param node The node to walk.
 * @param callback The callback to invoke.
 * @group Utils
 */
export function walkNode(node: AnyNode | null, callback: (node: AnyNode) => void): void {
  if (node === null) {
    return;
  }

  switch (node.nodeType) {
    case 'message':
      callback(node);
      walkNodes(node.childNodes, callback);
      return;

    case 'text':
      callback(node);
      return;

    case 'element':
      callback(node);
      walkNodes(node.attributeNodes, callback);
      walkNodes(node.childNodes, callback);
      return;

    case 'attribute':
      callback(node);
      walkNodes(node.childNodes, callback);
      return;

    case 'argument':
      callback(node);
      walkNode(node.typeNode, callback);
      walkNode(node.styleNode, callback);
      walkNodes(node.optionNodes, callback);
      walkNodes(node.categoryNodes, callback);
      return;

    case 'octothorpe':
      callback(node);
      return;

    case 'option':
      callback(node);
      walkNode(node.valueNode, callback);
      return;

    case 'category':
      callback(node);
      walkNodes(node.childNodes, callback);
      return;

    case 'literal':
      callback(node);
      return;
  }
}

function walkNodes(nodes: AnyNode[] | null, callback: (node: AnyNode) => void): void {
  if (nodes === null) {
    return;
  }

  for (let i = 0; i < nodes.length; ++i) {
    walkNode(nodes[i], callback);
  }
}

export function getListFormat(locale: string, options?: Intl.ListFormatOptions): Intl.ListFormat {
  return getCachedInstance(Intl.ListFormat, locale, options || defaultOptions);
}

export function getNumberFormat(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
  return getCachedInstance(Intl.NumberFormat, locale, options || defaultOptions);
}

export function getDateTimeFormat(locale: string, options?: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return getCachedInstance(Intl.DateTimeFormat, locale, options || defaultOptions);
}

export function getPluralRules(locale: string, options?: Intl.PluralRulesOptions): Intl.PluralRules {
  return getCachedInstance(Intl.PluralRules, locale, options || defaultOptions);
}

export function getDisplayNames(locale: string, options: Intl.DisplayNamesOptions): Intl.DisplayNames {
  return getCachedInstance(Intl.DisplayNames, locale, options);
}

const defaultOptions = {};

const instanceCache = new Map<string, WeakMap<Function, WeakMap<object, object>>>();

function getCachedInstance<O, T>(constructor: new (locale: string, options: O) => T, locale: string, options: O): T {
  let value;

  value = instanceCache.get(locale) || (instanceCache.set(locale, (value = new WeakMap())), value);

  value = value.get(constructor) || (value.set(constructor, (value = new WeakMap())), value);

  value = value.get(options) || (value.set(options, (value = new constructor(locale, options))), value);

  return value;
}

export function mergeOptions<T>(formatOptions: T, argumentOptions: object | null): T {
  return argumentOptions === null ? formatOptions : { ...formatOptions, ...argumentOptions };
}
