// @vitest-environment nuxt
import { describe, expect, test, vi } from 'vitest';
import { nextTick } from 'vue';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import EditorBoxCanvas from '@/components/editor/EditorBoxCanvas.vue';

const props = {
  image: { src: '/a.webp', width: 1_000, height: 500 },
  imageAlt: 'Giỏ hàng',
  boxes: [{ key: 'a', number: 1, title: 'Giá', box: [10, 10, 20, 20] as [number, number, number, number] }],
  selectedKey: 'a',
};

async function mountCanvas() {
  const wrapper = await mountSuspended(EditorBoxCanvas, { props });
  const surface = wrapper.get('.cursor-crosshair');

  // jsdom has no layout, so the surface is given a 1000 × 500 box at the origin.
  vi.spyOn(surface.element, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 1_000, height: 500 } as DOMRect);

  return { wrapper, surface };
}

// jsdom has no PointerEvent, and test-utils cannot set `button` on the MouseEvent it falls back to.
async function pointer(element: Element, type: string, init: MouseEventInit = {}) {
  element.dispatchEvent(new MouseEvent(type, { bubbles: true, button: 0, ...init }));
  await nextTick();
}

describe('EditorBoxCanvas', () => {
  test('draws a new box from a drag on the screenshot', async () => {
    const { wrapper, surface } = await mountCanvas();

    await pointer(surface.element, 'pointerdown', { clientX: 500, clientY: 250 });
    await pointer(surface.element, 'pointermove', { clientX: 700, clientY: 300 });
    await pointer(surface.element, 'pointerup');

    expect(wrapper.emitted('create')).toEqual([[[50, 50, 20, 10]]]);
  });

  test('treats a click without a drag as no new box', async () => {
    const { wrapper, surface } = await mountCanvas();

    await pointer(surface.element, 'pointerdown', { clientX: 500, clientY: 250 });
    await pointer(surface.element, 'pointerup');

    expect(wrapper.emitted('create')).toBeUndefined();
  });

  test('moves a box by dragging it', async () => {
    const { wrapper, surface } = await mountCanvas();

    await pointer(wrapper.get('[aria-label="Điểm 1: Giá"]').element, 'pointerdown', { clientX: 150, clientY: 75 });
    await pointer(surface.element, 'pointermove', { clientX: 250, clientY: 125 });

    expect(wrapper.emitted('select')).toEqual([['a']]);
    expect(wrapper.emitted('change')).toEqual([['a', [20, 20, 20, 20]]]);
  });

  test('moves with arrow keys, resizes with Shift and removes with Delete', async () => {
    const { wrapper } = await mountCanvas();
    const box = wrapper.get('[aria-label="Điểm 1: Giá"]');

    await box.trigger('keydown', { key: 'ArrowRight' });
    await box.trigger('keydown', { key: 'ArrowDown', shiftKey: true });
    await box.trigger('keydown', { key: 'Delete' });
    await box.trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('change')).toEqual([
      ['a', [10.5, 10, 20, 20]],
      ['a', [10, 10, 20, 20.5]],
    ]);
    expect(wrapper.emitted('remove')).toEqual([['a']]);
  });
});
