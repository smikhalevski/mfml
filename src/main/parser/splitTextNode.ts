import {ITextNode, Node, NodeType} from './node-types';

/**
 * Splits text node in two by char range and inserts a `node` between these new parts.
 */
export function splitTextNode(linearNodes: Array<Node>, linearIndex: number, siblingNodes: Array<Node>, siblingIndex: number, textNode: ITextNode, start: number, end: number, node: Node | null): number {

  const textStart = textNode.start;
  const textEnd = textNode.end;
  const textValue = textNode.value;

  // Replace the text node with node
  if (textStart === start && textEnd === end) {
    if (node) {
      linearNodes[linearIndex] = node;
      siblingNodes[siblingIndex] = node;
    } else {
      linearNodes.splice(linearIndex, 1);
      siblingNodes.splice(siblingIndex, 1);
    }
    return 0;
  }

  // Node goes before the text node
  if (textStart === start) {
    if (node) {
      linearNodes.splice(linearIndex, 0, node);
      siblingNodes.splice(siblingIndex, 0, node);
    }
    textNode.value = textValue.substring(end - textStart);
    textNode.start = end;
    return 0;
  }

  textNode.value = textValue.substring(0, start - textStart);
  textNode.end = start;

  // Node goes after the text node
  if (textEnd === end) {
    if (node) {
      linearNodes.splice(linearIndex + 1, 0, node);
      siblingNodes.splice(siblingIndex + 1, 0, node);
    }
    return 1;
  }

  // Node splits the text node in two
  const tailNode: ITextNode = {
    nodeType: NodeType.TEXT,
    value: textValue.substring(end - textStart),
    parent: textNode.parent,
    start: textStart + end - textStart,
    end: textEnd,
  };
  if (node) {
    linearNodes.splice(linearIndex + 1, 0, node, tailNode);
    siblingNodes.splice(siblingIndex + 1, 0, node, tailNode);
  } else {
    linearNodes.splice(linearIndex + 1, 0, tailNode);
    siblingNodes.splice(siblingIndex + 1, 0, tailNode);
  }
  return 1;
}
