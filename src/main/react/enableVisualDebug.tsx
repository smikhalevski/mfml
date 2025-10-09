import { createPopoverElement, getMessageNodesFromPoint, getNodeRects } from './utils.js';
import { MessageDebugInfo } from '../types.js';

export function enableVisualDebug(debugInfos: Record<string, MessageDebugInfo>): () => void {
  let popoverElement: Element | null = null;

  let latestX = -1;
  let latestY = -1;

  const showRects = () => {
    const rects = [];

    const nodesInfo = getMessageNodesFromPoint(latestX, latestY);

    if (nodesInfo === null || debugInfos[nodesInfo.messageKey] === undefined) {
      popoverElement?.remove();
      return;
    }

    for (const node of nodesInfo.nodes) {
      const nodeRects = getNodeRects(node);

      for (let i = 0; i < nodeRects.length; ++i) {
        rects.push(nodeRects[i]);
      }
    }

    popoverElement?.remove();

    popoverElement = createPopoverElement(rects, 4, 4, debugInfos[nodesInfo.messageKey]);

    if (popoverElement === null) {
      return;
    }

    document.body.appendChild(popoverElement);

    (popoverElement as any).showPopover();
  };

  const mouseListener = (event: MouseEvent) => {
    latestX = event.x;
    latestY = event.y;

    if (event.altKey) {
      showRects();
    }
  };

  const keyboardListener = (event: KeyboardEvent) => {
    if (event.altKey) {
      showRects();
    } else {
      popoverElement?.remove();
    }
  };

  document.addEventListener('mousemove', mouseListener);
  document.addEventListener('keydown', keyboardListener);
  document.addEventListener('keyup', keyboardListener);

  return () => {
    document.removeEventListener('mousemove', mouseListener);
    document.removeEventListener('keydown', keyboardListener);
    document.removeEventListener('keyup', keyboardListener);
  };
}
