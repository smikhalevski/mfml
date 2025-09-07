import { TokenCallback, tokenizeMarkup, TokenizeMarkupOptions } from './tokenizeMarkup.js';
import {
  Child,
  createArgumentNode,
  createElementNode,
  createMessageNode,
  createSelectNode,
  ElementNode,
  MessageNode,
  SelectNode,
} from './ast.js';

export function parseMessage(locale: string, text: string, options: TokenizeMarkupOptions = {}): MessageNode {
  const messageNode = createMessageNode(locale);

  const nodeStack: NodeStack = [messageNode];

  let nodeStackCursor = 0;

  let argumentName: string | undefined;
  let argumentType: string | undefined;

  const tokenCallback: TokenCallback = (token, startIndex, endIndex) => {
    switch (token) {
      case 'TEXT':
        pushChild(nodeStack, nodeStackCursor, text.substring(startIndex, endIndex));
        break;

      case 'XML_OPENING_TAG_START':
        pushChild(
          nodeStack,
          nodeStackCursor,
          (nodeStack[++nodeStackCursor] = createElementNode(text.substring(startIndex, endIndex)))
        );
        break;

      case 'XML_OPENING_TAG_END':
        break;

      case 'XML_OPENING_TAG_SELF_CLOSE':
      case 'XML_CLOSING_TAG':
        --nodeStackCursor;
        break;

      case 'XML_ATTRIBUTE_START':
        nodeStack[++nodeStackCursor] = text.substring(startIndex, endIndex);
        pushChild(nodeStack, nodeStackCursor, '');
        break;

      case 'XML_ATTRIBUTE_END':
        --nodeStackCursor;
        break;

      case 'ICU_ARGUMENT_START':
        argumentName = text.substring(startIndex, endIndex);
        argumentType = undefined;
        break;

      case 'ICU_ARGUMENT_END':
        if (argumentName === undefined) {
          --nodeStackCursor;
        } else {
          pushChild(nodeStack, nodeStackCursor, createArgumentNode(argumentName, argumentType));
        }
        break;

      case 'ICU_ARGUMENT_TYPE':
        argumentType = text.substring(startIndex, endIndex);
        break;

      case 'ICU_ARGUMENT_STYLE':
        pushChild(
          nodeStack,
          nodeStackCursor,
          createArgumentNode(argumentName!, argumentType, text.substring(startIndex, endIndex))
        );
        argumentName = undefined;
        break;

      case 'ICU_CATEGORY_START':
        const prevNode = nodeStack[nodeStackCursor];

        if (typeof prevNode !== 'string' && prevNode.nodeType !== 'select') {
          pushChild(
            nodeStack,
            nodeStackCursor,
            (nodeStack[++nodeStackCursor] = createSelectNode(argumentName!, argumentType!, {}))
          );
          argumentName = undefined;
        }

        nodeStack[++nodeStackCursor] = text.substring(startIndex, endIndex);
        pushChild(nodeStack, nodeStackCursor, '');
        break;

      case 'ICU_CATEGORY_END':
        --nodeStackCursor;
        break;

      case 'ICU_OCTOTHORPE':
        for (let i = nodeStackCursor; i > -1; --i) {
          const node = nodeStack[i];

          if (typeof node !== 'string' && node.nodeType === 'select') {
            pushChild(nodeStack, nodeStackCursor, createArgumentNode(node.argumentName));
            break;
          }
        }
        break;
    }
  };

  tokenizeMarkup(text, tokenCallback, options);

  return messageNode;
}

type NodeStack = Array<MessageNode | ElementNode | SelectNode | string>;

function pushChild(nodeStack: NodeStack, nodeStackCursor: number, child: Child): void {
  const node = nodeStack[nodeStackCursor];

  if (typeof node === 'string') {
    const prevNode = nodeStack[nodeStackCursor - 1] as MessageNode | ElementNode | SelectNode;

    if (prevNode.nodeType === 'element') {
      prevNode.attributes ||= {};
      prevNode.attributes[node] = concatChildren(prevNode.attributes[node], child);
    }
    if (prevNode.nodeType === 'select') {
      prevNode.categories[node] = concatChildren(prevNode.categories[node], child);
    }
    return;
  }

  if (node.nodeType === 'message' || node.nodeType === 'element') {
    node.children = concatChildren(node.children, child);
  }
}

function concatChildren(children: Child[] | string | null, child: Child): Child[] | string {
  if (children === '') {
    children = null;
  }

  if (children === null || children === undefined) {
    if (typeof child === 'string') {
      return child;
    }
    return [child];
  }

  if (typeof children === 'string') {
    if (typeof child === 'string') {
      return children + child;
    }
    return [children, child];
  }

  if (typeof child === 'string') {
    const lastChild = children[children.length - 1];

    if (typeof lastChild === 'string') {
      children[children.length - 1] += child;
      return children;
    }
  }

  children.push(child);
  return children;
}
