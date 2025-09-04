/**
 * The postprocessor that restricts what tags and attributes are allowed in messages.
 *
 * @module mfml/postprocessor/allowTags
 */

import { Postprocessor } from '../compiler/index.js';
import { walkNode } from '../utils.js';
import { ParserError } from '../parser/index.js';

/**
 * Mapping from a tag name to a list of allowed attributes, or a boolean. If `true` then a tag and any attributes are
 * allowed, if `false` then tag is forbidden.
 */
export interface AllowedTags {
  [tagName: string]: string[] | boolean;
}

/**
 * Restricts what tags and attributes are allowed.
 *
 * @example
 * allowTags({
 *   a: ['href', 'name'],
 *   p: true
 * });
 *
 * @example
 * import allowTags, { defaultAllowedTags } from 'mfml/postprocessor/allowTags';
 *
 * allowTags(defaultAllowedTags);
 *
 * @param allowedTags Allowed tags requirements.
 * @see {@link defaultAllowedTags}
 */
export default function allowTags(allowedTags: AllowedTags): Postprocessor {
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

/**
 * The safe set of tags and attributes, recommended for general use.
 */
export const defaultAllowedTags: AllowedTags = {
  p: ['style', 'class'],
  br: [],
  hr: ['style', 'class'],
  b: ['style', 'class'],
  u: ['style', 'class'],
  s: ['style', 'class'],
  em: ['style', 'class'],
  strong: ['style', 'class'],
  del: ['style', 'class'],
  code: ['style', 'class'],
  mark: ['style', 'class'],
  h1: ['id', 'style', 'class'],
  h2: ['id', 'style', 'class'],
  h3: ['id', 'style', 'class'],
  h4: ['id', 'style', 'class'],
  h5: ['id', 'style', 'class'],
  h6: ['id', 'style', 'class'],
  ul: ['id', 'style', 'class'],
  ol: ['start', 'type', 'style', 'class'],
  li: ['style', 'class'],
  a: ['href', 'title', 'target', 'name', 'style', 'class'],
  blockquote: ['cite', 'style', 'class'],
  pre: ['style', 'class'],
  sup: ['style', 'class'],
  sub: ['style', 'class'],
  abbr: ['title', 'style', 'class'],
  kbd: ['style', 'class'],
  samp: ['style', 'class'],
};
