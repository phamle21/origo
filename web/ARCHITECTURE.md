# Architecture

## Scope

This document describes the architecture implemented by the current Nuxt 4 SSR starter and the
dependency rules that extensions must follow.

## Runtime Boundaries

```text
browser and SSR application (`app/`)
  -> application API functions (`app/api/`)
  -> Nitro HTTP boundary (`server/api/`)
  -> business orchestration (`server/services/`)
  -> data access (`server/repositories/`)
  -> provider integration (`server/integrations/`)
  -> shared application contract (`shared/contracts/`)
```

- `app/` contains browser-safe Nuxt application code and does not import `server/`.
- `server/` contains Nitro code, private runtime configuration, external transport, logging, and
  notification delivery.
- `shared/` contains serializable contracts and pure types imported by both application and server.
- External provider DTOs are validated and mapped before crossing the Nitro boundary.
- Tests and stories import runtime source; runtime source does not import tooling.

## Current Structure

Origo is one feature: a screen map. Projects contain screens; screens contain numbered points; each
point carries its basic design, detail design, test cases, impact and comments in Vietnamese and
Japanese (`shared/contracts/content.ts`).

```text
app/
  api/{project,screen}/        typed endpoint functions; `api/client.ts` is the shared transport
  assets/style/                Tailwind entry point and semantic design tokens
  components/ui/               primitives: AppBadge, AppCard, AppTabs, AppLocalizedText, ...
  components/layout/           logo, breadcrumb bar, language switcher
  components/content/          bilingual toggle
  components/screen/           screenshot with numbered boxes, point list, tabbed point panel
  components/discussion/       comment thread
  components/editor/           box canvas (draw/move/resize), point list, point form, image input
  composables/                 `useRouteResource` (404 on a missing resource), per-domain reads,
                               `auth/useCurrentUser`, `editor/useScreenEditorDraft`
  middleware/auth.global.ts    every page except /login needs a signed-in user
  layouts/default.vue          header; provides the content language to every component
  pages/                       `/login`, `/`, `/p/[code]`, `/p/[code]/new`,
                               `/p/[code]/[screen]?point=&tab=`, `/p/[code]/[screen]/edit`
  utils/                       date formatting, content-language resolution, tab ids
server/
  api/auth/                    login / logout / me; the API token lives in an httpOnly cookie
  api/projects/                validated read and write endpoints (screens, points, concepts, comments)
  integrations/origo-api/      Laravel client (bearer token from the cookie), DTO schemas, mappers
  repositories/project/        fetches a project's whole screen map and maps it to `records.ts`
  services/screen/             pure: counts, derived dependency / shared-concept links, editor context
  utils/                       session cookie, route-param and payload schemas, bounded body readers
  (exceptions, logging, middleware, notifications, plugins, types: unchanged from the starter)
shared/contracts/              content languages, project and screen contracts, API errors
public/images/screens/         screenshots used by the screen map
i18n/locales/{en,vi,ja}/       UI messages; English is the source, Vietnamese the default
test/                          detached unit and integration tests
stories/                       detached Storybook stories
```

## Implemented Request Flow

```text
app/pages/p/[code]/[screen].vue
  -> app/composables/screen/useScreenDetail.ts -> useRouteResource
  -> app/api/screen/screen.ts
  -> server/api/projects/[code]/screens/[screen].get.ts   (Zod route params)
  -> server/repositories/project/project.ts               (GET /api/v1/projects/{code}/map)
  -> server/integrations/origo-api/{client,dto,mappers}   (bearer token, Zod parse, map to records)
  -> server/services/screen/screen.ts                     (derives dependency and concept links)
  -> shared/contracts/screen.ts
```

`app/plugins/api.ts` creates the application transport per Nuxt request. During SSR it forwards the
current request headers through Nitro, preserving request isolation. `app/api/client.ts` exposes the
transport and normalizes application API failures.

`useRouteResource` awaits `useAsyncData` with a key per resource, so a project or screen that does not
exist renders the error page with a real 404 during SSR, while any other failure stays inline with a
retry.

The UI language (route prefix) chooses the primary content language: Japanese for `/ja`, Vietnamese
otherwise. The bilingual choice lives in the `origo-bilingual` cookie so SSR renders the same text the
browser hydrates. `AppLocalizedText` renders a missing translation as the other language with a "not
translated" badge, never as blank space.

Writes follow the same path in reverse: the editor sends the whole screen (`PUT .../points`), this
server validates it with the same bounds as the API (`shared/contracts/screen-editor.ts`), and Laravel
validates and stores it in one transaction. Uploads are size-checked from `Content-Length` before they
are read. Session cookies are `SameSite=Lax`, so other sites cannot submit writes with them.

The former demo data lives on as `test/fixtures/screen-map.ts` for service tests; the API's seeder
was generated from it.

## Layer Ownership

| Layer | Current responsibility |
|---|---|
| `app/pages` | Route orchestration, SSR state selection, and metadata |
| `app/components` | Rendering and user interaction |
| `app/composables` | Reactive state, async-data identity, and refresh behavior |
| `app/api` | Typed calls to application-owned Nitro endpoints |
| `app/stores` | State shared across application views |
| `app/plugins` | Nuxt runtime integrations and request-scoped dependencies |
| `server/api` | HTTP parsing, validation, status, and delegation |
| `server/services` | Business use-case orchestration |
| `server/repositories` | Resource access and conversion to application contracts |
| `server/integrations` | Provider transport, endpoints, DTO validation, and mapping |
| `shared/contracts` | Serializable application API shapes |

## SSR and Type Contexts

The root `tsconfig.json` references Nuxt's generated app, server, shared, and node projects. Nuxt
generates them through `yarn postinstall`, `yarn dev`, `yarn build`, or `yarn type-check`.

Render-critical reads use `useFetch` or `useAsyncData`. Async-data handlers return serializable
values, remain free of side effects, and use keys containing every parameter that changes the
response. Browser APIs remain inside client-only boundaries.

## Errors and Observability

`defineApiHandler` normalizes server failures into the shared `ApiErrorData` contract. Responses
contain a stable error code, safe public message, and request ID without exposing provider errors.

The server provides channel-based logging, recursive text and context redaction, request correlation,
client-report payload limits, per-address report rate limiting, notification severity filtering, and
notification deduplication. `stdout` emits structured JSON; `daily` writes readable UTC-day files with
30-day retention by default; `stack` uses both. The default channel is `daily` and the default minimum
level is `warn`. Slack and Google Chat delivery are disabled unless enabled through private runtime
configuration.

Rate limiting and deduplication use in-memory state and therefore operate per application instance.

## Styling and UI Tooling

Tailwind CSS 4 is loaded from `app/assets/style/tailwind.css`. Semantic `--app-*` variables in
`tokens.css` are exposed as Tailwind theme utilities. The current application uses the light theme.

Stories are detached under `stories/` and mirror their component source paths. Vitest tests are
detached under `test/` and mirror runtime source paths.
