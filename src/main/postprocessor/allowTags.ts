import { Postprocessor } from '../compiler/index.js';
import { walkNode } from '../utils.js';
import { ParserError } from '../parser/index.js';

/**
 * Restricts what tags and attributes are allowed.
 *
 * @example
 * allowTags({
 *   a: ['href', 'name'],
 *   p: true
 * });
 *
 * @param allowedTags Mapping from a tag name to a list of allowed attributes, or a boolean. If `true` then a tag and
 * any attributes are allowed, if `false` then tag is forbidden.
 */
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

      const errors = [];

      for (const attributeNode of node.attributeNodes) {
        if (allowedAttributes.includes(attributeNode.name)) {
          continue;
        }

        errors.push(
          new ParserError(
            'The attribute "' + attributeNode.name + '" is not allowed for the tag "' + node.tagName + '".',
            options.text,
            attributeNode.startIndex,
            attributeNode.endIndex
          )
        );
      }

      if (errors.length !== 0) {
        throw new AggregateError(errors);
      }
    });

    return options.messageNode;
  };
}
