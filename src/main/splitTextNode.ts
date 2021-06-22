import {ITextNode, Node, NodeType} from './ast-types';

export function splitTextNode(children: Array<Node>, textNode: ITextNode, start: number, end: number): number {
  const i = children.indexOf(textNode);

  const textStart = textNode.start;
  const textEnd = textNode.end;
  const text = textNode.value;

  if (textStart === start && textEnd === end) {
    children.splice(i, 1);
    return i;
  }

  if (textStart === start) {
    textNode.value = text.substring(end - textStart);
    textNode.start = end;
    return i;
  }

  textNode.value = text.substring(0, start - textStart);
  textNode.end = start;

  if (textEnd === end) {
    return i + 1;
  }

  const offset = end - textStart;
  children.splice(i + 1, 0, {
    nodeType: NodeType.TEXT,
    value: text.substring(offset),
    parent: textNode.parent,
    start: start + offset,
    end: textEnd,
  });
  return i + 1;
}
