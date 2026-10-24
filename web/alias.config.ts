import { fileURLToPath } from 'node:url';

const rootDirectory = fileURLToPath(new URL('.', import.meta.url)).replace(/[\\/]$/, '');

/**
 * Nuxt's own file-system aliases, restated for Vitest and Storybook because neither can import
 * `nuxt.config.ts`: that file calls `defineNuxtConfig`, a global supplied by Nuxt's config loader. The
 * values must stay identical to Nuxt's defaults — a divergence resolves one way in `yarn build` and
 * another in the tools. A future *custom* alias belongs in `nuxt.config.ts` `alias` and here.
 *
 * Longer prefixes come first because a resolver walks the entries in order.
 */
export const projectAliases: Record<string, string> = {
  '#server': `${rootDirectory}/server`,
  '#shared': `${rootDirectory}/shared`,
  '~~': rootDirectory,
  '@@': rootDirectory,
  '~': `${rootDirectory}/app`,
  '@': `${rootDirectory}/app`,
};
