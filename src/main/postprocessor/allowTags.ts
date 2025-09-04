import { Child } from '../ast.js';
import { Postprocessor } from '../compiler/index.js';

export default function allowTags(allowedTags: { [tagName: string]: string[] | boolean }): Postprocessor {
  const callback = (child: Child) => {
    if (typeof child === 'string' || child.nodeType !== 'element') {
      return;
    }

    const allowedAttributes = allowedTags[child.tagName];

    if (!allowedTags.hasOwnProperty(child.tagName) || allowedAttributes === false) {
      throw new Error('Tag "' + child.tagName + '" is forbidden.');
    }

    if (allowedAttributes === true || child.attributes === null) {
      return;
    }

    for (const key in child.attributes) {
      if (!allowedAttributes.includes(key)) {
        throw new Error('Attribute "' + key + '" is forbidden for tag "' + child.tagName + '".');
      }
    }
  };

  return options => {
    walkChildren(options.messageNode.children, callback);

    return options.messageNode;
  };
}

function walkChildren(children: Child[] | Child | string | null, callback: (child: Child) => void): void {
  if (children === null) {
    return;
  }

  if (typeof children === 'string') {
    callback(children);
    return;
  }

  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; ++i) {
      callback(children[i]);

      walkChildren(children[i], callback);
    }
    return;
  }

  if (children.nodeType === 'element') {
    callback(children);

    if (children.attributes !== null) {
      for (const key in children.attributes) {
        walkChildren(children.attributes[key], callback);
      }
    }

    walkChildren(children.children, callback);
    return;
  }

  if (children.nodeType === 'argument') {
    callback(children);
    return;
  }

  if (children.nodeType === 'select') {
    callback(children);

    if (children.categories !== null) {
      for (const key in children.categories) {
        walkChildren(children.categories[key], callback);
      }
    }
    return;
  }
}
