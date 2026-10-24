import svgLoader from 'vite-svg-loader';
import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';

const appName = process.env.NUXT_PUBLIC_APP_NAME || 'Origo';
// The released version comes from package.json (semantic versioning), so a release changes one line.
const appVersion = (JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }).version;

export default defineNuxtConfig({
  app: {
    baseURL: process.env.BASE_URL,
    head: {
      htmlAttrs: {
        lang: 'vi',
        'data-theme': 'light',
      },
      title: appName,
      titleTemplate: `%s | ${appName}`,
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap',
        },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: '16x16 32x32 48x48' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
    },
  },

  routeRules: {
    '/**': {
      headers: {
        'permissions-policy': 'camera=(), geolocation=(), microphone=()',
        'referrer-policy': 'strict-origin-when-cross-origin',
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'SAMEORIGIN',
        // Origo is an internal tool: search engines must not list it.
        'x-robots-tag': 'noindex, nofollow',
      },
    },
  },

  modules: ['@pinia/nuxt', '@nuxtjs/i18n'],

  // Nuxt scans only the top level of `composables/` by default, which does not survive a domain
  // tree. Auto-import names stay flat regardless, so composables carry their domain in the name.
  imports: {
    dirs: ['composables/**'],
  },

  typescript: {
    // Include detached tests and stories in the application type context so their `@/` imports and
    // Nuxt globals resolve consistently in editors and type checks.
    tsConfig: {
      include: ['../test/**/*', '../stories/**/*'],
      compilerOptions: {
        types: ['vitest/globals'],
      },
    },
  },

  css: ['@/assets/style/tailwind.css'],

  // Origo deviates from the starter default: Vietnamese is served at `/` and Japanese at `/ja` for the
  // offshore team, while English stays the source locale that every message is authored in first.
  i18n: {
    defaultLocale: 'vi',
    strategy: 'prefix_except_default',
    locales: [
      {
        code: 'vi',
        language: 'vi',
        file: 'vi/index.ts',
      },
      {
        code: 'ja',
        language: 'ja',
        file: 'ja/index.ts',
      },
      {
        code: 'en',
        language: 'en',
        file: 'en/index.ts',
      },
    ],
  },

  vite: {
    plugins: [svgLoader(), tailwindcss()],
    server: {
      // Extra host names the dev server answers to, e.g. a local reverse-proxy domain (comma separated).
      allowedHosts: (process.env.DEV_ALLOWED_HOSTS ?? '').split(',').filter(Boolean),
    },
    resolve: {},
    assetsInclude: ['**/*.mdx'],
    css: {},
  },

  runtimeConfig: {
    logging: {
      channel: 'daily',
      level: 'warn',
      retentionDays: 30,
    },
    api: {
      baseUrl: '',
      timeoutMilliseconds: 10_000,
    },
    errorReporting: {
      maxPayloadBytes: 8_192,
      rateLimit: {
        maxRequests: 10,
        windowSeconds: 60,
      },
    },
    errorNotify: {
      enabled: false,
      minSeverity: 'error',
      dedupWindowSeconds: 300,
      timeoutMilliseconds: 5_000,
      slack: {
        enabled: false,
        webhookUrl: '',
        minSeverity: '',
        dedupWindowSeconds: 0,
      },
      googleChat: {
        enabled: false,
        webhookUrl: '',
        minSeverity: '',
        dedupWindowSeconds: 0,
        avatarUrl:
          'https://static.vecteezy.com/system/resources/previews/005/537/339/non_2x/animal-insect-bug-red-cute-cartoon-logo-icon-illustration-design-vector.jpg',
      },
    },
    public: {
      appName,
      appVersion,
      errorReportingEnabled: true,
    },
  },

  compatibilityDate: '2024-12-05',
});
