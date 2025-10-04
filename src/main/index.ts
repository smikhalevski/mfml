/**
 * MFML runtime.
 *
 * @module mfml
 */

export {
  defaultArgumentFormatter,
  combineArgumentFormatters,
  createNumberArgumentFormatter,
  createDateTimeArgumentFormatter,
  createListArgumentFormatter,
  createDisplayNameArgumentFormatter,
  type ArgumentFormatter,
  type ArgumentFormatterParams,
} from './formatter.js';
export { defaultCategorySelector, type CategorySelector, type CategorySelectorParams } from './selector.js';
export { renderToString, type RenderToStringOptions } from './renderToString.js';
export type {
  Renderer,
  ElementRenderer,
  Metadata,
  ChildNode,
  ParentNode,
  AnyNode,
  SourceLocation,
  MessageNode,
  TextNode,
  ElementNode,
  AttributeNode,
  ArgumentNode,
  OctothorpeNode,
  OptionNode,
  CategoryNode,
  LiteralNode,
} from './types.js';
export { walkNode } from './utils.js';
