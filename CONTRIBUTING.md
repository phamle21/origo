# Contributing to Origo

## Branches

| Branch | Purpose | Merges into |
|---|---|---|
| `main` | Released code only. Every commit is a tagged release (`v1.0.0`). | — |
| `develop` | Integration branch for the next release; always runnable. | `main` via `release/*` |
| `feature/<short-name>` | A new feature, from `develop`. | `develop` |
| `fix/<short-name>` | A bug fix for the next release, from `develop`. | `develop` |
| `release/<version>` | Release preparation (version numbers, changelog, last fixes), from `develop`. | `main` and `develop` |
| `hotfix/<version>` | Urgent fix to a release, from `main`. | `main` and `develop` |

- Open pull requests against `develop` (or `main` for a hotfix); do not push directly to `main` or `develop`.
- Keep a branch to one topic and rebase it on its target before review.
- After merging a `release/*` or `hotfix/*` branch into `main`, tag the merge commit `v<version>` and
  run `scripts/release.sh <version>` to publish the images.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <summary>`, for
example `feat(plan): filter tasks by assignee` or `fix(api): keep the last project manager`.
Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`. Scopes: `api`, `web`,
`renderer`, `docker`, or a feature area such as `plan` or `screen`.

## Before opening a pull request

Run from `docker/`:

```bash
docker compose exec api php artisan test
docker compose exec api vendor/bin/pint --test
docker compose exec web yarn verify:quick
docker compose run --rm --no-deps renderer npm test     # when renderer/ changed
```

- Write code, comments and identifiers in English; route every user-facing text through i18n (vi, ja, en).
- Never commit `.env` files, credentials, real customer data or local overrides.
- Database changes go in new migrations; never edit a migration that has been released.
