// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AppTileIcon, { type AppTileIconName } from '@/components/ui/AppTileIcon.vue';

const NAMES: AppTileIconName[] = ['plan', 'design', 'members', 'people', 'projects', 'admin'];

describe('AppTileIcon', () => {
  test.each(NAMES)('draws a decorative two-colour picture for %s', async (name) => {
    const wrapper = await mountSuspended(AppTileIcon, { props: { name, size: 'lg' } });

    expect(wrapper.attributes('aria-hidden')).toBe('true');
    expect(wrapper.classes()).toContain('size-14');
    expect(wrapper.find('.fill-accent').exists()).toBe(true);
  });
});
