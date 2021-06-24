import {IAttributeNode, IElementNode, IFragmentNode, Node, NodeType} from './ast-types';
import {parseIcu} from './parseIcu';
import {createForgivingSaxParser, IForgivingSaxParserDialectOptions} from 'tag-soup';
import {spliceTextNode} from './spliceTextNode';
import {collectIcuNodes} from './collectIcuNodes';
import {findTextNodeIndex} from './findTextNodeIndex';

export interface IParserOptions extends IForgivingSaxParserDialectOptions {
}

export function parseToAst(str: string, options?: IParserOptions): Node {

  const rootChildren = parseIcu(str);

  const arr = collectIcuNodes(rootChildren, []);
  let index = 0;

  const rootNode: IFragmentNode = {
    nodeType: NodeType.FRAGMENT,
    children: rootChildren,
    parent: null,
    start: 0,
    end: str.length,
  };

  for (let i = 0; i < rootChildren.length; i++) {
    rootChildren[i].parent = rootNode;
  }

  const saxParser = createForgivingSaxParser({
    ...options,

    onStartTag(tagToken) {

      index = findTextNodeIndex(arr, index, tagToken.start, tagToken.nameEnd);

      const startNode = arr[index];

      if (startNode?.nodeType !== NodeType.TEXT) {
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

      const startNodeEnd = startNode.end;
      const parentChildren = startNode.parent!.children;

      let startNodeIndex = parentChildren.indexOf(startNode);

      const offset = spliceTextNode(arr, index, parentChildren, startNodeIndex, startNode, tagToken.start, Math.min(startNodeEnd, tagToken.end), elementNode);

      index += offset + 1;
      startNodeIndex += offset;

      const attrIndex = index;

      for (let i = 0; i < tagToken.attrs.length; i++) {
        const attrToken = tagToken.attrs[i];

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
        if (attrToken.valueEnd <= arr[index].start) {
          attrNode.children.push({
            nodeType: NodeType.TEXT,
            value: attrToken.value,
            parent: attrNode,
            start: attrToken.valueStart,
            end: attrToken.valueEnd,
          });
          continue;
        }

        while (index < arr.length) {
          const node = arr[index];

          if (attrToken.valueEnd <= node.start) {
            // Too far ahead
            break;
          }
          if (startNode.parent !== node.parent) {
            // Skip nested nodes
            continue;
          }

          if (attrToken.valueStart <= node.start && node.end <= attrToken.valueEnd) {

            // Leading text
            if (attrNode.children.length === 0 && node.start !== attrToken.valueStart) {
              attrNode.children.push({
                nodeType: NodeType.TEXT,
                value: attrToken.value.substr(0, node.start - attrToken.valueStart),
                parent: attrNode,
                start: attrToken.valueStart,
                end: node.start,
              });
            }

            attrNode.children.push(node);
            node.parent = attrNode;
            index++;
            continue;
          }

          // Trailing text
          if (node.nodeType === NodeType.TEXT && attrToken.valueStart < node.start && attrToken.valueEnd < node.end) {
            attrNode.children.push({
              nodeType: NodeType.TEXT,
              value: attrToken.value.substr(node.start - attrToken.valueStart),
              parent: attrNode,
              start: node.start,
              end: attrToken.valueEnd,
            });
            break;
          }

          throwSyntaxError(attrToken.start);
        }
      }

      parentChildren.splice(startNodeIndex + 1, index - attrIndex);

      const endNode = arr[index];

      if (tagToken.end <= startNodeEnd) {
        return;
      }

      if (endNode?.nodeType === NodeType.TEXT && endNode.start < tagToken.end && endNode.end >= tagToken.end) {
        endNode.value = endNode.value.substring(tagToken.end - endNode.start);
        endNode.start = tagToken.end;
        return;
      }

      throwSyntaxError(tagToken.start);
    },

    onEndTag(tagToken) {

      index = findTextNodeIndex(arr, index, tagToken.start, tagToken.end);

      const textNode = arr[index];

      if (textNode?.nodeType !== NodeType.TEXT) {
        throwSyntaxError(tagToken.start);
      }

      const parentChildren = textNode.parent!.children;

      let textNodeIndex = parentChildren.indexOf(textNode);

      const offset = spliceTextNode(arr, index, parentChildren, textNodeIndex, textNode, tagToken.start, tagToken.end, null);

      textNodeIndex += offset;
      index += offset;

      let elementIndex = textNodeIndex - 1;
      while (elementIndex >= 0) {
        const node = parentChildren[elementIndex];
        if (node.nodeType === NodeType.ELEMENT && node.tagName === tagToken.name) {
          break;
        }
        elementIndex--;
      }

      const elementNode = parentChildren[elementIndex];

      if (elementNode?.nodeType !== NodeType.ELEMENT) {
        throwSyntaxError(tagToken.start);
      }

      elementNode.end = tagToken.end;
      elementNode.children = parentChildren.splice(elementIndex + 1, textNodeIndex - elementIndex - 1);

      for (let i = 0; i < elementNode.children.length; i++) {
        elementNode.children[i].parent = elementNode;
      }
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
