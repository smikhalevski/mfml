export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Returns an array of outlines for a given group of rects.
 *
 * Each outline is an array of points: `[x1, y1, x2, y2, …]`.
 *
 * @param rects Rects to outline.
 * @param offset The outline offset from the rect.
 */
export function getOutlinesOfRects(rects: ArrayLike<Rect>, offset = 0): number[][] {
  if (rects.length === 0) {
    return [];
  }

  const xs = [];
  const ys = [];

  // Collect grid lines
  for (let k = 0; k < rects.length; ++k) {
    const rect = rects[k];

    const x1 = rect.x - offset;
    const y1 = rect.y - offset;
    const x2 = rect.x + offset + rect.width;
    const y2 = rect.y + offset + rect.height;

    if (xs.indexOf(x1) === -1) {
      xs.push(x1);
    }
    if (xs.indexOf(x2) === -1) {
      xs.push(x2);
    }
    if (ys.indexOf(y1) === -1) {
      ys.push(y1);
    }
    if (ys.indexOf(y2) === -1) {
      ys.push(y2);
    }
  }

  xs.sort(sortAscending);
  ys.sort(sortAscending);

  const xCount = xs.length;
  const yCount = ys.length;
  const grid = [];

  // Detect which grid cells are filled by rects
  for (let j = 0; j < yCount; ++j) {
    for (let i = 0; i < xCount; ++i) {
      const x = xs[i];
      const y = ys[j];

      let cellFlags = 0;

      for (let k = 0; k < rects.length; ++k) {
        const rect = rects[k];

        const x1 = rect.x - offset;
        const y1 = rect.y - offset;
        const x2 = rect.x + offset + rect.width;
        const y2 = rect.y + offset + rect.height;

        if (x >= x1 && x < x2 && y >= y1 && y < y2) {
          cellFlags = FLAG_FILLED;
          break;
        }
      }

      grid.push(cellFlags);
    }
  }

  const outlines = [];

  for (let i = 0; i < grid.length; ++i) {
    const y = (i / xCount) | 0;
    const x = i - y * xCount;

    if ((grid[i] & FLAG_VISITED) === FLAG_VISITED || !isVertex(grid, xCount, x, y)) {
      continue;
    }

    // Trace outline in grid coordinates
    const outline = traceOutline(grid, xCount, yCount, x, y);

    // Map from grid coordinates to rect coordinates
    for (let j = 0; j < outline.length; j += 2) {
      outline[j] = xs[outline[j]];
      outline[j + 1] = ys[outline[j + 1]];
    }

    outlines.push(outline);
  }

  return outlines;
}

const FLAG_FILLED = 1 << 0;
const FLAG_VISITED = 1 << 1;

const DIRECTION_UP = 1;
const DIRECTION_DOWN = 2;
const DIRECTION_LEFT = 3;
const DIRECTION_RIGHT = 4;

function sortAscending(a: number, b: number): number {
  return a - b;
}

/**
 * Returns `true` if a grid cell `(x, y)` is a part of a rect.
 */
function isFilled(grid: number[], xCount: number, x: number, y: number): boolean {
  return (grid[y * xCount + x] & FLAG_FILLED) === FLAG_FILLED;
}

/**
 * Returns `true` if a point `(x, y)` is a vertex of an outline.
 */
function isVertex(grid: number[], xCount: number, x: number, y: number): boolean {
  if (isFilled(grid, xCount, x, y)) {
    return (
      x === 0 ||
      y === 0 ||
      !isFilled(grid, xCount, x - 1, y) ||
      !isFilled(grid, xCount, x, y - 1) ||
      !isFilled(grid, xCount, x - 1, y - 1)
    );
  }

  return (
    (x !== 0 && isFilled(grid, xCount, x - 1, y)) ||
    (y !== 0 && isFilled(grid, xCount, x, y - 1)) ||
    (x !== 0 && y !== 0 && isFilled(grid, xCount, x - 1, y - 1))
  );
}

/**
 * Traverses the grid and returns an array of `(x, y)` in grid coordinates that form an outline.
 */
function traceOutline(grid: number[], xCount: number, yCount: number, startX: number, startY: number): number[] {
  const outline: number[] = [];

  let x = startX;
  let y = startY;
  let returnDirection = -1;

  while ((grid[y * xCount + x] & FLAG_VISITED) !== FLAG_VISITED) {
    if (isLineExtension(outline, x, y)) {
      outline[outline.length - 2] = x;
      outline[outline.length - 1] = y;
    } else {
      outline.push(x, y);
    }

    grid[y * xCount + x] |= FLAG_VISITED;

    // Trace clockwise

    if (
      returnDirection !== DIRECTION_RIGHT &&
      x !== xCount - 1 &&
      isVertex(grid, xCount, x + 1, y) &&
      (y === 0 || isFilled(grid, xCount, x, y) !== isFilled(grid, xCount, x, y - 1))
    ) {
      returnDirection = DIRECTION_LEFT;
      ++x;
      continue;
    }

    if (
      returnDirection !== DIRECTION_DOWN &&
      y !== yCount - 1 &&
      isVertex(grid, xCount, x, y + 1) &&
      (x === 0 || isFilled(grid, xCount, x, y) !== isFilled(grid, xCount, x - 1, y))
    ) {
      returnDirection = DIRECTION_UP;
      ++y;
      continue;
    }

    if (
      returnDirection !== DIRECTION_LEFT &&
      x !== 0 &&
      isVertex(grid, xCount, x - 1, y) &&
      (y === 0 || isFilled(grid, xCount, x - 1, y) !== isFilled(grid, xCount, x - 1, y - 1))
    ) {
      returnDirection = DIRECTION_RIGHT;
      --x;
      continue;
    }

    if (
      returnDirection !== DIRECTION_UP &&
      y !== 0 &&
      isVertex(grid, xCount, x, y - 1) &&
      (x === 0 || isFilled(grid, xCount, x, y - 1) !== isFilled(grid, xCount, x - 1, y - 1))
    ) {
      returnDirection = DIRECTION_DOWN;
      --y;
      continue;
    }

    break;
  }

  if (x === startX && y === startY && isLineExtension(outline, x, y)) {
    outline.length -= 2;
  }

  return outline;
}

/**
 * Returns `true` if a point `(x, y)` is on the same line as the last segment of the `outline`.
 */
function isLineExtension(outline: number[], x: number, y: number): boolean {
  const length = outline.length;

  return (
    length >= 4 &&
    ((outline[length - 2] === x && outline[length - 2] === outline[length - 4]) ||
      (outline[length - 1] === y && outline[length - 1] === outline[length - 3]))
  );
}
