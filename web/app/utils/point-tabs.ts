export const POINT_TABS = ['basic', 'detail', 'tests', 'impact', 'comments'] as const;

export type PointTab = (typeof POINT_TABS)[number];

export function isPointTab(value: unknown): value is PointTab {
  return typeof value === 'string' && (POINT_TABS as readonly string[]).includes(value);
}
