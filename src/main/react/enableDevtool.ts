import { MessageMetadata, PackageMetadata } from '../types.js';
import { ComponentType, Context } from 'react';
import { MessageValuesContext } from './Message.js';
import { getOutlinesOfRects } from './getOutlinesOfRects.js';

export function enableDevtool(packageMetadata: PackageMetadata): void {
  if (typeof window === 'undefined') {
    return;
  }

  let popoverElement: HTMLElement | null = null;
  let fiberNode: FiberNode | null = null;
  let pointNode: Node | null = null;
  let mouseX = -1;
  let mouseY = -1;
  let canShowPopoverOnHover = false;

  const pressedKeyCodes = new Set<string>();

  const showPopover = (x: number, y: number) => {
    pointNode = getNodeFromPoint(document, x, y);

    // No state node
    if (pointNode === null) {
      hidePopover();
      return;
    }

    let nextFiberNode = getFiberNodeByStateNode(pointNode);

    while (nextFiberNode !== null && nextFiberNode.type !== MessageValuesContext) {
      nextFiberNode = nextFiberNode.return;
    }

    // Same message
    if (fiberNode === (fiberNode = nextFiberNode)) {
      return;
    }

    // No fiber node, or no message
    if (
      nextFiberNode === null ||
      nextFiberNode.key === null ||
      !packageMetadata.messages.hasOwnProperty(nextFiberNode.key)
    ) {
      hidePopover();
      return;
    }

    // Replace existing popover
    popoverElement?.remove();
    popoverElement = document.body.appendChild(
      createPopoverElement(
        document,
        packageMetadata.messages[nextFiberNode.key],
        collectStateNodesFromFiberNode(nextFiberNode, [])
      )
    );
    popoverElement.showPopover();
  };

  const hidePopover = () => {
    popoverElement?.remove();
    popoverElement = null;
    fiberNode = null;
    pointNode = null;
  };

  const scrollListener = (event: Event) => {
    if ((event.target as HTMLElement).contains(pointNode)) {
      hidePopover();
    }
  };

  const mouseMoveListener = (event: MouseEvent) => {
    mouseX = event.x;
    mouseY = event.y;

    if (canShowPopoverOnHover) {
      showPopover(mouseX, mouseY);
    }
  };

  const mouseDownListener = (event: MouseEvent) => {
    if (popoverElement === null || popoverElement.contains(event.target as Node | null)) {
      return;
    }

    canShowPopoverOnHover = false;
    hidePopover();
  };

  const keyDownListener = (event: KeyboardEvent) => {
    pressedKeyCodes.add(event.code);

    if (event.code === 'Escape') {
      pressedKeyCodes.clear();
      canShowPopoverOnHover = false;
      hidePopover();
      return;
    }

    canShowPopoverOnHover = pressedKeyCodes.size === 1 && isAltKeyCode(event.code);

    if (canShowPopoverOnHover) {
      showPopover(mouseX, mouseY);
    }
  };

  const keyUpListener = (event: KeyboardEvent) => {
    pressedKeyCodes.delete(event.code);

    if (pressedKeyCodes.size === 0 && isAltKeyCode(event.code)) {
      canShowPopoverOnHover = false;
    }
  };

  const windowBlurListener = () => {
    pressedKeyCodes.clear();
  };

  document.addEventListener('scroll', scrollListener);
  document.addEventListener('mousemove', mouseMoveListener);
  document.addEventListener('mousedown', mouseDownListener);
  document.addEventListener('keydown', keyDownListener);
  document.addEventListener('keyup', keyUpListener);
  window.addEventListener('blur', windowBlurListener);

  const isMac = navigator.userAgent.includes('Macintosh');

  console.log(
    '%cPress and hold the [' +
      (isMac ? 'Option' : 'Alt') +
      '] key, then hover over any text to reveal the related i18n message debug information.',
    'color:#aaa'
  );
}

function isAltKeyCode(keyCode: string | undefined): boolean {
  return keyCode === 'AltLeft' || keyCode === 'AltRight';
}

const { min, max } = Math;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const BG_COLOR = '#f00';
const FG_COLOR = '#fff';
const FONT =
  '12px/20px normal normal ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace';

function createPopoverElement(
  document: Document,
  messageMetadata: MessageMetadata,
  messageNodes: Node[],
  strokeWidth = 5,
  outlineOffset = 5
): HTMLElement {
  const rects = [];

  // Collects rects to outline
  for (const node of messageNodes) {
    const nodeRects = getNodeRects(node);

    for (let i = 0; i < nodeRects.length; ++i) {
      rects.push(nodeRects[i]);
    }
  }

  let outlinePath = '';

  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let maxY = Number.MIN_VALUE;

  // Build outline SVG path
  for (const outline of getOutlinesOfRects(rects, outlineOffset)) {
    outlinePath += 'M' + outline[0] + ' ' + outline[1];

    minX = min(minX, outline[0]);
    minY = min(minY, outline[1]);
    maxX = max(maxX, outline[0]);
    maxY = max(maxY, outline[1]);

    for (let i = 2; i < outline.length; i += 2) {
      outlinePath += ' L' + outline[i] + ' ' + outline[i + 1];

      minX = min(minX, outline[i]);
      minY = min(minY, outline[i + 1]);
      maxX = max(maxX, outline[i]);
      maxY = max(maxY, outline[i + 1]);
    }

    outlinePath += ' Z ';
  }

  const popoverElement = document.createElement('div');
  const svgElement = popoverElement.appendChild(document.createElementNS(SVG_NAMESPACE, 'svg'));
  const pathElement = svgElement.appendChild(document.createElementNS(SVG_NAMESPACE, 'path'));
  const detailsElement = popoverElement.appendChild(document.createElement('div'));

  popoverElement.setAttribute('popover', '');
  popoverElement.setAttribute(
    'style',
    'all:unset;pointer-events:none;position:fixed;' +
      'top:' +
      (minY - strokeWidth / 2) +
      'px;' +
      'left:' +
      (minX - strokeWidth / 2) +
      'px;'
  );

  svgElement.setAttribute(
    'viewBox',
    '' +
      (minX - strokeWidth / 2) +
      ' ' +
      (minY - strokeWidth / 2) +
      ' ' +
      (maxX - minX + strokeWidth) +
      ' ' +
      (maxY - minY + strokeWidth)
  );
  svgElement.setAttribute(
    'style',
    'display:block;width:' + (maxX - minX + strokeWidth) + 'px;' + 'height:' + (maxY - minY + strokeWidth) + 'px;'
  );

  pathElement.setAttribute('d', outlinePath);
  pathElement.setAttribute('style', 'fill:transparent;stroke:' + BG_COLOR + ';stroke-width:' + strokeWidth + 'px;');

  detailsElement.setAttribute(
    'style',
    'pointer-events:all;display:inline-block;background-color:' +
      BG_COLOR +
      ';font:' +
      FONT +
      ';color:' +
      FG_COLOR +
      ';margin:' +
      -strokeWidth +
      'px 0;padding:' +
      (strokeWidth + outlineOffset) / 2 +
      'px ' +
      (strokeWidth + outlineOffset) +
      'px;'
  );

  detailsElement.innerHTML = messageMetadata.messageKey + '<br/>' + messageMetadata.locales.join(', ');

  return popoverElement;
}

/**
 * React Fiber tree node.
 */
interface FiberNode {
  key: string | null;
  type: ComponentType | Context<unknown> | string | null;
  return: FiberNode | null;
  child: FiberNode | null;
  sibling: FiberNode | null;
  stateNode: Node | null;
}

/**
 * Returns React fiber node associated with the given DOM node.
 */
function getFiberNodeByStateNode(node: Node): FiberNode | null {
  for (const key in node) {
    if (key.startsWith('__reactFiber')) {
      return (node as any)[key];
    }
  }

  return null;
}

/**
 * Returns topmost DOM nodes that belong to the fiber.
 */
function collectStateNodesFromFiberNode(fiber: FiberNode, nodes: Node[]): Node[] {
  for (let child = fiber.child; child !== null; child = child.sibling) {
    if (child.stateNode === null) {
      collectStateNodesFromFiberNode(child, nodes);
    } else {
      nodes.push(child.stateNode);
    }
  }

  return nodes;
}

/**
 * Returns an element or a text node at given point.
 */
function getNodeFromPoint(document: Document, x: number, y: number): Node | null {
  let node: Node | null = document.elementFromPoint(x, y);

  if (node === null) {
    return null;
  }

  const nodeFilter: NodeFilter = node => {
    const rects = getNodeRects(node);

    for (let i = 0; i < rects.length; ++i) {
      const rect = rects[i];

      if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        continue;
      }

      return NodeFilter.FILTER_ACCEPT;
    }

    return NodeFilter.FILTER_REJECT;
  };

  return document.createTreeWalker(node, NodeFilter.SHOW_TEXT, nodeFilter).nextNode() || node;
}

/**
 * Returns an array of rects of an element or a text node.
 */
function getNodeRects(node: Node): ArrayLike<DOMRectReadOnly> {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return [(node as Element).getBoundingClientRect()];
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const range = (node as Text).ownerDocument.createRange();

    range.selectNodeContents(node);

    const rects = range.getClientRects();

    range.detach();

    return rects;
  }

  return [];
}
