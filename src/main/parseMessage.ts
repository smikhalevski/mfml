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

  const nodeStack: Array<MessageNode | ElementNode | SelectNode> = [messageNode];

  let nodeStackCursor = 0;

  let elementNode: ElementNode;
  let selectNode: SelectNode | undefined;

  let children = messageNode.children;
  let argumentName: string;
  let argumentType: string;
  let isArgumentPushed = false;

  const tokenCallback: TokenCallback = (token, startIndex, endIndex) => {
    switch (token) {
      case 'TEXT':
        children.push(text.substring(startIndex, endIndex));
        break;

      case 'XML_OPENING_TAG_START':
        elementNode = createElementNode(text.substring(startIndex, endIndex));
        nodeStack[++nodeStackCursor] = elementNode;
        children.push(elementNode);
        children = elementNode.children;
        break;

      case 'XML_OPENING_TAG_END':
        break;

      case 'XML_OPENING_TAG_SELF_CLOSE':
      case 'XML_CLOSING_TAG':
        const parentNode = nodeStack[--nodeStackCursor];

        if (parentNode.nodeType === 'element') {
          elementNode = parentNode;
          children = parentNode.children;
          break;
        }

        if (parentNode.nodeType === 'message') {
          children = parentNode.children;
        }
        break;

      case 'XML_ATTRIBUTE_START':
        children = elementNode.attributes[text.substring(startIndex, endIndex)] = [];
        break;

      case 'XML_ATTRIBUTE_END':
        children = elementNode.children;
        break;

      case 'ICU_ARGUMENT_START':
        isArgumentPushed = false;
        argumentName = text.substring(startIndex, endIndex);
        break;

      case 'ICU_ARGUMENT_END':
        if (!isArgumentPushed) {
          children.push(createArgumentNode(argumentName, argumentType));
        }

        if (nodeStack[nodeStackCursor].nodeType === 'select') {
          selectNode = undefined;

          for (let i = --nodeStackCursor; i > -1; --i) {
            const parentNode = nodeStack[nodeStackCursor];

            if (parentNode.nodeType === 'select') {
              selectNode = parentNode;
              break;
            }
          }
        }
        break;

      case 'ICU_ARGUMENT_TYPE':
        argumentType = text.substring(startIndex, endIndex);
        break;

      case 'ICU_ARGUMENT_STYLE':
        children.push(createArgumentNode(argumentName, argumentType, text.substring(startIndex, endIndex)));
        isArgumentPushed = true;
        break;

      case 'ICU_CASE_START':
        const caseValue = text.substring(startIndex, endIndex);

        if (selectNode === undefined) {
          isArgumentPushed = true;
          const caseChildren: Child[] = [];
          selectNode = createSelectNode(argumentName, argumentType, { [caseValue]: caseChildren });
          nodeStack[++nodeStackCursor] = selectNode;
          children.push(selectNode);
          children = caseChildren;
          break;
        }

        children = selectNode.cases[caseValue] = [];
        break;

      case 'ICU_CASE_END':
        break;

      case 'ICU_OCTOTHORPE':
        children.push(createArgumentNode(selectNode!.argumentName));
        break;
    }
  };

  tokenizeMarkup(text, tokenCallback, options);

  return messageNode;
}
