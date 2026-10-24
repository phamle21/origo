# Origo

Origo is a project documentation platform for software teams. Developers understand the product, QA
writes test cases from it, and BA/PO review and comment, all from one place:

- **Screen maps**: screenshots (uploaded images, or captured from HTML/ZIP or a URL) with numbered
  points; each point has basic and detailed design, test notes, dependencies and comments with @mentions.
- **Plans**: Gantt chart and table per project, with stages, drag-to-reschedule, filters and full screen.
- **Roles and permissions**: custom system and project roles; archive or delete projects safely.
- **Multilingual content** (Vietnamese by default, plus any languages you enable) and a vi/ja/en interface.

| Part | Folder | Stack |
|---|---|---|
| API | `api/` | Laravel 13, PHP 8.5 on FrankenPHP, PostgreSQL 18, Redis 8 |
| Web | `web/` | Nuxt 4 (SSR), Vue 3, Tailwind CSS 4 |
| Renderer | `renderer/` | Playwright: turns HTML or a URL into a screenshot, isolated on its own network |
| Docker | `docker/` | Development stack, production template, Dockerfiles |

## Quick start

Requires Docker with Compose v2. Nothing else is installed on the host.

```bash
git clone https://github.com/phamle21/origo.git
cd origo/docker
cp .env.example .env
docker compose up -d --build
```

The first start installs the PHP and Node packages, so it takes a few minutes. Then finish the
installation in one of two ways; both create the database tables and the first administrator:

- **In the browser:** open http://localhost:3310. Until an administrator exists, every page leads to
  the install screen, which asks for your name, e-mail and password.
- **On the command line:** `docker compose exec api php artisan origo:install`
  (add `--email=… --name=… --no-interaction` in scripts; a temporary password is printed once).

Once an administrator exists, the install screen closes for good.

| Service | Address |
|---|---|
| Web app | http://localhost:3310 |
| API health | http://localhost:8310/api/health |
| Mail catcher (Mailpit) | http://localhost:8035 |
| Storybook (`docker compose --profile review up -d storybook`) | http://localhost:6306 |

Always run Compose from `docker/` without `-f`, so a personal `compose.override.yaml` (ignored by Git)
is merged automatically, e.g. to add a local domain or keep data in another folder.

### Everyday commands

```bash
docker compose exec api php artisan test       # API tests
docker compose exec api vendor/bin/pint        # PHP code style
docker compose exec web yarn verify:quick      # web format, lint, type check, unit tests
docker compose run --rm --no-deps renderer npm test
docker compose exec api php artisan migrate:fresh && docker compose exec api php artisan cache:clear   # empty database
```

## Configuration

Development settings live in `docker/.env` (ports, UID/GID, versions) and `api/.env` (created from
`api/.env.example` on first start). The main variables:

| Variable | Used by | Meaning |
|---|---|---|
| `APP_KEY` | API | Encryption key; generated on first start in development |
| `APP_URL` | API | Public API address; screen images are served from it |
| `DB_*`, `REDIS_*` | API | PostgreSQL and Redis connections |
| `MAIL_*` | API | Outgoing mail |
| `INSTALL_TOKEN` | API | Code the install screen asks for; required to install from the browser in production |
| `RENDERER_URL` | API | Internal address of the renderer |
| `NUXT_API_BASE_URL` | Web | Internal address of the API; the browser never calls the API directly |
| `NUXT_ERROR_NOTIFY_*` | Web | Optional Slack / Google Chat alerts for server errors |
| `ALLOWED_PRIVATE_HOSTS` | Renderer | Private hosts the renderer may open (all are blocked by default) |

Images read every setting at run time, so one image serves every environment.

## Production

Released images are published on GHCR for `linux/amd64` and `linux/arm64`:

- `ghcr.io/phamle21/origo-api:<version>` (API; also runs the queue worker and scheduler)
- `ghcr.io/phamle21/origo-web:<version>`
- `ghcr.io/phamle21/origo-renderer:<version>`

`docker/compose.prod.yaml` is a ready template with PostgreSQL, Redis and persistent volumes:

```bash
cd docker
cp .env.prod.example .env.prod      # fill in every empty value, pin ORIGO_VERSION
docker compose -f compose.prod.yaml --env-file .env.prod up -d
docker compose -f compose.prod.yaml --env-file .env.prod exec api php artisan origo:install
```

Or open the web app and use the install screen: in production it asks for the `INSTALL_TOKEN` you
set, so nobody else can claim the first administrator account of a fresh server. Without a token set,
only the command can install.

Put an HTTPS reverse proxy in front of the web (`WEB_PORT`) and API (`API_PORT`) ports, and back up
the `api-storage` and `postgres-data` volumes. On a platform that runs each image as a separate app
(Easypanel, Coolify…), run the API image three times: as the web server, with
`php artisan queue:work --tries=3`, and with `php artisan schedule:work`; mount a volume at
`/app/storage/app`; and set `AUTO_MIGRATE=true` on the web server only, or run `origo:install` once.

## Releasing

Versions follow [Semantic Versioning](https://semver.org/); `api/VERSION`, `web/package.json` and
`renderer/package.json` always carry the same number, and [CHANGELOG.md](CHANGELOG.md) records each
release.

```bash
docker login ghcr.io -u phamle21          # once, with a token that has write:packages
scripts/release.sh 1.0.0                  # builds amd64 + arm64 and pushes <version> and latest
```

Building arm64 on an amd64 machine needs QEMU once:
`docker run --privileged --rm tonistiigi/binfmt --install arm64`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the branch model, commit style and checks.

## License

The license has not been chosen yet. The web app started from
[Nuxt SSR Starter](web/LICENSE) by Ali Soueidan, used under the MIT License.
