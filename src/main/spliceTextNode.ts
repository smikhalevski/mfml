import {ITextNode, Node, NodeType} from './ast-types';

export function spliceTextNode(arr: Array<Node>, i: number, siblings: Array<Node>, j: number, textNode: ITextNode, start: number, end: number, node?: Node): number {
  const textStart = textNode.start;
  const textEnd = textNode.end;
  const text = textNode.value;

  // Node replaces text
  if (textStart === start && textEnd === end) {
    if (node != null) {
      arr[i] = siblings[j] = node;
    } else {
      arr.splice(i, 1);
      siblings.splice(j, 1);
    }
    return 0;
  }

  // Node inserted at the start
  if (textStart === start) {
    if (node != null) {
      arr.splice(i, 0, node);
      siblings.splice(j, 0, node);
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
      siblings.splice(j + 1, 0, node);
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
    siblings.splice(j + 1, 0, node, textNode);
  } else {
    arr.splice(i + 1, 0, textNode);
    siblings.splice(j + 1, 0, textNode);
  }
  return 1;
}
