import {parse, Token} from '@messageformat/parser';
import {createForgivingSaxParser} from 'tag-soup';

export const enum NodeType {
  FRAGMENT = 'FRAGMENT',
  ELEMENT = 'ELEMENT',
  ATTRIBUTE = 'ATTRIBUTE',
  TEXT = 'TEXT',
  ARGUMENT = 'ARGUMENT',
  FUNCTION = 'FUNCTION',
  PLURAL = 'PLURAL',
  SELECT = 'SELECT',
  SELECT_CASE = 'SELECT_CASE',
  SELECT_ORDINAL = 'SELECT_ORDINAL',
  OCTOTHORPE = 'OCTOTHORPE',
}

export type Node =
    | IFragmentNode
    | IElementNode
    | IAttributeNode
    | ISelectCaseNode
    | IOctothorpeNode
    | ITextNode
    | IArgumentNode
    | IFunctionNode
    | ISelectNode;

export interface INode {
  nodeType: string;
  parent: Node | null;
  start: number;
  end: number;
}

export interface IContainerNode extends INode {
  children: Array<Node>;
}

export interface IFragmentNode extends IContainerNode {
  nodeType: NodeType.FRAGMENT,
}

export interface IElementNode extends IContainerNode {
  nodeType: NodeType.ELEMENT;
  attributes: Array<IAttributeNode>;
}

export interface IAttributeNode extends IContainerNode {
  nodeType: NodeType.ATTRIBUTE;
  name: string;
}

export interface ITextNode extends INode {
  nodeType: NodeType.TEXT;
  value: string;
}

export interface IArgumentNode extends INode {
  nodeType: NodeType.ARGUMENT;
  arg: string;
}

export interface IFunctionNode extends IContainerNode {
  nodeType: NodeType.FUNCTION;
  arg: string;
  key: string;
}

export interface ISelectNode extends INode {
  nodeType: NodeType.PLURAL | NodeType.SELECT | NodeType.SELECT_ORDINAL;
  arg: string;
  cases: Array<ISelectCaseNode>;
  pluralOffset?: number;
}

export interface ISelectCaseNode extends IContainerNode {
  nodeType: NodeType.SELECT_CASE;
  key: string;
}

export interface IOctothorpeNode extends INode {
  nodeType: NodeType.OCTOTHORPE;
}

export function isContainerNode(node: INode | null): node is IContainerNode {
  switch (node?.nodeType) {
    case NodeType.FRAGMENT:
    case NodeType.ELEMENT:
    case NodeType.ATTRIBUTE:
    case NodeType.FUNCTION:
    case NodeType.SELECT_CASE:
      return true;
    default:
      return false;
  }
}

function convertIcuToken(token: Token, parent: Node | null): Node {

  let selectNodeType: NodeType.PLURAL | NodeType.SELECT | NodeType.SELECT_ORDINAL;

  const start = token.ctx.offset;
  const end = start + token.ctx.text.length;

  switch (token.type) {
    case 'octothorpe':
      return {
        nodeType: NodeType.OCTOTHORPE,
        parent,
        start,
        end,
      };

    case 'function':
      const functionNode: IFunctionNode = {
        nodeType: NodeType.FUNCTION,
        key: token.key,
        arg: token.arg,
        children: [],
        parent,
        start,
        end,
      };
      if (token.param) {
        functionNode.children = token.param.map((token) => convertIcuToken(token, functionNode));
      }
      return functionNode;

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

    case 'select':
      selectNodeType = NodeType.SELECT;

    case 'selectordinal':
      selectNodeType = NodeType.SELECT_ORDINAL;

    case 'plural':
      selectNodeType ||= NodeType.PLURAL;

      const selectNode: ISelectNode = {
        nodeType: selectNodeType,
        pluralOffset: token.pluralOffset,
        arg: token.arg,
        cases: [],
        parent,
        start,
        end,
      };

      for (let i = 0; i < token.cases.length; i++) {
        const caseToken = token.cases[i];
        const selectCaseNode: ISelectCaseNode = {
          nodeType: NodeType.SELECT_CASE,
          key: caseToken.key,
          children: [],
          parent: selectNode,
          start: caseToken.ctx.offset,
          end: 0,
        };
        selectCaseNode.children = caseToken.tokens.map((token) => convertIcuToken(token, selectNode));
        selectNode.cases[i] = selectCaseNode;
      }

      return selectNode;
  }
}

function linearizeNodes(nodes: Array<Node>): Array<Node> {
  const allNodes: Array<Node> = [];
  for (const node of nodes) {
    allNodes.push(node);

    switch (node.nodeType) {

      case NodeType.PLURAL:
      case NodeType.SELECT:
      case NodeType.SELECT_ORDINAL:
        allNodes.push(...linearizeNodes(node.cases));
        break;

      case NodeType.FUNCTION:
      case NodeType.SELECT_CASE:
        allNodes.push(...linearizeNodes(node.children));
        break;
    }
  }
  return allNodes;
}

function splitTextNode(node: ITextNode, start: number, end: number): 0 | 1 {

  if (node.start === start) {

    node.value = node.value.substr(end - node.start);
    node.start = end;

    if (isContainerNode(node.parent)) {
      return 0;
    }
    throw new Error('Bad parent');

  }

  if (node.end === end) {

    node.value = node.value.substr(0, start - node.start);
    node.end = start;

    if (isContainerNode(node.parent)) {
      return 1;
    }
    throw new Error('Bad parent');
  }

  const tailNode: ITextNode = {
    nodeType: NodeType.TEXT,
    value: node.value.substr(end - node.start),
    parent: node.parent,
    start: end,
    end: node.end,
  };

  node.value = node.value.substr(0, start - node.start);
  node.end = start;

  if (isContainerNode(node.parent)) {
    node.parent.children.splice(node.parent.children.indexOf(node) + 1, 0, tailNode);
    return 1;
  }
  throw new Error('Bad parent');
}

export function parseMarkup(str: string) {
  const nodes = parse(str).map((token) => convertIcuToken(token, null));

  const allNodes = linearizeNodes(nodes);

  const rootNode: IFragmentNode = {
    nodeType: NodeType.FRAGMENT,
    parent: null,
    start: 0,
    end: 0,
    children: nodes,
  };
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].parent = rootNode;
  }

  const tagOffsets: Array<number> = [];

  const saxParser = createForgivingSaxParser({

    onStartTag: (tagName, attrs, selfClosing, start, end) => {
      for (let i = tagOffsets[tagOffsets.length - 1] || 0; i < allNodes.length; i++) {

        const node = allNodes[i];

        if (node.start > end) {
          break;
        }
        if (node.nodeType === NodeType.TEXT && node.start <= start && node.end >= end) {

          const offset = splitTextNode(node, start, end);

          const elementNode: IElementNode = {
            nodeType: NodeType.ELEMENT,
            attributes: [],
            children: [],
            parent: node.parent,
            start,
            end,
          };

          if (isContainerNode(node.parent)) {
            node.parent.children.splice(node.parent.children.indexOf(node) + offset, 0, elementNode);
          } else {
            throw new Error('Bad parent');
          }

          if (!selfClosing) {
            tagOffsets.push(i + offset);
            allNodes.splice(i + offset, 0, elementNode);
          }

          return;
        }
      }
      throw new Error('Illegal state');
    },

    onEndTag: (tagName, start, end) => {
      const j = tagOffsets[tagOffsets.length - 1];

      const containerNode = allNodes[j];
      containerNode.end = end;

      if (!isContainerNode(containerNode)) {
        throw new Error('Illegal state');
      }

      for (let i = j; i < allNodes.length; i++) {

        const node = allNodes[i];

        if (node.start > end) {
          break;
        }
        if (node.nodeType === NodeType.TEXT && node.start <= start && node.end >= end) {

          const i0 = j + 1;
          const i1 = i + splitTextNode(node, start, end);

          if (i0 !== i1) {
            containerNode.children = allNodes.slice(i0, i1);

            const c = (containerNode.parent as any).children;
            c.splice(
                c.indexOf(c[i0]),
                i1 - i0,
            );

            for (let i = i0; i < i1; i++) {
              allNodes[i].parent = containerNode;
            }
          }

          tagOffsets.pop();
          return;
        }
      }
      throw new Error('Illegal state');
    },
  });

  saxParser.parse(str);

  if (rootNode.children.length === 1) {
    return rootNode.children[0];
  }

  return rootNode;
}
