import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Plain jsdom tests render components without a Nuxt runtime, so the Nuxt components they may reference
// are replaced by minimal equivalents. A test whose component calls Nuxt composables uses
// `// @vitest-environment nuxt` instead of a stub, so it exercises the real runtime.
config.global.components = {
  NuxtLink: {
    props: ['to'],
    template: '<a style="cursor:pointer;"><slot>NuxtLink</slot></a>',
  },
  ClientOnly: {
    template: '<slot />',
  },
};

vi.stubGlobal(
  'scrollTo',
  vi.fn((x: number, y: number) => ({
    x,
    y,
  })),
);
