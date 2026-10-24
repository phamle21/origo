# syntax=docker/dockerfile:1
# Origo web (Nuxt SSR). Build context: ../web — see compose.yaml and scripts/release.sh.
#   dev:  the source is mounted from the host; dependencies install on first start.
#   prod: only the built .output; the API address and every other setting come from NUXT_* variables.
ARG NODE_VERSION=24.14.0

FROM node:${NODE_VERSION}-alpine AS base
LABEL org.opencontainers.image.source=https://github.com/phamle21/origo
LABEL org.opencontainers.image.title="origo-web"
LABEL org.opencontainers.image.description="Origo web: Nuxt SSR"
# The Yarn version comes from "packageManager" in web/package.json.
RUN corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

# ---------------------------------------------------------------------------------------------------
FROM base AS dev
# The "node" user (UID 1000) ships with the image.
USER node
EXPOSE 3000
CMD ["sh", "-c", "[ -d node_modules ] || yarn install --immutable; exec yarn dev --host 0.0.0.0 --port 3000"]

# ---------------------------------------------------------------------------------------------------
FROM base AS build
# Git hooks are for contributors' machines, not image builds.
ENV HUSKY=0
COPY . .
RUN yarn install --immutable && yarn build

# ---------------------------------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS prod
LABEL org.opencontainers.image.source=https://github.com/phamle21/origo
LABEL org.opencontainers.image.title="origo-web"
LABEL org.opencontainers.image.description="Origo web: Nuxt SSR"
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000 \
    NUXT_LOGGING_CHANNEL=stdout
WORKDIR /app
COPY --from=build --chown=node:node /app/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
