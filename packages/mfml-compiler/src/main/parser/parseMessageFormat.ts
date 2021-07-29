import {parse, ParseOptions, Token} from '@messageformat/parser';
import {ContainerNode, IFunctionNode, ISelectCaseNode, ISelectNode, Node, NodeType} from './parser-types';
import {identity} from '../misc';

export interface IMessageFormatParserOptions extends ParseOptions {

  /**
   * Rewrites formatting function name.
   *
   * @param name The name of a function.
   * @returns The new name of a function.
   */
  renameFunction?(name: string): string;

  /**
   * Rewrites argument name.
   *
   * @param name The name of an argument.
   * @returns The new name of an argument.
   */
  renameArgument?(name: string): string;
}

/**
 * Parses ICU MessageFormat as a tree of AST nodes.
 *
 * @param str The string to parse.
 * @param options The ICU MessageFormat parsing options.
 * @returns An array of root AST nodes.
 */
export function parseMessageFormat(str: string, options: IMessageFormatParserOptions = {}): Array<Node> {
  return pushMessageFormatTokensAsNodes(parse(str, options), [], null, options);
}

function pushMessageFormatTokensAsNodes(tokens: Array<Token>, arr: Array<Node>, parent: ContainerNode | null, options: IMessageFormatParserOptions): Array<Node> {
  for (let i = 0; i < tokens.length; ++i) {
    arr.push(convertMessageFormatTokenToNode(tokens[i], parent, options));
  }
  return arr;
}

function convertMessageFormatTokenToNode(token: Token, parent: ContainerNode | null, options: IMessageFormatParserOptions): Node {
  const {
    renameFunction = identity,
    renameArgument = identity,
  } = options;

  const start = token.ctx.offset;
  const end = start + token.ctx.text.length;

  switch (token.type) {

    case 'argument':
      return {
        nodeType: NodeType.ARGUMENT,
        name: renameArgument(token.arg),
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
      const node: IFunctionNode = {
        nodeType: NodeType.FUNCTION,
        name: renameFunction(token.key),
        argumentName: renameArgument(token.arg),
        children: [],
        parent,
        start,
        end,
      };
      if (token.param) {
        pushMessageFormatTokensAsNodes(token.param, node.children, node, options);
      }
      return node;

    case 'plural':
    case 'select':
    case 'selectordinal':
      const selectNode: ISelectNode = {
        nodeType: token.type === 'plural' ? NodeType.PLURAL : token.type === 'select' ? NodeType.SELECT : NodeType.SELECT_ORDINAL,
        pluralOffset: token.pluralOffset,
        argumentName: renameArgument(token.arg),
        children: [],
        parent,
        start,
        end,
      };

      for (let i = 0; i < token.cases.length; ++i) {
        const caseToken = token.cases[i];
        const caseChildren: Array<Node> = [];

        const caseNode: ISelectCaseNode = {
          nodeType: NodeType.SELECT_CASE,
          key: caseToken.key,
          children: caseChildren,
          parent: selectNode,
          start: caseToken.ctx.offset,
          end: 0,
        };
        selectNode.children.push(caseNode);

        pushMessageFormatTokensAsNodes(caseToken.tokens, caseChildren, caseNode, options);

        const caseEnd = caseNode.end = caseChildren.length === 0 ? caseNode.start + 1 : caseChildren[caseChildren.length - 1].end + 1;
        selectNode.end = caseEnd + 1;
      }
      return selectNode;

    case 'octothorpe':
      return {
        nodeType: NodeType.OCTOTHORPE,
        parent,
        start,
        end,
      };
  }
}
