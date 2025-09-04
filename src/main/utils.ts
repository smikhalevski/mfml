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
