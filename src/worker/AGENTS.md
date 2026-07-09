# WORKER KNOWLEDGE BASE

## OVERVIEW

Cloudflare Worker API for Prompt Gallery. Owns routing, D1 persistence, R2 preview storage,
input validation, migration-backed tests, and asset proxying.

## STRUCTURE

```markdown
src/worker/
├── index.ts                         # fetch handler and route dispatch
├── item-*, tag-*, workflow-*         # input, routes, repository, types by domain
├── asset-*                          # upload validation, R2 routes, orphan handling
├── *.test.ts                        # Vitest worker-pool tests
└── apply-migrations.test-support.ts # D1 migration setup for tests
```

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| Route dispatch | `index.ts` | First path segment maps to domain routes. |
| Item CRUD/favorite/tags | `item-routes.ts`, `item-repository.ts`, `item-input.ts` | Handles item/tag joins and image asset references. |
| Tag rename/merge | `tag-routes.ts`, `tag-repository.ts`, `tag-input.ts` | Merge rules live in repository/input layers. |
| Workflow steps | `workflow-routes.ts`, `workflow-repository.ts`, `workflow-input.ts` | Step positions are positive and unique. |
| Asset upload/proxy/delete | `asset-routes.ts`, `asset-repository.ts`, `asset-validation.ts` | R2 object keys and content validation. |
| Export | `export-routes.ts` | Builds the gallery export response. |
| Schema | `../../migrations/0001_initial.sql` | D1 tables and constraints. |
| Tests | `*.test.ts` | Worker-pool tests with migration setup. |

## CONVENTIONS

- Worker env bindings are `DB` for D1, `PREVIEWS` for R2, and `ASSETS` for static assets.
- API errors use `ApiError` with stable codes like `invalid_item`, `invalid_tag`,
  `invalid_workflow`, `invalid_asset`, and `invalid_json`.
- Input modules validate request boundaries; repositories assume validated domain inputs.
- Keep D1 SQL explicit and local to repository modules.
- Tests run with `pnpm test:worker`; config includes only `src/worker/**/*.test.ts`.
- Tests receive migrations through `TEST_MIGRATIONS` from `vitest.worker.config.ts`.

## ANTI-PATTERNS

- Do not bypass Worker proxy for preview images; R2 must remain private.
- Do not accept asset content by extension alone. `asset-validation.ts` checks bytes and type.
- Do not reference `color-db`; current D1 database is `prompt-gallery-db`.
- Do not add schema-affecting behavior without a migration and a worker test.
- Do not let route handlers silently swallow `ApiError` status/code details.

## VERIFY

```bash
pnpm test:worker
pnpm typecheck
pnpm deploy:check
```
