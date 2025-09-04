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
  return params => {
    const errors: ParserError[] = [];

    walkNode(params.messageNode, node => {
      if (node.nodeType !== 'element') {
        return;
      }

      const allowedAttributes = allowedTags[node.tagName];

      if (!allowedTags.hasOwnProperty(node.tagName) || allowedAttributes === false) {
        errors.push(
          new ParserError('The tag "' + node.tagName + '" is not allowed.', params.text, node.startIndex, node.endIndex)
        );
        return;
      }

      if (allowedAttributes === true || node.attributeNodes === null) {
        return;
      }

      for (const attributeNode of node.attributeNodes) {
        if (allowedAttributes.includes(attributeNode.name)) {
          continue;
        }

        errors.push(
          new ParserError(
            'The attribute "' + attributeNode.name + '" is not allowed for the tag "' + node.tagName + '".',
            params.text,
            attributeNode.startIndex,
            attributeNode.endIndex
          )
        );
      }
    });

    if (errors.length !== 0) {
      throw new AggregateError(errors);
    }

    return params.messageNode;
  };
}
