import {ITextNode, Node, NodeType} from './ast-types';

export function splitTextNode(arr: Array<Node>, i: number, children: Array<Node>, j: number, textNode: ITextNode, start: number, end: number, node?: Node): number {
  const textStart = textNode.start;
  const textEnd = textNode.end;
  const text = textNode.value;

  // Node replaces text
  if (textStart === start && textEnd === end) {
    if (node != null) {
      arr[i] = children[j] = node;
    } else {
      arr.splice(i, 1);
      children.splice(j, 1);
    }
    return 0;
  }

  // Node inserted at the start
  if (textStart === start) {
    if (node != null) {
      arr.splice(i, 0, node);
      children.splice(j, 0, node);
    }
    textNode.value = text.substring(end - textStart);
    textNode.start = end;
    return 0;
  }

  textNode.value = text.substring(0, start - textStart);
  textNode.end = start;

  // Node inserted at the end
  if (textEnd === end) {
    if (node != null) {
      arr.splice(i + 1, 0, node);
      children.splice(j + 1, 0, node);
    }
    return 1;
  }

  // Node inserted in the center
  textNode = {
    nodeType: NodeType.TEXT,
    value: text.substring(end - textStart),
    parent: textNode.parent,
    start: textStart + end - textStart,
    end: textEnd,
  };
  if (node != null) {
    arr.splice(i + 1, 0, node, textNode);
    children.splice(j + 1, 0, node, textNode);
  } else {
    arr.splice(i + 1, 0, textNode);
    children.splice(j + 1, 0, textNode);
  }
  return 1;
}
