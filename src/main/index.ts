/**
 * MFML runtime.
 *
 * @module mfml
 */

export {
  defaultFormatter,
  createWaterfallFormatter,
  createNumberFormatter,
  createDateTimeFormatter,
  createListFormatter,
  createDisplayNameFormatter,
  type Formatter,
  type FormatterParams,
} from './formatter.js';
export { defaultCategorySelector, type CategorySelector, type CategorySelectorParams } from './selector.js';
export { renderToString, type RenderToStringOptions } from './renderToString.js';
export type {
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
export { Renderer } from './types.js';
export { ElementRenderer } from './types.js';
