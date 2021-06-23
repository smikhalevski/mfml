import {IAttributeNode, IElementNode, IFragmentNode, ITextNode, Node, NodeType} from './ast-types';
import {parseIcu} from './parseIcu';
import {createForgivingSaxParser, IForgivingSaxParserDialectOptions} from 'tag-soup';
import {spliceTextNode} from './spliceTextNode';
import {collectIcuNodes} from './collectIcuNodes';

export interface IParserOptions extends IForgivingSaxParserDialectOptions {
}

export function parseToAst(str: string, options?: IParserOptions): Node {

  const children = parseIcu(str);
  const arr = collectIcuNodes(children, []);

  const rootNode: IFragmentNode = {
    nodeType: NodeType.FRAGMENT,
    children,
    parent: null,
    start: 0,
    end: str.length,
  };

  for (let i = 0; i < children.length; i++) {
    children[i].parent = rootNode;
  }

  let i = 0;

  const saxParser = createForgivingSaxParser({
    ...options,

    onStartTag(tagToken) {

      let startNode;
      while (i < arr.length) {
        const node = arr[i++];

        if (tagToken.end <= node.start) {
          // No more matching nodes
          break;
        }
        if (node.nodeType === NodeType.TEXT && node.start <= tagToken.start && tagToken.nameEnd <= node.end) {
          startNode = node;
          break;
        }
      }

      if (!startNode) {
        throwSyntaxError(tagToken.start);
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

      const siblings = startNode.parent!.children;
      const startNodeEnd = startNode.end;
      spliceTextNode(arr, i - 1, siblings, siblings.indexOf(startNode), startNode, tagToken.start, Math.min(startNodeEnd, tagToken.end), elementNode);

      let j = 0;
      while (j < tagToken.attrs.length) {

        const attrToken = tagToken.attrs[j++];
        const attrNode: IAttributeNode = {
          nodeType: NodeType.ATTRIBUTE,
          name: attrToken.name,
          children: [],
          parent: elementNode,
          start: attrToken.start,
          end: attrToken.end,
        };

        elementNode.attrs.push(attrNode);

        // No value
        if (attrToken.value == null) {
          continue;
        }

        // Plain text value
        if (attrToken.valueEnd <= arr[i].start) {
          attrNode.children.push({
            nodeType: NodeType.TEXT,
            value: attrToken.value,
            parent: attrNode,
            start: attrToken.valueStart,
            end: attrToken.valueEnd,
          });
          break;
        }

        let k = i;
        while (k < arr.length) {
          const node = arr[k];

          if (attrToken.valueEnd <= node.start) {
            // Too far ahead
            break;
          }
          if (startNode.parent !== node.parent) {
            // Skip nested nodes
            continue;
          }
          if (attrToken.valueStart <= node.start && node.end <= attrToken.valueEnd) {
            attrNode.children.push(node);
            node.parent = attrNode;
            k++;
            continue;
          }

          throwSyntaxError(attrToken.start);
        }

        // Remove nodes used by the attr
        arr.splice(i, k - i);
      }

      if (tagToken.end <= startNodeEnd) {
        return;
      }

      const endNode = arr[i];
      if (endNode?.nodeType === NodeType.TEXT && endNode.start < tagToken.end && endNode.end >= tagToken.end) {
        endNode.value = endNode.value.substring(tagToken.end - endNode.start);
        endNode.start = tagToken.end;
        return;
      }

      throwSyntaxError(tagToken.start);
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

      let childIndex = parentChildren.indexOf(textNode);

      childIndex += spliceTextNode(arr, arr.indexOf(textNode), parentChildren, childIndex, textNode, tagToken.start, tagToken.end);

      for (let k = childIndex; k >= 0; k--) {
        const node = parentChildren[k];

        if (!node || node.nodeType !== NodeType.ELEMENT || node.tagName !== tagToken.name) {
          continue;
        }

        const children = parentChildren.splice(k + 1, childIndex - k - 1);
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

function throwSyntaxError(start: number): never {
  throw new SyntaxError('Unexpected syntax at ' + start);
}
