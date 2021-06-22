import {Node, NodeType} from './ast-types';

export function splitTextNode(arr: Array<Node>, index: number, start: number, end: number, node?: Node): number {
  const textNode = arr[index];
  const children = textNode.parent?.children;

  if (textNode.nodeType !== NodeType.TEXT || !children) {
    throw new Error();
  }

  const childIndex = children.indexOf(textNode)
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
    return childIndex;
  }

  if (textStart === start) {
    if (node) {
      arr.splice(index, 0, node);
      children.splice(childIndex, 0, node);
    }
    textNode.value = text.substring(end - textStart);
    textNode.start = end;
    return childIndex;
  }

  if (textEnd !== end) {
    const offset = end - textStart;
    const nextTextNode: Node = {
      nodeType: NodeType.TEXT,
      value: text.substring(offset),
      parent: textNode.parent,
      start: textStart + offset,
      end: textEnd,
    };
    arr.splice(index + 1, 0, nextTextNode);
    children.splice(childIndex + 1, 0, nextTextNode);
  }

  textNode.value = text.substring(0, start - textStart);
  textNode.end = start;

  if (node) {
    arr.splice(index + 1, 0, node);
    children.splice(childIndex + 1, 0, node);
  }
  return childIndex + 1;
}
