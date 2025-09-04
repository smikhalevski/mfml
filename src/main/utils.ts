import { AnyNode, ArgumentNode, OctothorpeNode } from './types.js';

export function isLowerCaseAlpha(str: string): boolean {
  for (let i = 0; i < str.length; ++i) {
    const charCode = str.charCodeAt(i);

    if (charCode < /* a */ 97 || charCode > /* z */ 122) {
      return false;
    }
  }

  return true;
}

export function getOctothorpeArgument(octothorpeNode: OctothorpeNode | null): ArgumentNode | null {
  for (let node: AnyNode | null = octothorpeNode; node !== null; node = node.parentNode) {
    if (node.nodeType === 'category') {
      return node.parentNode;
    }
  }
  return null;
}

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

function walkNodes(nodes: readonly AnyNode[] | null, callback: (node: AnyNode) => void): void {
  if (nodes === null) {
    return;
  }

  for (let i = 0; i < nodes.length; ++i) {
    walkNode(nodes[i], callback);
  }
}
