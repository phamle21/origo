# syntax=docker/dockerfile:1
# Origo API (Laravel on FrankenPHP). Build context: ../api — see compose.yaml and scripts/release.sh.
#   dev:  tools only; the source is mounted from the host and dependencies install on first start.
#   prod: the source and production dependencies baked in; every setting comes from the environment.
ARG PHP_VERSION=8.5

FROM dunglas/frankenphp:1-php${PHP_VERSION} AS base
LABEL org.opencontainers.image.source=https://github.com/phamle21/origo
LABEL org.opencontainers.image.title="origo-api"
LABEL org.opencontainers.image.description="Origo API: Laravel on FrankenPHP"

ARG UID=1000
ARG GID=1000

RUN install-php-extensions pdo_pgsql redis intl zip bcmath pcntl gd exif

# A regular user that may still open port 80.
RUN groupadd -g ${GID} app \
    && useradd -u ${UID} -g app -m app \
    && setcap CAP_NET_BIND_SERVICE=+eip /usr/local/bin/frankenphp \
    && chown -R app:app /data/caddy /config/caddy

ENV SERVER_NAME=":80"
WORKDIR /app

# ---------------------------------------------------------------------------------------------------
FROM base AS dev

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# On the API container only (ORIGO_DEV_BOOTSTRAP=1): install dependencies, create .env and the app
# key when they are missing, so a fresh clone starts with one command.
COPY --chmod=755 <<'SH' /usr/local/bin/origo-dev-entrypoint
#!/bin/sh
set -e
if [ "${ORIGO_DEV_BOOTSTRAP:-0}" = "1" ]; then
    [ -f vendor/autoload.php ] || composer install --no-interaction --no-progress
    [ -f .env ] || cp .env.example .env
    grep -q '^APP_KEY=base64:' .env || php artisan key:generate --force --no-interaction
fi
exec docker-php-entrypoint "$@"
SH

USER app
ENTRYPOINT ["origo-dev-entrypoint"]
CMD ["--config", "/etc/frankenphp/Caddyfile", "--adapter", "caddyfile"]

# ---------------------------------------------------------------------------------------------------
FROM base AS build

RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# The modules are Composer path repositories, so they must exist before the install.
COPY composer.json composer.lock ./
COPY modules ./modules
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress

COPY . .
RUN composer dump-autoload --no-dev --optimize --no-interaction \
    && php artisan package:discover --ansi \
    && mkdir -p storage/app/public storage/app/private storage/framework/cache/data storage/framework/sessions \
        storage/framework/views storage/logs bootstrap/cache \
    && ln -sfn ../storage/app/public public/storage \
    && chown -R app:app storage bootstrap/cache

# ---------------------------------------------------------------------------------------------------
FROM base AS prod

RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

COPY --from=build /app /app

# Caches config and routes from the runtime environment on every start. With AUTO_MIGRATE=true the
# web container also applies pending migrations (leave it off on queue and scheduler).
COPY --chmod=755 <<'SH' /usr/local/bin/origo-entrypoint
#!/bin/sh
set -e
if [ -z "${APP_KEY:-}" ]; then
    echo "APP_KEY is empty. Generate one with: docker run --rm <this image> php artisan key:generate --show" >&2
    exit 1
fi
if [ "${AUTO_MIGRATE:-false}" = "true" ]; then
    php artisan migrate --force --no-interaction
fi
php artisan optimize --no-interaction >/dev/null
exec docker-php-entrypoint "$@"
SH

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr

USER app
EXPOSE 80
ENTRYPOINT ["origo-entrypoint"]
CMD ["--config", "/etc/frankenphp/Caddyfile", "--adapter", "caddyfile"]
