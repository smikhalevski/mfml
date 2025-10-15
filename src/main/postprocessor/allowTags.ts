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
          new ParserError(`The tag "${node.tagName}" is not allowed.`, params.text, node.startIndex, node.endIndex)
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
            `The attribute "${attributeNode.name}" is not allowed for the tag "${node.tagName}".`,
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
 *
 * | Tag name     | Allowed attributes                             |
 * | ------------ | ---------------------------------------------- |
 * | `p`          | `style` `class`                                |
 * | `br`         |  None                                          |
 * | `hr`         | `style` `class`                                |
 * | `b`          | `style` `class`                                |
 * | `u`          | `style` `class`                                |
 * | `s`          | `style` `class`                                |
 * | `em`         | `style` `class`                                |
 * | `strong`     | `style` `class`                                |
 * | `del`        | `style` `class`                                |
 * | `code`       | `style` `class`                                |
 * | `mark`       | `style` `class`                                |
 * | `h1`         | `style` `class` `id`                           |
 * | `h2`         | `style` `class` `id`                           |
 * | `h3`         | `style` `class` `id`                           |
 * | `h4`         | `style` `class` `id`                           |
 * | `h5`         | `style` `class` `id`                           |
 * | `h6`         | `style` `class` `id`                           |
 * | `ul`         | `style` `class` `id`                           |
 * | `ol`         | `style` `class` `start` `type`                 |
 * | `li`         | `style` `class`                                |
 * | `a`          | `style` `class` `href` `title` `target` `name` |
 * | `blockquote` | `style` `class` `cite`                         |
 * | `pre`        | `style` `class`                                |
 * | `sup`        | `style` `class`                                |
 * | `sub`        | `style` `class`                                |
 * | `abbr`       | `style` `class` `title`                        |
 * | `kbd`        | `style` `class`                                |
 * | `samp`       | `style` `class`                                |
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
  h1: ['style', 'class', 'id'],
  h2: ['style', 'class', 'id'],
  h3: ['style', 'class', 'id'],
  h4: ['style', 'class', 'id'],
  h5: ['style', 'class', 'id'],
  h6: ['style', 'class', 'id'],
  ul: ['style', 'class', 'id'],
  ol: ['style', 'class', 'start', 'type'],
  li: ['style', 'class'],
  a: ['style', 'class', 'href', 'title', 'target', 'name'],
  blockquote: ['style', 'class', 'cite'],
  pre: ['style', 'class'],
  sup: ['style', 'class'],
  sub: ['style', 'class'],
  abbr: ['style', 'class', 'title'],
  kbd: ['style', 'class'],
  samp: ['style', 'class'],
};
