// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { useConfirmStore } from '@/stores/useConfirmStore';

const request = { title: 'Xóa?', confirmLabel: 'Xóa', cancelLabel: 'Hủy', tone: 'danger' as const };

describe('useConfirmStore', () => {
  test('resolves with the answer and closes', async () => {
    const store = useConfirmStore();
    const answer = store.confirm(request);

    expect(store.request?.title).toBe('Xóa?');
    store.settle(true);

    await expect(answer).resolves.toBe(true);
    expect(store.request).toBeNull();
  });

  test('treats a newer question as a "no" to the older one', async () => {
    const store = useConfirmStore();
    const first = store.confirm(request);
    const second = store.confirm({ ...request, title: 'Bỏ thay đổi?' });

    await expect(first).resolves.toBe(false);
    store.settle(false);
    await expect(second).resolves.toBe(false);
  });
});
