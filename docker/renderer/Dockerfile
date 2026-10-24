# syntax=docker/dockerfile:1
# Origo renderer: turns uploaded HTML or a public URL into a screenshot. Build context: ../renderer.
# The Playwright image ships the browsers that match the pinned `playwright` package version, so the
# two versions must change together.
FROM mcr.microsoft.com/playwright:v1.55.0-noble AS prod
LABEL org.opencontainers.image.source=https://github.com/phamle21/origo
LABEL org.opencontainers.image.title="origo-renderer"
LABEL org.opencontainers.image.description="Origo renderer: HTML and URL screenshots"

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY . .

USER pwuser
EXPOSE 3000
CMD ["node", "server.mjs"]
