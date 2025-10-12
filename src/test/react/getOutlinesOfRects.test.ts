import { expect, test } from 'vitest';
import { getOutlinesOfRects } from '../../main/react/getOutlinesOfRects.js';

test('traces rect outline', () => {
  expect(getOutlinesOfRects([])).toStrictEqual([]);

  expect(getOutlinesOfRects([{ x: 1, y: 1, width: 7, height: 7 }])).toStrictEqual([[1, 1, 8, 1, 8, 8, 1, 8]]);
});

test('traces outline of a rect intersection', () => {
  /*
     0  1  2  3  4  5  6  7  8
  0
  1     A  A  A  A  A
  2     A  A  A  A  A
  3     A  A  B  B  B  B  B
  4     A  A  B  B  B  B  B
  5     A  A  B  B  B  B  B
  6           B  B  B  B  B
  7           B  B  B  B  B
  8
  */
  expect(
    getOutlinesOfRects([
      /* A */ { x: 1, y: 1, width: 5, height: 5 },
      /* B */ { x: 3, y: 3, width: 5, height: 5 },
    ])
  ).toStrictEqual(
    // prettier-ignore
    [
      [
        1, 1,
        6, 1,
        6, 3,
        8, 3,
        8, 8,
        3, 8,
        3, 6,
        1, 6,
      ],
    ]
  );
});

test('traces outlines of non-intersecting rects', () => {
  /*
     0  1  2  3  4  5  6  7  8
  0
  1     A  A  A  A  A
  2     A  A  A  A  A
  3     A  A  A  A  A
  4
  5           B  B  B  B  B
  6           B  B  B  B  B
  7           B  B  B  B  B
  8
  */
  expect(
    getOutlinesOfRects([
      /* A */ { x: 1, y: 1, width: 5, height: 3 },
      /* B */ { x: 3, y: 5, width: 5, height: 3 },
    ])
  ).toStrictEqual(
    // prettier-ignore
    [
      [
        1, 1,
        6, 1,
        6, 4,
        1, 4,
      ],
      [
        3, 5,
        8, 5,
        8, 8,
        3, 8,
      ],
    ]
  );
});

test('traces outlines with holes', () => {
  /*
     0  1  2  3  4  5  6  7  8
  0
  1     A  A  A  A  A  A  A
  2     A  A  A  A  A  B  B
  3     D  D           B  B
  4     D  D           B  B
  5     D  D           B  B
  6     D  D  C  C  C  B  B
  7     D  D  C  C  C  C  C
  8
  */
  expect(
    getOutlinesOfRects([
      /* A */ { x: 1, y: 1, width: 7, height: 2 },
      /* B */ { x: 1, y: 3, width: 2, height: 5 },
      /* C */ { x: 3, y: 6, width: 5, height: 2 },
      /* D */ { x: 6, y: 2, width: 2, height: 5 },
    ])
  ).toStrictEqual(
    // prettier-ignore
    [
      [
        1, 1,
        8, 1,
        8, 8,
        1, 8,
      ],
      [
        3, 3,
        6, 3,
        6, 6,
        3, 6,
      ]
    ]
  );
});

test('traces outlines of a convoluted shape', () => {
  expect(
    /*
       0  1  2  3  4  5  6  7  8
    0  A  A  A  A  A  A  A  A
    1                       B
    2                       B
    3                       B
    4                       B
    5                       B
    6
    */
    getOutlinesOfRects([
      /* A */ { x: 0, y: 0, width: 8, height: 1 },
      /* B */ { x: 7, y: 1, width: 1, height: 5 },
    ])
  ).toStrictEqual(
    // prettier-ignore
    [
      [
        0, 0,
        8, 0,
        8, 6,
        7, 6,
        7, 1,
        0, 1,
      ],
    ]
  );

  expect(
    /*
       0  1  2  3  4  5  6  7  8
    0  A  A  A  A  A  A  A  A
    1                       B
    2                       B
    3                       B
    4                       B
    5        C  C  C  C  C  B
    6
    */
    getOutlinesOfRects([
      /* A */ { x: 0, y: 0, width: 8, height: 1 },
      /* B */ { x: 7, y: 1, width: 1, height: 5 },
      /* C */ { x: 2, y: 5, width: 5, height: 1 },
    ])
  ).toStrictEqual(
    // prettier-ignore
    [
      [
        0, 0,
        8, 0,
        8, 6,
        2, 6,
        2, 5,
        7, 5,
        7, 1,
        0, 1,
      ],
    ]
  );

  expect(
    /*
       0  1  2  3  4  5  6  7  8
    0  A  A  A  A  A  A  A  A
    1                       B
    2        D  E  E  E     B
    3        D        F     B
    4        D              B
    5        C  C  C  C  C  B
    6
    */
    getOutlinesOfRects([
      /* A */ { x: 0, y: 0, width: 8, height: 1 },
      /* B */ { x: 7, y: 1, width: 1, height: 5 },
      /* C */ { x: 2, y: 5, width: 5, height: 1 },
      /* D */ { x: 2, y: 2, width: 1, height: 3 },
      /* E */ { x: 3, y: 2, width: 3, height: 1 },
      /* F */ { x: 5, y: 3, width: 1, height: 1 },
    ])
  ).toStrictEqual(
    // prettier-ignore
    [
      [
        0, 0,
        8, 0,
        8, 6,
        2, 6,
        2, 2,
        6, 2,
        6, 4,
        5, 4,
        5, 3,
        3, 3,
        3, 5,
        7, 5,
        7, 1,
        0, 1,
      ],
    ]
  );
});
