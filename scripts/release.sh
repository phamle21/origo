#!/usr/bin/env bash
# Builds the Origo images for amd64 and arm64 and pushes them to GHCR, tagged <version> and latest
# (pre-releases such as 1.1.0-rc.1 do not move latest).
#
#   docker login ghcr.io -u phamle21          # once, with a token that has write:packages
#   scripts/release.sh 1.0.0
#
# Environment: REGISTRY (default ghcr.io/phamle21), PLATFORMS (default linux/amd64,linux/arm64),
# ALLOW_DIRTY=1 to release with uncommitted changes.
set -euo pipefail

VERSION="${1:-}"
REGISTRY="${REGISTRY:-ghcr.io/phamle21}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"
BUILDER=origo-release
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

fail() { echo "release: $*" >&2; exit 1; }

[[ -n "$VERSION" ]] || fail "missing version. Usage: scripts/release.sh <version>, e.g. 1.0.0"
[[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$ ]] || fail "\"$VERSION\" is not a semantic version (MAJOR.MINOR.PATCH)"

cd "$ROOT"

# The three parts always carry the same version; the images must match the code they are built from.
package_version() { sed -n 's/^  "version": "\(.*\)",\{0,1\}$/\1/p' "$1" | head -n 1; }
for found in "api/VERSION=$(tr -d '[:space:]' < api/VERSION)" \
             "web/package.json=$(package_version web/package.json)" \
             "renderer/package.json=$(package_version renderer/package.json)"; do
  [[ "${found#*=}" == "$VERSION" ]] || fail "${found%%=*} says ${found#*=}, not $VERSION. Update all three first."
done

if [[ -z "${ALLOW_DIRTY:-}" ]] && git rev-parse --git-dir >/dev/null 2>&1 && [[ -n "$(git status --porcelain)" ]]; then
  fail "uncommitted changes; commit them first (or set ALLOW_DIRTY=1)"
fi

docker buildx inspect "$BUILDER" >/dev/null 2>&1 || docker buildx create --name "$BUILDER" --driver docker-container >/dev/null

for app in api web renderer; do
  image="$REGISTRY/origo-$app"
  tags=(--tag "$image:$VERSION")
  [[ "$VERSION" == *-* ]] || tags+=(--tag "$image:latest")

  echo "==> $image:$VERSION ($PLATFORMS)"
  docker buildx build \
    --builder "$BUILDER" \
    --platform "$PLATFORMS" \
    --file "docker/$app/Dockerfile" \
    --target prod \
    --label "org.opencontainers.image.version=$VERSION" \
    "${tags[@]}" \
    --push \
    "$app"
done

echo "Released $VERSION. New GHCR packages start private: make them public once under"
echo "https://github.com/phamle21?tab=packages (Package settings -> Change visibility)."
