import {Node, NodeType} from './node-types';
import {parseIcu} from './parseIcu';
import {createEntitiesDecoder, createForgivingSaxParser, ISaxParser, ISaxParserCallbacks, Rewriter} from 'tag-soup';
import {ParseOptions} from '@messageformat/parser';
import {linearizeNodes} from './linearizeNodes';
import {findNodeIndex} from './findNodeIndex';
import {splitTextNode} from './splitTextNode';
import {isTextNode} from './node-utils';
import {decodeTextNodes} from './decodeTextNodes';

const xmlDecoder = createEntitiesDecoder();

export interface IIcuDomParserOptions extends ParseOptions {

  /**
   * Decodes XML entities in an attribute value. By default, only XML entities are decoded.
   */
  decodeAttr?: Rewriter;

  /**
   * Decodes XML entities in plain text value. By default, only XML entities are decoded.
   */
  decodeText?: Rewriter;

  /**
   * The factory that creates an instance of a XML/HTML SAX parser that would be used for actual parsing of the input
   * strings.
   *
   * Implementation considerations:
   * - SAX parser must emit tags in the correct order;
   * - SAX parser mustn't decode text and attributes, use {@link decodeAttr} and {@link decodeText} instead;
   *
   * @default {@link https://smikhalevski.github.io/tag-soup/globals.html#createforgivingsaxparser createForgivingSaxParser}
   */
  saxParserFactory?: (options: ISaxParserCallbacks) => ISaxParser;
}

/**
 * Creates an ICU + XML/HTML DOM parser.
 */
export function createIcuDomParser(options: IIcuDomParserOptions = {}): (str: string) => Node {

  const {
    decodeAttr = xmlDecoder,
    decodeText = xmlDecoder,
    saxParserFactory = createForgivingSaxParser,
  } = options;

  let rootChildren: Array<Node>;
  let linearNodes: Array<Node>;
  let linearIndex = 0;

  const saxParser = saxParserFactory({

    onStartTag(tagToken) {

      const tagStart = tagToken.start;
      const tagEnd = tagToken.end;

      linearIndex = findNodeIndex(linearNodes, linearIndex, tagStart, tagToken.nameEnd);

      // The text node that contains the start tag name
      const textNode = linearNodes[linearIndex];

      if (!isTextNode(textNode)) {
        throwSyntaxError(tagStart);
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

      const offset = splitTextNode(linearNodes, linearIndex, siblingNodes, siblingIndex, textNode, tagStart, splitEnd, elementNode);

      linearIndex += offset + 1;
      siblingIndex += offset;

      // An index at which attr declarations start
      const attrsIndex = linearIndex;

      // Collect attributes
      for (let i = 0; i < tagToken.attrs.length; i++) {
        const attrToken = tagToken.attrs[i];

        const attrValue = attrToken.rawValue;
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
        if (attrValueEnd <= linearNodes[linearIndex].start) {
          attrChildren.push({
            nodeType: NodeType.TEXT,
            value: decodeAttr(attrValue),
            parent: attrNode,
            start: attrValueStart,
            end: attrValueEnd,
          });
          continue;
        }

        while (linearIndex < linearNodes.length) {
          const node = linearNodes[linearIndex];

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

            linearIndex++;
            continue;
          }

          // Trailing text
          if (isTextNode(node) && attrValueStart < nodeStart && attrValueEnd < nodeEnd) {
            attrChildren.push({
              nodeType: NodeType.TEXT,
              value: attrValue.substr(nodeStart - attrValueStart),
              parent: attrNode,
              start: nodeStart,
              end: attrValueEnd,
            });
            break;
          }

          throwSyntaxError(nodeStart);
        }

        decodeTextNodes(attrChildren, decodeAttr);
      }

      // Remove ICU nodes that are now part of an attr children
      if (linearIndex !== attrsIndex) {
        siblingNodes.splice(siblingIndex + 1, linearIndex - attrsIndex);
      }

      // Exit if the text node fully contained the start tag
      if (tagEnd === splitEnd) {
        return;
      }

      // Remove remaining chars of the start tag from the consequent text node
      const tailNode = linearNodes[linearIndex];

      if (isTextNode(tailNode) && tailNode.start < tagEnd && tailNode.end >= tagEnd) {
        tailNode.value = tailNode.value.substring(tagEnd - tailNode.start);
        tailNode.start = tagEnd;
        return;
      }

      throwSyntaxError(tailNode.start);
    },

    onEndTag(tagToken) {

      const tagStart = tagToken.start;
      const tagEnd = tagToken.end;

      linearIndex = findNodeIndex(linearNodes, linearIndex, tagStart, tagEnd);

      let siblingNodes;
      let siblingIndex;

      // The text node that fully contains the end tag
      const textNode = linearNodes[linearIndex];

      if (isTextNode(textNode)) {

        siblingNodes = textNode.parent?.children || rootChildren;
        siblingIndex = siblingNodes.indexOf(textNode);

        // Remove end tag markup from the text node
        const offset = splitTextNode(linearNodes, linearIndex, siblingNodes, siblingIndex, textNode, tagStart, tagEnd, null);

        siblingIndex += offset;
        linearIndex += offset;

      } else if (tagStart === tagEnd) {

        if (linearIndex === -1) {
          linearIndex = linearNodes.length;
        }

        // The end tag doesn't exist in the markup and was injected by forgiving SAX parser
        const siblingNode = linearNodes[linearIndex - 1];

        siblingNodes = siblingNode.parent?.children || rootChildren;
        siblingIndex = siblingNodes.indexOf(siblingNode) + 1;

      } else {
        throwSyntaxError(tagStart);
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
        throwSyntaxError(tagStart);
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
    linearNodes = [];
    linearIndex = 0;

    linearizeNodes(rootChildren, linearNodes);
    saxParser.parse(str);

    decodeTextNodes(rootChildren, decodeText);

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

function throwSyntaxError(offset: number): never {
  throw new SyntaxError('Unexpected token at ' + offset);
}
