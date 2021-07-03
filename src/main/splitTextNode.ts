import {ITextNode, Node, NodeType} from './ast-types';

export function splitTextNode(arr: Array<Node>, index: number, children: Array<Node>, childIndex: number, textNode: ITextNode, start: number, end: number, node: Node | null): number {
  const textStart = textNode.start;
  const textEnd = textNode.end;
  const text = textNode.value;

  if (textStart === start && textEnd === end) {
    if (node) {
      arr[index] = node;
      children[childIndex] = node;
    } else {
      arr.splice(index, 1);
      children.splice(childIndex, 1);
    }
    return 0;
  }

  if (textStart === start) {
    if (node) {
      arr.splice(index, 0, node);
      children.splice(childIndex, 0, node);
    }
    textNode.value = text.substring(end - textStart);
    textNode.start = end;
    return 0;
  }

  textNode.value = text.substring(0, start - textStart);
  textNode.end = start;

  if (textEnd === end) {
    if (node) {
      arr.splice(index + 1, 0, node);
      children.splice(childIndex + 1, 0, node);
    }
    return 1;
  }

  const remainderTextNode: ITextNode = {
    nodeType: NodeType.TEXT,
    value: text.substring(end - textStart),
    parent: textNode.parent,
    start: textStart + end - textStart,
    end: textEnd,
  };
  if (node) {
    arr.splice(index + 1, 0, node, remainderTextNode);
    children.splice(childIndex + 1, 0, node, remainderTextNode);
  } else {
    arr.splice(index + 1, 0, remainderTextNode);
    children.splice(childIndex + 1, 0, remainderTextNode);
  }
  return 1;
}
