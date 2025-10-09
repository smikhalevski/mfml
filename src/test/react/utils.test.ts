import { expect, test } from 'vitest';
import { convexHull } from '../../main/react/utils.js';

test('', () => {
  expect(
    convexHull([
      { x: 0, y: 3 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 4, y: 4 },
      { x: 0, y: 0 },
      { x: 1, y: 2 },
      { x: 3, y: 1 },
      { x: 3, y: 3 },
    ])
  ).toStrictEqual([
    { x: 0, y: 0 },
    { x: 3, y: 1 },
    { x: 4, y: 4 },
    { x: 0, y: 3 },
  ]);
});
