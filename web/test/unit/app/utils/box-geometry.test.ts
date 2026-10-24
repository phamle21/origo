import { describe, expect, test } from 'vitest';
import { boxFromDrag, MIN_BOX_SIZE, moveBox, resizeBox, toPercentPoint } from '@/utils/box-geometry';

describe('box geometry', () => {
  test('converts a pointer position to percent of the element and clamps it to the edges', () => {
    const rect = { left: 100, top: 50, width: 200, height: 100 };

    expect(toPercentPoint(150, 75, rect)).toEqual({ x: 25, y: 25 });
    expect(toPercentPoint(0, 500, rect)).toEqual({ x: 0, y: 100 });
  });

  test('builds the same box from a drag in any direction', () => {
    expect(boxFromDrag({ x: 10, y: 20 }, { x: 40, y: 30 })).toEqual([10, 20, 30, 10]);
    expect(boxFromDrag({ x: 40, y: 30 }, { x: 10, y: 20 })).toEqual([10, 20, 30, 10]);
  });

  test('ignores a drag smaller than the minimum size, which is usually a click', () => {
    expect(boxFromDrag({ x: 10, y: 10 }, { x: 10 + MIN_BOX_SIZE - 0.01, y: 30 })).toBeNull();
    expect(boxFromDrag({ x: 10, y: 10 }, { x: 10 + MIN_BOX_SIZE, y: 10 + MIN_BOX_SIZE })).toEqual([10, 10, 1, 1]);
  });

  test('moves a box but never past the image edges', () => {
    expect(moveBox([10, 10, 20, 10], 5, -5)).toEqual([15, 5, 20, 10]);
    expect(moveBox([10, 10, 20, 10], 200, -200)).toEqual([80, 0, 20, 10]);
  });

  test('resizes from the corner within the minimum size and the image edges', () => {
    expect(resizeBox([10, 10, 20, 10], 5, 5)).toEqual([10, 10, 25, 15]);
    expect(resizeBox([10, 10, 20, 10], -50, -50)).toEqual([10, 10, MIN_BOX_SIZE, MIN_BOX_SIZE]);
    expect(resizeBox([90, 90, 5, 5], 50, 50)).toEqual([90, 90, 10, 10]);
  });
});
