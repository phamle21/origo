/** A highlight box in percent of the image: left, top, width, height. */
export type Box = [number, number, number, number];

export interface PercentPoint {
  x: number;
  y: number;
}

/** Smaller boxes are hard to see and to click; the API accepts down to half of this. */
export const MIN_BOX_SIZE = 1;

/** Step for keyboard nudging, in percent. */
export const KEYBOARD_STEP = 0.5;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundPercent(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Converts a pointer position to percent of an element, clamped to its edges. */
export function toPercentPoint(clientX: number, clientY: number, rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>): PercentPoint {
  return {
    x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

/** The box spanned by a drag in any direction, or null when it is too small to be meant. */
export function boxFromDrag(start: PercentPoint, end: PercentPoint): Box | null {
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  if (width < MIN_BOX_SIZE || height < MIN_BOX_SIZE) {
    return null;
  }

  return [roundPercent(left), roundPercent(top), roundPercent(width), roundPercent(height)];
}

/** Moves a box by a delta while keeping all of it inside the image. */
export function moveBox([left, top, width, height]: Box, dx: number, dy: number): Box {
  return [roundPercent(clamp(left + dx, 0, 100 - width)), roundPercent(clamp(top + dy, 0, 100 - height)), width, height];
}

/** Resizes from the bottom-right corner, keeping the minimum size and the image edges. */
export function resizeBox([left, top, width, height]: Box, dx: number, dy: number): Box {
  return [left, top, roundPercent(clamp(width + dx, MIN_BOX_SIZE, 100 - left)), roundPercent(clamp(height + dy, MIN_BOX_SIZE, 100 - top))];
}
