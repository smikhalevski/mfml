/**
 * MFML AST nodes and factories.
 *
 * @module mfml
 */

export { createRenderer, type Renderer } from './createRenderer.js';
export { renderText, type RenderTextOptions } from './renderText.js';
export type {
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
export { walkNode, getOctothorpeArgument } from './utils.js';
