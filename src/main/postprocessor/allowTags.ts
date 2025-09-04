import { Postprocessor } from '../compiler/index.js';
import { walkNode } from '../utils.js';
import { ParserError } from '../parser/index.js';

export default function allowTags(allowedTags: { [tagName: string]: string[] | boolean }): Postprocessor {
  return options => {
    walkNode(options.messageNode, node => {
      if (node.nodeType !== 'element') {
        return;
      }

      const allowedAttributes = allowedTags[node.tagName];

      if (!allowedTags.hasOwnProperty(node.tagName) || allowedAttributes === false) {
        throw new ParserError(
          'The tag "' + node.tagName + '" is not allowed.',
          options.text,
          node.startIndex,
          node.endIndex
        );
      }

      if (allowedAttributes === true || node.attributeNodes === null) {
        return;
      }

      for (const attributeNode of node.attributeNodes) {
        if (allowedAttributes.includes(attributeNode.name)) {
          continue;
        }

        throw new ParserError(
          'The attribute "' + attributeNode.name + '" is not allowed for the tag "' + node.tagName + '".',
          options.text,
          attributeNode.startIndex,
          attributeNode.endIndex
        );
      }
    });

    return options.messageNode;
  };
}
