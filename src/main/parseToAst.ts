import {ContainerNode, IElementNode, ITextNode, Node, NodeType} from './ast-types';
import {parse} from '@messageformat/parser';
import {convertIcuTokensToNodes} from './convertIcuTokenToNode';
import {createForgivingSaxParser, IForgivingSaxParserDialectOptions} from 'tag-soup';
import {splitTextNode} from './splitTextNode';
import {collectNodes} from './collectNodes';

export interface IParserOptions extends IForgivingSaxParserDialectOptions {
}

export function parseToAst(str: string, options?: IParserOptions): Node {

  const nodes = convertIcuTokensToNodes(parse(str), null);
  const arr = collectNodes(nodes, []);

  const rootNode: ContainerNode = {
    nodeType: NodeType.FRAGMENT,
    children: nodes,
    parent: null,
    start: 0,
    end: str.length,
  };

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].parent = rootNode;
  }

  let i = 0;

  const saxParser = createForgivingSaxParser({
    ...options,

    onStartTag(tagToken) {

      let startNode: ITextNode | undefined;
      let endNode: ITextNode | undefined;

      while (i < arr.length) {
        const node = arr[i++];

        if (tagToken.end <= node.start) {
          // No more applicable nodes
          break;
        }
        if (node.nodeType === NodeType.TEXT) {
          if (node.start <= tagToken.start && tagToken.nameEnd <= node.end) {
            // Start of tag, contains "<foo"
            startNode = node;
          }
          if (node.start < tagToken.end && tagToken.end <= node.end) {
            // End of tag, contains ">"
            endNode = node;
            break;
          }
        }
      }

      if (!startNode?.parent || !endNode) {
        throw new Error();
      }

      const elementNode: IElementNode = {
        nodeType: NodeType.ELEMENT,
        tagName: tagToken.name,
        parent: startNode.parent,
        children: [],
        attrs: [],
        start: tagToken.start,
        end: tagToken.end,
      };

      if (startNode !== endNode) {
        throw new Error();
      }

      const parentChildren = startNode.parent.children;
      const j = splitTextNode(parentChildren, startNode, tagToken.start, tagToken.end);
      parentChildren.splice(j, 0, elementNode);

    },

    onEndTag(tagToken) {
      let textNode: ITextNode | undefined;

      while (i < arr.length) {
        const node = arr[i];

        if (tagToken.end <= node.start) {
          // No more applicable nodes
          break;
        }
        if (node.nodeType === NodeType.TEXT && node.start <= tagToken.start && tagToken.end <= node.end) {
          textNode = node;
          break;
        }
        i++;
      }

      if (!textNode?.parent) {
        throw new Error();
      }

      const parentChildren = textNode.parent.children;
      const j = splitTextNode(parentChildren, textNode, tagToken.start, tagToken.end);

      for (let k = j; k >= 0; k--) {
        const node = parentChildren[k];

        if (node.nodeType !== NodeType.ELEMENT) {
          continue;
        }

        if (node.tagName !== tagToken.name) {
          throw new Error();
        }

        const children = parentChildren.splice(k + 1, j - k - 1);
        for (let k = 0; k < children.length; k++) {
          children[k].parent = node;
        }

        node.end = tagToken.end;
        node.children = children;
        return;
      }
      throw new Error();
    },

  });

  saxParser.parse(str);

  if (rootNode.children.length === 1) {
    const node = rootNode.children[0];
    node.parent = null;
    return node;
  }

  return rootNode;
}
