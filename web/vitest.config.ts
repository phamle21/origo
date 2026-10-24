import { defineVitestConfig } from '@nuxt/test-utils/config';
import svgLoader from 'vite-svg-loader';
import { projectAliases } from './alias.config.ts';

export default defineVitestConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['./test/unit/**/*.test.ts', './test/integration/**/*.test.ts'],
    setupFiles: ['./test/setup.ts'],
    coverage: {
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 75,
        lines: 80,
      },
    },
    // A test that needs Nuxt composables opts in with `// @vitest-environment nuxt`. That environment
    // defaults to happy-dom, which this project does not install, so it reuses jsdom.
    environmentOptions: {
      nuxt: {
        domEnvironment: 'jsdom',
        // jsdom reports an English browser; tests render the default locale deterministically instead.
        overrides: { i18n: { detectBrowserLanguage: false } },
      },
    },
  },
  // Detached tests import runtime source through the project aliases, so they must resolve here too.
  resolve: {
    alias: projectAliases,
  },
  plugins: [svgLoader()],
});
