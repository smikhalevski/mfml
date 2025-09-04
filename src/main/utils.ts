import { AnyNode, ArgumentNode, OctothorpeNode } from './types.js';

export function getOctothorpeArgument(octothorpeNode: OctothorpeNode | null): ArgumentNode | null {
  for (let node: AnyNode | null = octothorpeNode; node !== null; node = node.parentNode) {
    if (node.nodeType === 'category') {
      return node.parentNode;
    }
  }
  return null;
}

export function walkNode(node: AnyNode[] | AnyNode | null, callback: (node: AnyNode) => void): void {
  if (node === null) {
    return;
  }

  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; ++i) {
      walkNode(node[i], callback);
    }
    return;
  }

  switch (node.nodeType) {
    case 'message':
      callback(node);
      walkNode(node.childNodes, callback);
      return;

    case 'text':
      callback(node);
      return;

    case 'element':
      callback(node);
      walkNode(node.attributeNodes, callback);
      walkNode(node.childNodes, callback);
      return;

    case 'attribute':
      callback(node);
      walkNode(node.childNodes, callback);
      return;

    case 'argument':
      callback(node);
      walkNode(node.typeNode, callback);
      walkNode(node.styleNode, callback);
      walkNode(node.optionNodes, callback);
      walkNode(node.categoryNodes, callback);
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
      walkNode(node.childNodes, callback);
      return;

    case 'literal':
      callback(node);
      return;
  }
}
