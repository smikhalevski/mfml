import {Node, NodeType} from './ast-types';
import {parseIcu} from './parseIcu';
import {createForgivingSaxParser, ISaxParser, ISaxParserCallbacks} from 'tag-soup';
import {ParseOptions} from '@messageformat/parser';
import {collectOrdinalNodes} from './collectOrdinalNodes';
import {findNodeIndex} from './findNodeIndex';
import {splitTextNode} from './splitTextNode';

export interface IIcuDomParserOptions extends ParseOptions {

  /**
   * The factory that creates an instance of a XML/HTML SAX parser that would be used for actual parsing of the input
   * strings.
   *
   * **Note:** Underlying SAX parser must emit tags in the correct order. No additional checks are made while
   * constructing a tree of elements.
   *
   * @default {@link https://smikhalevski.github.io/tag-soup/globals.html#createforgivingsaxparser createForgivingSaxParser}
   */
  saxParserFactory?: (options: ISaxParserCallbacks) => ISaxParser;
}

export function createIcuDomParser(options: IIcuDomParserOptions = {}): (str: string) => Node {

  const {saxParserFactory = createForgivingSaxParser} = options;

  let rootChildren: Array<Node>;
  let ordinalNodes: Array<Node>;
  let ordinalIndex = 0;

  const saxParser = saxParserFactory({

    onStartTag(tagToken) {

      const tagStart = tagToken.start;
      const tagEnd = tagToken.end;

      ordinalIndex = findNodeIndex(ordinalNodes, ordinalIndex, tagStart, tagToken.nameEnd);

      // The text node that contains the start tag name
      const textNode = ordinalNodes[ordinalIndex];

      if (textNode?.nodeType !== NodeType.TEXT) {
        throw new SyntaxError('Incorrect start tag syntax at ' + tagStart);
      }

      const elementNode: Node = {
        nodeType: NodeType.ELEMENT,
        tagName: tagToken.name,
        parent: textNode.parent,
        children: [],
        attrs: [],
        start: tagStart,
        end: tagEnd,
      };

      const splitEnd = Math.min(textNode.end, tagEnd);

      const siblingNodes = textNode.parent?.children || rootChildren;

      let siblingIndex = siblingNodes.indexOf(textNode);

      const offset = splitTextNode(ordinalNodes, ordinalIndex, siblingNodes, siblingIndex, textNode, tagStart, splitEnd, elementNode);

      ordinalIndex += offset + 1;
      siblingIndex += offset;

      // An index at which attr declarations start
      const attrsIndex = ordinalIndex;

      // Collect attributes
      for (let i = 0; i < tagToken.attrs.length; i++) {
        const attrToken = tagToken.attrs[i];

        const attrValue = attrToken.value;
        const attrValueStart = attrToken.valueStart;
        const attrValueEnd = attrToken.valueEnd;
        const attrChildren: Array<Node> = [];

        const attrNode: Node = {
          nodeType: NodeType.ATTRIBUTE,
          name: attrToken.name,
          children: attrChildren,
          parent: elementNode,
          start: attrToken.start,
          end: attrToken.end,
        };

        elementNode.attrs.push(attrNode);

        // Attr has no value
        if (attrValue == null) {
          continue;
        }

        // Attr has a plain text value
        if (attrValueEnd <= ordinalNodes[ordinalIndex].start) {
          attrChildren.push({
            nodeType: NodeType.TEXT,
            value: attrValue,
            parent: attrNode,
            start: attrValueStart,
            end: attrValueEnd,
          });
          continue;
        }

        while (ordinalIndex < ordinalNodes.length) {
          const node = ordinalNodes[ordinalIndex];

          const nodeStart = node.start;
          const nodeEnd = node.end;

          // ICU node is too far ahead
          if (attrValueEnd <= nodeStart) {
            break;
          }

          // Skip nested ICU nodes
          if (textNode.parent !== node.parent) {
            continue;
          }

          // ICU node is contained by the attr value
          if (attrValueStart <= nodeStart && nodeEnd <= attrValueEnd) {

            // Leading text in attr value
            if (attrChildren.length === 0 && nodeStart !== attrValueStart) {
              attrChildren.push({
                nodeType: NodeType.TEXT,
                value: attrValue.substr(0, nodeStart - attrValueStart),
                parent: attrNode,
                start: attrValueStart,
                end: nodeStart,
              });
            }

            attrChildren.push(node);
            node.parent = attrNode;

            ordinalIndex++;
            continue;
          }

          // Trailing text
          if (node.nodeType === NodeType.TEXT && attrValueStart < nodeStart && attrValueEnd < nodeEnd) {
            attrChildren.push({
              nodeType: NodeType.TEXT,
              value: attrValue.substr(nodeStart - attrValueStart),
              parent: attrNode,
              start: nodeStart,
              end: attrValueEnd,
            });
            break;
          }

          throw new SyntaxError('Incorrect attribute syntax at ' + nodeStart);
        }
      }

      // Remove ICU nodes that are now part of an attr children
      if (ordinalIndex !== attrsIndex) {
        siblingNodes.splice(siblingIndex + 1, ordinalIndex - attrsIndex);
      }

      // Exit if the text node fully contained the start tag
      if (tagEnd === splitEnd) {
        return;
      }

      // Remove remaining chars of the start tag from the consequent text node
      const lastNode = ordinalNodes[ordinalIndex];
      const lastNodeStart = lastNode.start;

      if (lastNode?.nodeType === NodeType.TEXT && lastNodeStart < tagEnd && lastNode.end >= tagEnd) {
        lastNode.value = lastNode.value.substring(tagEnd - lastNodeStart);
        lastNode.start = tagEnd;
        return;
      }

      throw new SyntaxError('Unexpected token at ' + lastNodeStart);
    },

    onEndTag(tagToken) {

      const tagStart = tagToken.start;
      const tagEnd = tagToken.end;

      ordinalIndex = findNodeIndex(ordinalNodes, ordinalIndex, tagStart, tagEnd);

      let siblingNodes;
      let siblingIndex;

      // The text node that fully contains the end tag
      const textNode = ordinalNodes[ordinalIndex];

      // The end tag was doesn't exist in the markup but was inserted by forgiving SAX parser
      if (tagStart === tagEnd && textNode?.nodeType !== NodeType.TEXT) {

        if (ordinalIndex === -1)  {
          ordinalIndex = ordinalNodes.length;
        }

        const node = ordinalNodes[ordinalIndex - 1];

        siblingNodes = node.parent?.children || rootChildren;
        siblingIndex = siblingNodes.indexOf(node) + 1;

      } else {

        if (textNode?.nodeType !== NodeType.TEXT) {
          throw new SyntaxError('Incorrect end tag syntax at ' + tagStart);
        }

        siblingNodes = textNode.parent?.children || rootChildren;

        siblingIndex = siblingNodes.indexOf(textNode);

        // Remove end tag markup from the text node
        const offset = splitTextNode(ordinalNodes, ordinalIndex, siblingNodes, siblingIndex, textNode, tagStart, tagEnd, null);

        siblingIndex += offset;
        ordinalIndex += offset;
      }

      // Lookup an element node that is terminated by the end tag
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

  return (str) => {

    rootChildren = parseIcu(str, options);
    ordinalNodes = collectOrdinalNodes(rootChildren, []);
    ordinalIndex = 0;

    saxParser.parse(str);

    if (rootChildren.length === 1) {
      return rootChildren[0];
    }

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

    return rootNode;
  };
}
