import {IAttributeNode, IElementNode, IFragmentNode, ITextNode, Node, NodeType} from './ast-types';
import {parseIcuAst} from './parseIcuAst';
import {createForgivingSaxParser, IForgivingSaxParserDialectOptions} from 'tag-soup';
import {splitTextNode} from './splitTextNode';
import {collectIcuNodes} from './collectIcuNodes';
import {findTextNodeIndex} from './findTextNodeIndex';
import {ParseOptions} from '@messageformat/parser';

export interface IParserOptions extends ParseOptions, IForgivingSaxParserDialectOptions {
}

export function parseIcuTagSoup(str: string, options?: IParserOptions): Node {

  const rootChildren = parseIcuAst(str, options);

  const ordinalNodes = collectIcuNodes(rootChildren, []);
  let ordinalIndex = 0;

  const rootNode: Node = {
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

      ordinalIndex = findTextNodeIndex(ordinalNodes, ordinalIndex, tagToken.start, tagToken.nameEnd);

      const startNode = ordinalNodes[ordinalIndex];

      if (startNode?.nodeType !== NodeType.TEXT) {
        fatal(tagToken.start);
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

      const offset = splitTextNode(ordinalNodes, ordinalIndex, parentChildren, startNodeIndex, startNode, tagToken.start, Math.min(startNodeEnd, tagToken.end), elementNode);

      ordinalIndex += offset + 1;
      startNodeIndex += offset;

      const attrIndex = ordinalIndex;

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
        if (attrToken.valueEnd <= ordinalNodes[ordinalIndex].start) {
          attrNode.children.push({
            nodeType: NodeType.TEXT,
            value: attrToken.value,
            parent: attrNode,
            start: attrToken.valueStart,
            end: attrToken.valueEnd,
          });
          continue;
        }

        while (ordinalIndex < ordinalNodes.length) {
          const node = ordinalNodes[ordinalIndex];

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
            ordinalIndex++;
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

          fatal(attrToken.start);
        }
      }

      parentChildren.splice(startNodeIndex + 1, ordinalIndex - attrIndex);

      const endNode = ordinalNodes[ordinalIndex];

      if (tagToken.end <= startNodeEnd) {
        return;
      }

      if (endNode?.nodeType === NodeType.TEXT && endNode.start < tagToken.end && endNode.end >= tagToken.end) {
        endNode.value = endNode.value.substring(tagToken.end - endNode.start);
        endNode.start = tagToken.end;
        return;
      }

      fatal(tagToken.start);
    },
















    onEndTag(tagToken) {
      const tagStart = tagToken.start;
      const tagEnd = tagToken.end;

      ordinalIndex = findTextNodeIndex(ordinalNodes, ordinalIndex, tagStart, tagEnd);

      if (ordinalIndex === -1) {
        throw new SyntaxError('Incorrect end tag syntax at ' + tagStart);
      }

      // The ICU text node that fully contains the end tag.
      const textNode = ordinalNodes[ordinalIndex] as ITextNode;

      const siblingNodes = textNode.parent?.children || rootChildren;

      let siblingIndex = siblingNodes.indexOf(textNode);

      const offset = splitTextNode(ordinalNodes, ordinalIndex, siblingNodes, siblingIndex, textNode, tagStart, tagEnd, null);

      siblingIndex += offset;
      ordinalIndex += offset;

      // Lookup the element node that is terminated by the end tag.
      let elementNode;
      let elementIndex = siblingIndex;

      while (elementIndex > 0) {
        const node = siblingNodes[--elementIndex];

        if (node.nodeType === NodeType.ELEMENT && node.tagName === tagToken.name) {
          elementNode = node;
          break;
        }
      }

      if (!elementNode) {
        throw new SyntaxError('Unexpected end tag at ' + tagStart);
      }

      const elementChildren = siblingNodes.splice(elementIndex + 1, siblingIndex - elementIndex - 1);

      elementNode.end = tagEnd;
      elementNode.children = elementChildren;

      for (let i = 0; i < elementChildren.length; i++) {
        elementChildren[i].parent = elementNode;
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

function fatal(start: number): never {
  throw new SyntaxError('Unexpected syntax at ' + start);
}
