# Wave 1 Checkbox 8 Code Review

Reviewed: 2026-07-08 21:32 KST (UTC+9)
Scope: favorite toggle endpoint and `favorite=true` item list filter only.
Verdict: PASS
codeQualityStatus: WATCH
recommendation: APPROVE
blockers: []

## Skill Perspective Check

Ran.

- `omo:programming` loaded, including TypeScript reference files: `README.md`, `type-patterns.md`, `data-modeling.md`, `error-handling.md`, `backend-hono.md`.
- `omo:remove-ai-slops` loaded and applied as a review pass over production and test code.
- Programming perspective result: no blocking violation in the favorite endpoint/filter path. Boundary parsing is in `src/worker/item-input.ts`; route/repository responsibilities remain separated; no `any`, non-null assertion, `@ts-ignore`, or broad catch-and-swallow was found in the reviewed favorite path.
- Remove-ai-slops perspective result: no placeholders, fake tests, deletion-only tests, suppressions, broad abstractions, or unnecessary production parsing/normalization for checkbox 8. Two LOW watch items are listed below.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW

1. `src/worker/favorites.test.ts:76` - The tests cover toggle on/off, cross-type `favorite=true` listing, unknown item 404, malformed body 400, and invalid JSON 400, but they do not directly lock the requested "favorite update does not re-run tag auto-application" behavior. Source review shows the endpoint calls `updateFavorite()` (`src/worker/item-routes.ts:75`) and that method updates only `favorite`/`updated_at` before `get()` (`src/worker/item-repository.ts:165`), so this is not a current code bug. It is a regression-coverage gap.

2. `.omo/evidence/wave-1-checkbox-8-dev.stdout.log:1` - The manual dev-server evidence says "Port 5173 is in use, trying another one..." and served on 5174, while `.omo/evidence/wave-1-data-api.txt:441` reports preflight no listener and `.omo/evidence/wave-1-data-api.txt:567` shows cleanup initially still found a listener on 5173. The same evidence later records successful cleanup at `.omo/evidence/wave-1-data-api.txt:586`. I treated this manual QA as secondary evidence and relied on direct source review plus re-run automated tests.

## Scope Fidelity

PASS.

- Favorite remains an item flag, not an item type: `ITEM_TYPES` contains only `prompt`, `image_prompt`, and `repo`.
- No UI drift found: `rg -n "favorite|Favorite" src --glob '!src/worker/**'` returned no matches.
- Endpoint scope is API-only: `/api/items/:id/favorite` is routed from `src/worker/index.ts` to `src/worker/item-routes.ts`.

## API Quality

PASS.

- JSON error contract is used for favorite errors through `ApiError` and `errorResponse`.
- Malformed favorite body on an existing item returns 400:
  - non-boolean `favorite` -> `invalid_item`
  - invalid JSON -> `invalid_json`
- Unknown favorite target returns 404 JSON `not_found`.
- Dedicated favorite endpoint avoids the PATCH update path and does not call tag auto-application.
- `favorite=true` is implemented as a list filter and combines with the repository filter model rather than adding a pseudo item type.

## Test Quality

PASS with LOW watch.

- Failing-first evidence exists in `.omo/evidence/wave-1-data-api.txt:5`; the red run shows `src/worker/favorites.test.ts` had 4 failing tests at `.omo/evidence/wave-1-data-api.txt:33`.
- Behavioral assertions cover the requested success and error surfaces.
- Worker regression coverage passed for items, tags, workflows, and the full worker suite.
- Watch: no direct tag-preservation assertion for the favorite endpoint.

## Slop / Overfit Pass

PASS.

- No deletion-only tests or tests that merely assert a removed behavior.
- No tautological tests against private helper constants.
- No broad abstraction added for favorite handling; the endpoint delegates to the existing repository boundary.
- No hidden magic item type for favorites.
- File sizes checked: `favorites.test.ts` 131 pure LOC, `item-input.ts` 182, `item-repository.ts` 174, `item-routes.ts` 93, `index.ts` 52.

## Regression Interaction

PASS.

- Item tests passed.
- Tag tests passed.
- Workflow tests passed.
- Repository filter composition reads as `favorite = ?` plus tag subquery joined with `AND`, so favorite and tag filtering do not conflict in the reviewed code path.

## Verification Run

All requested commands were run from `D:/vibe-coding/prompt-gallery`.

- `pnpm test:worker -- --run src/worker/favorites.test.ts`: PASS, exit 0. Note: this exact command shape ran all worker tests due the extra `--`; 6 files, 26 tests passed. Supplemental targeted run `pnpm test:worker --run src/worker/favorites.test.ts`: PASS, 1 file, 4 tests passed.
- `pnpm test:worker -- --run src/worker/items.test.ts`: PASS, exit 0; 6 files, 26 tests passed.
- `pnpm test:worker -- --run src/worker/tags.test.ts`: PASS, exit 0; 6 files, 26 tests passed.
- `pnpm test:worker -- --run src/worker/workflows.test.ts`: PASS, exit 0; 6 files, 26 tests passed.
- `pnpm typecheck`: PASS, exit 0; `tsc --noEmit`.
- `pnpm lint`: PASS, exit 0; Biome checked 37 files with no fixes applied.
- `pnpm test:worker`: PASS, exit 0; 6 files, 26 tests passed.
- `Get-NetTCPConnection -LocalPort 5173 -State Listen`: no listener output after verification.

## Manual QA Linkage

The prior manual QA artifact demonstrates the intended curl scenario and malformed-input probe, but contains port-state inconsistency as noted in LOW finding 2. Current review does not depend on that manual proof for approval. The final current port check also found no listener on 5173.

## Residual Risks

- Cloudflare worker test output repeatedly warns that requested compatibility date `2026-07-08` falls back to runtime support `2026-03-10`. This is not introduced by checkbox 8, but it means tests are not running against the exact configured compatibility date.
- The favorite endpoint's no-tag-auto-apply behavior is source-verified, not directly test-verified.

## Cleanup

- No source, package, or plan files were edited by this review.
- Only this review artifact was written.
- No commit was created.
