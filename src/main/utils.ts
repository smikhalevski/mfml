import { AnyNode, ArgumentNode, OctothorpeNode } from './types.js';

export function getOctothorpeArgument(octothorpeNode: OctothorpeNode | null): ArgumentNode | null {
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
      walkNodeArray(node.childNodes, callback);
      return;

    case 'text':
      callback(node);
      return;

    case 'element':
      callback(node);
      walkNodeArray(node.attributeNodes, callback);
      walkNodeArray(node.childNodes, callback);
      return;

    case 'attribute':
      callback(node);
      walkNodeArray(node.childNodes, callback);
      return;

    case 'argument':
      callback(node);
      walkNode(node.typeNode, callback);
      walkNode(node.styleNode, callback);
      walkNodeArray(node.optionNodes, callback);
      walkNodeArray(node.categoryNodes, callback);
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
      walkNodeArray(node.childNodes, callback);
      return;

    case 'literal':
      callback(node);
      return;
  }
}

function walkNodeArray(nodes: AnyNode[] | null, callback: (node: AnyNode) => void): void {
  if (nodes === null) {
    return;
  }

  for (let i = 0; i < nodes.length; ++i) {
    walkNode(nodes[i], callback);
  }
}
