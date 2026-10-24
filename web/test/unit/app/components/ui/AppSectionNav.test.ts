// @vitest-environment nuxt
import { describe, expect, test } from 'vitest';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import AppSectionNav from '@/components/ui/AppSectionNav.vue';

describe('AppSectionNav', () => {
  test('marks only the current section as the current page', async () => {
    const wrapper = await mountSuspended(AppSectionNav, {
      props: {
        label: 'Project',
        current: 'plan',
        items: [
          { id: 'plan', label: 'Plan', icon: 'plan', to: '/p/LMS/plan' },
          { id: 'members', label: 'Members', icon: 'users', to: '/p/LMS/members' },
        ],
      },
    });
    const links = wrapper.findAll('a');

    expect(wrapper.get('nav').attributes('aria-label')).toBe('Project');
    expect(links.map((link) => link.attributes('aria-current'))).toEqual(['page', undefined]);
    expect(links[0]?.classes()).toContain('bg-accent');
  });
});
