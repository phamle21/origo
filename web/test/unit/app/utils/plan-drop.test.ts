import { describe, expect, test } from 'vitest';
import { isSamePlace, resolvePlanDrop } from '@/utils/plan-drop';
import type { PlanItem } from '~~/shared/contracts/plan';

function item(id: string, kind: PlanItem['kind'], parentId: string | null, position: number): PlanItem {
  return { id, kind, parentId, position, name: { vi: id }, note: null, screenCodes: [] };
}

const items = [
  item('p1', 'phase', null, 1),
  item('p2', 'phase', null, 2),
  item('cart', 'module', 'p1', 1),
  item('pay', 'module', 'p1', 2),
  item('a', 'feature', 'cart', 1),
  item('b', 'feature', 'cart', 2),
  item('c', 'feature', 'cart', 3),
  item('x', 'feature', 'pay', 1),
];

describe('resolvePlanDrop', () => {
  test('puts an item before or after a sibling, counting without itself', () => {
    expect(resolvePlanDrop(items, 'c', 'a', 'before')).toEqual({ rowId: 'a', mode: 'before', parentId: 'cart', index: 0 });
    expect(resolvePlanDrop(items, 'a', 'b', 'after')).toEqual({ rowId: 'b', mode: 'after', parentId: 'cart', index: 1 });
  });

  test('moves a feature next to a feature of another module, or to the end of another module', () => {
    expect(resolvePlanDrop(items, 'a', 'x', 'after')).toEqual({ rowId: 'x', mode: 'after', parentId: 'pay', index: 1 });
    expect(resolvePlanDrop(items, 'a', 'pay', 'before')).toEqual({ rowId: 'pay', mode: 'inside', parentId: 'pay', index: 1 });
    expect(resolvePlanDrop(items, 'cart', 'p2', 'after')).toEqual({ rowId: 'p2', mode: 'inside', parentId: 'p2', index: 0 });
  });

  test('refuses another level and the item itself', () => {
    expect(resolvePlanDrop(items, 'a', 'p1', 'after')).toBeNull();
    expect(resolvePlanDrop(items, 'p1', 'cart', 'after')).toBeNull();
    expect(resolvePlanDrop(items, 'a', 'a', 'after')).toBeNull();
    expect(resolvePlanDrop(items, 'missing', 'a', 'after')).toBeNull();
  });
});

describe('isSamePlace', () => {
  test('spots a drop that changes nothing', () => {
    expect(isSamePlace(items, 'b', { rowId: 'a', mode: 'after', parentId: 'cart', index: 1 })).toBe(true);
    expect(isSamePlace(items, 'b', { rowId: 'a', mode: 'before', parentId: 'cart', index: 0 })).toBe(false);
    expect(isSamePlace(items, 'a', { rowId: 'pay', mode: 'inside', parentId: 'pay', index: 1 })).toBe(false);
  });
});
