import {parse, ParseOptions, Token} from '@messageformat/parser';
import {ContainerNode, IFunctionNode, ISelectCaseNode, ISelectNode, Node, NodeType} from './ast-types';

/**
 * Parses only ICU tags.
 *
 * @param str The string to parse.
 * @param options The ICU parsing options.
 * @returns An array of AST nodes.
 */
export function parseIcuAst(str: string, options?: ParseOptions): Array<Node> {
  return pushIcuTokensAsNodes(parse(str, options), [], null);
}

function pushIcuTokensAsNodes(tokens: Array<Token>, arr: Array<Node>, parent: ContainerNode | null): Array<Node> {
  for (let i = 0; i < tokens.length; i++) {
    arr.push(convertIcuTokenToNode(tokens[i], parent));
  }
  return arr;
}

function convertIcuTokenToNode(token: Token, parent: ContainerNode | null): Node {

  const start = token.ctx.offset;
  const end = start + token.ctx.text.length;

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

    case 'function': {
      const node: IFunctionNode = {
        nodeType: NodeType.FUNCTION,
        name: token.key,
        arg: token.arg,
        children: [],
        parent,
        start,
        end,
      };
      if (token.param) {
        pushIcuTokensAsNodes(token.param, node.children, node);
      }
      return node;
    }

    case 'plural':
    case 'select':
    case 'selectordinal': {
      const selectNode: ISelectNode = {
        nodeType: token.type === 'plural' ? NodeType.PLURAL : token.type === 'select' ? NodeType.SELECT : NodeType.SELECT_ORDINAL,
        pluralOffset: token.pluralOffset,
        arg: token.arg,
        children: [],
        parent,
        start,
        end,
      };

      for (let i = 0; i < token.cases.length; i++) {
        const caseToken = token.cases[i];
        const caseStart = caseToken.ctx.offset;
        const caseNode: ISelectCaseNode = {
          nodeType: NodeType.SELECT_CASE,
          key: caseToken.key,
          children: [],
          parent: selectNode,
          start: caseStart,
          end: caseStart + caseToken.ctx.text.length,
        };
        selectNode.children.push(caseNode);
        pushIcuTokensAsNodes(caseToken.tokens, caseNode.children, caseNode);
      }
      return selectNode;
    }

    case 'octothorpe':
      return {
        nodeType: NodeType.OCTOTHORPE,
        parent,
        start,
        end,
      };
  }
}
