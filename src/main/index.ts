/**
 * MFML AST nodes and factories.
 *
 * @module mfml
 */

export { AbstractMessageRenderer } from './AbstractMessageRenderer.js';
export {
  createMessageNode,
  createElementNode,
  createArgumentNode,
  createSelectNode,
  type Child,
  type MessageNode,
  type ElementNode,
  type ArgumentNode,
  type SelectNode,
} from './ast.js';
export { renderText } from './renderText.js';
export {
  StringMessageRenderer,
  type StringComponentType,
  type StringMessageRendererOptions,
} from './StringMessageRenderer.js';
export { type MessageRenderer, type MessageRendererOptions } from './types.js';
