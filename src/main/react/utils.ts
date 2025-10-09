import { Message } from './Message.js';
import { MessageDebugInfo } from '../types.js';

export function getMessageNodesFromPoint(x: number, y: number): { nodes: Node[]; messageKey: string } | null {
  const element = document.elementFromPoint(x, y);

  if (element === null) {
    return null;
  }

  const fiberKey = getFiberKey(element);

  if (fiberKey === null) {
    return null;
  }

  const node = getTextFromPoint(element, x, y);

  if (node !== null) {
    return getMessageNodes(node, fiberKey);
  }

  return getMessageNodes(element, fiberKey);
}

function getMessageNodes(node: Node | null, fiberKey: string): { nodes: Node[]; messageKey: string } | null {
  for (; node !== null; node = node.parentNode) {
    const fiber = (node as any)[fiberKey];

    if (fiber === undefined) {
      break;
    }

    const messageKey = getMessageKeyFromFiber(fiber);

    if (messageKey === null) {
      continue;
    }

    if (node.parentNode === null) {
      return { nodes: [node], messageKey };
    }

    const nodes = [];

    for (node = node.parentNode.firstChild; node !== null; node = node.nextSibling) {
      const fiber = (node as any)[fiberKey];

      if (fiber === undefined || fiber.return.key !== messageKey) {
        continue;
      }

      nodes.push(node);
    }

    return { nodes, messageKey };
  }

  return null;
}

function getMessageKeyFromFiber(fiber: any): string | null {
  for (; fiber !== null && fiber.elementType !== Message; fiber = fiber.return) {}

  if (fiber !== null) {
    return fiber.child.key;
  }

  return null;
}

function getFiberKey(node: Node): string | null {
  for (const key in node) {
    if (key.startsWith('__reactFiber')) {
      return key;
    }
  }
  return null;
}

function getTextFromPoint(element: Element, x: number, y: number): Text | null {
  const nodeFilter: NodeFilter = node => {
    const rects = getNodeRects(node);

    for (let i = 0; i < rects.length; ++i) {
      const { top, left, right, bottom } = rects[i];

      if (x < left || x > right || y < top || y > bottom) {
        continue;
      }

      return NodeFilter.FILTER_ACCEPT;
    }

    return NodeFilter.FILTER_REJECT;
  };

  return element.ownerDocument.createTreeWalker(element, NodeFilter.SHOW_TEXT, nodeFilter).nextNode() as Text;
}

export function getNodeRects(node: Node): ArrayLike<DOMRect> {
  if (node.nodeType === Node.ELEMENT_NODE) {
    return [(node as Element).getBoundingClientRect()];
  }

  if (node.nodeType !== Node.TEXT_NODE || node.ownerDocument === null) {
    return [];
  }

  const range = node.ownerDocument.createRange();

  range.selectNodeContents(node);

  const rects = range.getClientRects();

  range.detach();

  return rects;
}

export function createPopoverElement(
  rects: DOMRect[],
  offset = 4,
  strokeWidth = 4,
  debugInfo: MessageDebugInfo
): Element | null {
  if (rects.length === 0) {
    return null;
  }

  let points = [];

  for (const rect of rects) {
    points.push(
      { x: Math.floor(rect.left) - offset, y: Math.floor(rect.top) - offset },
      { x: Math.floor(rect.left) - offset, y: Math.ceil(rect.bottom) + offset },
      { x: Math.ceil(rect.right) + offset, y: Math.floor(rect.top) - offset },
      { x: Math.ceil(rect.right) + offset, y: Math.ceil(rect.bottom) + offset }
    );
  }

  points = convexHull(points);

  let minX = points[0].x;
  let minY = points[0].y;
  let maxX = minX;
  let maxY = minY;

  for (let i = 1; i < points.length; ++i) {
    const { x, y } = points[i];

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  let d = 'M ' + (points[0].x - minX + strokeWidth / 2) + ' ' + (points[0].y - minY + strokeWidth / 2);

  for (let i = 1; i < points.length; ++i) {
    d += ' L ' + (points[i].x - minX + strokeWidth / 2) + ' ' + (points[i].y - minY + strokeWidth / 2);
  }

  d += ' Z';

  const popoverElement = document.createElement('div');

  popoverElement.setAttribute('popover', '');
  popoverElement.setAttribute(
    'style',
    'all:unset;' +
      'pointer-events:none;' +
      'position:fixed;' +
      'display:flex;' +
      'flex-direction:column;' +
      'align-items:flex-start;' +
      'top:' +
      (minY - strokeWidth / 2) +
      'px;' +
      'left:' +
      (minX - strokeWidth / 2) +
      'px;'
  );

  const svgElement = popoverElement.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));

  svgElement.setAttribute('viewBox', '0 0 ' + (maxX - minX + strokeWidth) + ' ' + (maxY - minY + strokeWidth));
  svgElement.setAttribute(
    'style',
    'width:' + (maxX - minX + strokeWidth) + 'px;' + 'height:' + (maxY - minY + strokeWidth) + 'px;'
  );

  const pathElement = svgElement.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'path'));

  pathElement.setAttribute('fill', 'transparent');
  pathElement.setAttribute('stroke', '#f00');
  pathElement.setAttribute('stroke-width', '' + strokeWidth);
  pathElement.setAttribute('d', d);

  const infoElement = popoverElement.appendChild(document.createElement('div'));

  infoElement.setAttribute(
    'style',
    'padding:' +
      offset +
      'px ' +
      offset * 2 +
      'px;' +
      'margin-top:' +
      -strokeWidth +
      'px;' +
      'background-color:#f00;' +
      'color:#fff;' +
      'font:12px/20px normal normal ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace'
  );

  infoElement.innerHTML = `
<strong>${debugInfo.messageKey}</strong>
<br>
${debugInfo.locales.join(', ')}
`;

  return popoverElement;
}

export interface Point {
  x: number;
  y: number;
}

export function convexHull(points: Point[]): Point[] {
  points.sort(comparePoints);

  const outline: Point[] = [];

  let outlineLength = 0;

  // Build the upper hull
  for (const point of points) {
    while (outlineLength >= 2 && crossProduct(outline[outlineLength - 2], outline[outlineLength - 1], point) <= 0) {
      --outlineLength;
    }
    outline[outlineLength++] = point;
  }

  const upperLength = outlineLength--;

  // Build the lower hull
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i];

    while (outlineLength >= 2 && crossProduct(outline[outlineLength - 2], outline[outlineLength - 1], point) <= 0) {
      --outlineLength;
    }
    outline[outlineLength++] = point;
  }

  outlineLength--;

  const z = [points[0]];

  for (let i = 1; i < outlineLength; ++i) {
    const a = outline[i - 1];
    const b = outline[i];

    z.push((i < upperLength ? b.y < a.y : b.y > a.y) ? { x: b.x, y: a.y } : { x: a.x, y: b.y }, b);
  }

  return z;
}

function comparePoints(a: Point, b: Point): number {
  return a.x - b.x || a.y - b.y;
}

function crossProduct(pivot: Point, a: Point, b: Point): number {
  return (a.x - pivot.x) * (b.y - pivot.y) - (a.y - pivot.y) * (b.x - pivot.x);
}
