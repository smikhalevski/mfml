import {ITextNode, Node, NodeType} from './node-types';
import {IMessageFormatParserOptions, parseMessageFormat} from './parseMessageFormat';
import {createEntitiesDecoder, createForgivingSaxParser, ISaxParser, ISaxParserCallbacks} from 'tag-soup';
import {isContainerNode, isTextNode} from './node-utils';
import {dieSyntax, identity, Rewriter} from '../misc';

const xmlDecoder = createEntitiesDecoder();

export interface IMfmlParserOptions extends IMessageFormatParserOptions {

  /**
   * Decodes XML entities in plain text value. By default, only XML entities are decoded.
   *
   * @see createEntitiesDecoder
   */
  decodeText?: Rewriter;

  /**
   * Decodes XML entities in an attribute value. By default, uses rewriter from {@link decodeText}.
   */
  decodeAttr?: Rewriter;

  /**
   * The factory that creates an instance of a XML/HTML SAX parser that would be used for actual parsing of the input
   * strings.
   *
   * Implementation considerations:
   * - SAX parser must emit tags in the correct order;
   * - SAX parser may not decode text and attributes for sake of performance, because they are also processed with
   * {@link decodeAttr} and {@link decodeText};
   * - SAX parser should make required tag and attribute renames.
   *
   * @default {@link https://smikhalevski.github.io/tag-soup/globals.html#createforgivingsaxparser createForgivingSaxParser}
   */
  saxParserFactory?: (options: ISaxParserCallbacks) => ISaxParser;
}

/**
 * Creates an ICU MessageFormat + XML/HTML DOM parser.
 */
export function createMfmlParser(options: IMfmlParserOptions = {}): (str: string) => Node {

  const {
    decodeText = xmlDecoder,
    decodeAttr = decodeText,
    saxParserFactory = createMfmlSaxParser,
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
        dieSyntax(tagStart);
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

      // Sibling index at which attributes may start
      const attrSiblingIndex = siblingIndex += offset;

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

          // MessageFormat node is too far ahead
          if (attrValueEnd <= nodeStart) {
            break;
          }

          // Skip nested MessageFormat nodes
          if (textNode.parent !== node.parent) {
            linearIndex++;
            continue;
          }

          // MessageFormat node is contained by the attr value
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
            siblingIndex++;
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

          dieSyntax(nodeStart);
        }

        decodeTextNodes(attrChildren, decodeAttr);
      }

      // Remove MessageFormat nodes that are now part of attr children
      if (attrSiblingIndex !== siblingIndex) {
        siblingNodes.splice(attrSiblingIndex + 1, siblingIndex - attrSiblingIndex);
      }

      // Exit if the MessageFormat text node fully contains the start tag
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

      dieSyntax(tailNode.start);
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

        // The end tag doesn't exist in the markup and was injected by the forgiving SAX parser
        const siblingNode = linearNodes[linearIndex - 1];

        siblingNodes = siblingNode.parent?.children || rootChildren;
        siblingIndex = siblingNodes.indexOf(siblingNode) + 1;

      } else {
        dieSyntax(tagStart);
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
        dieSyntax(tagStart);
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
    saxParser.reset();

    rootChildren = parseMessageFormat(str, options);
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

/**
 * Creates the default SAX parser that doesn't decode XML entities.
 */
function createMfmlSaxParser(options: ISaxParserCallbacks): ISaxParser {
  return createForgivingSaxParser(Object.assign({
    decodeAttr: identity,
    decodeText: identity,
  }, options));
}

/**
 * Traverse `nodes` and add them to `linearNodes` in the order of occurrence.
 */
function linearizeNodes(nodes: Array<Node>, linearNodes: Array<Node>): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    linearNodes.push(node);

    if (isContainerNode(node)) {
      linearizeNodes(node.children, linearNodes);
    }
  }
}

/**
 * Returns the index of the node among `nodes` (starting from `index`) that contains a `[start, end]` char range.
 * If node wasn't found then -1 is returned.
 */
function findNodeIndex(nodes: Array<Node>, index: number, start: number, end: number): number {
  for (let i = index; i < nodes.length; i++) {
    const node = nodes[i];
    const nodeStart = node.start;
    const nodeEnd = node.end;

    if (end <= nodeStart) {
      break;
    }
    if (start === end && nodeStart === start || isTextNode(node) && nodeStart <= start && end <= nodeEnd) {
      return i;
    }
  }
  return -1;
}

/**
 * Rewrites values of descendant text nodes using `decoder`.
 */
function decodeTextNodes(nodes: Array<Node>, decoder: (name: string) => string): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (isTextNode(node)) {
      node.value = decoder(node.value);
      continue;
    }
    if (isContainerNode(node)) {
      decodeTextNodes(node.children, decoder);
    }
  }
}

/**
 * Splits text node in two by char range and inserts a `node` between these new parts.
 */
function splitTextNode(linearNodes: Array<Node>, linearIndex: number, siblingNodes: Array<Node>, siblingIndex: number, textNode: ITextNode, start: number, end: number, node: Node | null): number {

  const textStart = textNode.start;
  const textEnd = textNode.end;
  const textValue = textNode.value;

  // Replace the text node with node
  if (textStart === start && textEnd === end) {
    if (node) {
      linearNodes[linearIndex] = node;
      siblingNodes[siblingIndex] = node;
    } else {
      linearNodes.splice(linearIndex, 1);
      siblingNodes.splice(siblingIndex, 1);
    }
    return 0;
  }

  // Node goes before the text node
  if (textStart === start) {
    if (node) {
      linearNodes.splice(linearIndex, 0, node);
      siblingNodes.splice(siblingIndex, 0, node);
    }
    textNode.value = textValue.substring(end - textStart);
    textNode.start = end;
    return 0;
  }

  textNode.value = textValue.substring(0, start - textStart);
  textNode.end = start;

  // Node goes after the text node
  if (textEnd === end) {
    if (node) {
      linearNodes.splice(linearIndex + 1, 0, node);
      siblingNodes.splice(siblingIndex + 1, 0, node);
    }
    return 1;
  }

  // Node splits the text node in two
  const tailNode: ITextNode = {
    nodeType: NodeType.TEXT,
    value: textValue.substring(end - textStart),
    parent: textNode.parent,
    start: textStart + end - textStart,
    end: textEnd,
  };
  if (node) {
    linearNodes.splice(linearIndex + 1, 0, node, tailNode);
    siblingNodes.splice(siblingIndex + 1, 0, node, tailNode);
  } else {
    linearNodes.splice(linearIndex + 1, 0, tailNode);
    siblingNodes.splice(siblingIndex + 1, 0, tailNode);
  }
  return 1;
}
