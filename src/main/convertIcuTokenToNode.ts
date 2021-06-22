import {Token} from '@messageformat/parser';
import {ContainerNode, ISelectCaseNode, ISelectNode, Node, NodeType} from './ast-types';

export function convertIcuTokensToNodes(tokens: Array<Token>, parent: ContainerNode | null): Array<Node> {
  const arr: Array<Node> = [];
  for (let i = 0; i < tokens.length; i++) {
    arr.push(convertIcuTokenToNode(tokens[i], parent));
  }
  return arr;
}

/**
 * Converts an ICU token to an AST node.
 */
export function convertIcuTokenToNode(token: Token, parent: ContainerNode | null): Node {

  const start = token.ctx.offset;
  const end = start + token.ctx.text.length;

  let nodeType: ISelectNode['nodeType'] | undefined;
  let node: Node;

  switch (token.type) {

    case 'argument':
      return {
        nodeType: NodeType.ARGUMENT,
        arg: token.arg,
        parent,
        start,
        end,
      };

    case 'content':
      return {
        nodeType: NodeType.TEXT,
        value: token.value,
        parent,
        start,
        end,
      };

    case 'function':
      node = {
        nodeType: NodeType.FUNCTION,
        name: token.key,
        arg: token.arg,
        children: [],
        parent,
        start,
        end,
      };

      const param = token.param;
      if (param) {
        for (let i = 0; i < param.length; i++) {
          node.children[i] = convertIcuTokenToNode(param[i], node);
        }
      }
      return node;

    case 'select':
      nodeType = NodeType.SELECT;

    case 'selectordinal':
      nodeType ||= NodeType.SELECT_ORDINAL;

    case 'plural':
      nodeType ||= NodeType.PLURAL;

      node = {
        nodeType,
        pluralOffset: token.pluralOffset,
        arg: token.arg,
        children: [],
        parent,
        start,
        end,
      };

      nodeType = undefined;

      const cases = token.cases;
      for (let i = 0; i < cases.length; i++) {

        const caseToken = cases[i];
        const caseStart = caseToken.ctx.offset;

        const caseNode: ISelectCaseNode = {
          nodeType: NodeType.SELECT_CASE,
          key: caseToken.key,
          children: [],
          parent: node,
          start: caseStart,
          end: caseStart + token.ctx.text.length,
        };
        for (let j = 0; j < caseToken.tokens.length; j++) {
          caseNode.children[j] = convertIcuTokenToNode(caseToken.tokens[j], caseNode);
        }
        node.children[i] = caseNode;
      }
      return node;

    case 'octothorpe':
      return {
        nodeType: NodeType.OCTOTHORPE,
        parent,
        start,
        end,
      };
  }
}
