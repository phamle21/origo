import { fileURLToPath } from 'url';
import { mergeConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import tailwindcss from '@tailwindcss/vite';
import AutoImport from 'unplugin-auto-import/vite';
import type { StorybookConfig } from '@storybook/vue3-vite';
// Storybook loads this file through Node's native TypeScript support, which resolves a relative import
// only with its explicit extension.
import { projectAliases } from '../alias.config.ts';

const config: StorybookConfig = {
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },

  viteFinal: (config) => {
    const nuxtStubs = fileURLToPath(new URL('./nuxt-stubs', import.meta.url));

    return mergeConfig(config, {
      plugins: [
        vue(),
        AutoImport({
          // Replicate Nuxt's auto-imports: Vue reactivity APIs, vue-i18n composables, and Nuxt stubs
          imports: ['vue', 'vue-i18n', { [nuxtStubs]: ['$fetch', 'defineLazyHydrationComponent', 'useRuntimeConfig', 'useRoute'] }],
          include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/],
          dts: false,
        }),
        svgLoader(),
        tailwindcss(),
      ],
      resolve: {
        alias: {
          ...projectAliases,
          // Resolve Nuxt virtual modules to our stubs
          '#components': nuxtStubs,
          '#imports': nuxtStubs,
        },
      },
    });
  },

  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest', '@storybook/addon-themes'],

  // Stories are a detached tooling adapter: they mirror the component path under `stories/`.
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.ts'],

  // The application's public files, plus sample screenshots that only stories and tests use.
  staticDirs: ['../public', '../stories/static'],

  core: { disableTelemetry: true },
};

export default config;
