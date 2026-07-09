# Wave 3 Task 15 Final Gate Review 2

reviewedAt: 2026-07-09 KST
mode: read-only final gate review; no source/test/product edits and no commit. This report artifact is the only intentional file write.
recommendation: APPROVE

## findings

- P0: none.
- P1: none.
- P2: none.
- P3: none.

## blockers

None.

## originalIntent

Wave 3 Task 15 is the Worker-side R2 preview asset API and consistency layer before later UI/workflow work. The user expected upload, protected content retrieval through `/api/assets/:id/content`, replacement cleanup, item-delete cleanup, D1/R2 orphan reporting, invalid upload rejection, and QA evidence without public/internal storage-key leakage.

## desiredOutcome

- Text evidence for asset workflows/API does not expose `objectKey`, `previews/`, `r2.dev`, `storage.googleapis`, or `githubusercontent`.
- `src/worker/asset-routes.ts` converts expected `ApiError` instances to HTTP responses and rethrows unknown errors instead of swallowing them as catch-all `server_error`.
- Replacement old-asset cleanup failures cannot leave `items.image_key` pointing at a missing/deleted object.
- Client-provided arbitrary/public `imageKey` values cannot be persisted through item create/patch.
- Task 16 UI and Task 17 workflow scope remain untouched.

## userOutcomeReview

APPROVE. The latest state satisfies the user-visible outcome for Task 15.

Asset API responses now expose asset metadata plus protected `contentUrl`, not internal `objectKey`: `src/worker/asset-routes.ts:15-24`, `src/worker/asset-routes.ts:34-44`, and `src/worker/asset-routes.ts:140`. Worker/API smoke assertions also check serialized responses for absence of `objectKey` and `previews/`: `src/worker/asset-test-support.ts:62-68` and `scripts/qa/api-smoke-assets.mjs:43-54`.

The asset route error boundary now only serializes `ApiError`; unknown errors are logged and rethrown: `src/worker/asset-routes.ts:205-210`. No asset-route catch-all `server_error` response remains. The remaining `server_error` strings are environment-unavailable responses in `src/worker/index.ts`, outside the requested asset-route criterion.

Replacement cleanup no longer rolls an item back to an old key. `uploadAsset()` sets the item to the new object key and then calls best-effort cleanup for the old key: `src/worker/asset-routes.ts:136-139`. `deleteAssetObjectAndMetadata()` catches both old R2 delete and old metadata delete failures: `src/worker/asset-routes.ts:86-100`. The regression test covers both old R2 cleanup failure and old metadata failure after old R2 deletion while asserting `items.image_key` remains on the new object: `src/worker/assets.test.ts:67-110`.

Client-provided `imageKey` storage bypass is blocked at the boundary. `parseCreateItem()` and `parsePatchItem()` no longer read `imageKey`, and `ItemRepository.create()` stores `NULL` while update no longer patches `image_key`: `src/worker/item-input.ts:139-209`, `src/worker/item-repository.ts:88-148`. The regression test submits both a public URL and an internal-looking key and asserts persisted item responses keep `imageKey: null`: `src/worker/items.test.ts:155-178`.

Scope review found no changed `src/client` files and no changed workflow implementation/test files. The current status only shows Worker asset/item API, QA scripts, and evidence artifacts in the Task 15 area, plus an unrelated pre-existing Wave 1 evidence file.

## finalRecheckItems

1. Evidence leak scan: PASS. Required grep was rerun under Git Bash with the exact target shape and returned ripgrep exit 1 as the no-match success condition. A broader scan over final-gate dev stdout/stderr also returned no matches.
2. Asset route error handling: PASS. `ApiError` is converted via `errorResponse`; unknown errors are rethrown.
3. Replacement cleanup dangling risk: PASS. Old cleanup is best-effort and cannot enter the new-upload rollback catch; tests cover old R2 failure and old metadata failure after old R2 deletion.
4. Arbitrary/public item `imageKey` storage bypass: PASS. Create/patch parsing ignores client `imageKey`; repository does not persist it from item input; regression covers public URL and internal-looking key.
5. Task 16/17 scope: PASS. `git status --short src/client src/worker/workflow-routes.ts src/worker/workflow-repository.ts src/worker/workflow-types.ts src/worker/workflows.test.ts` returned no changed files.

## slopOverfitReview

- Loaded and applied `omo:remove-ai-slops`, `omo:programming`, and `programming/references/typescript/README.md`.
- Direct slop pass found no unresolved excessive/useless tests, deletion-only tests, tautological tests, implementation-mirroring tests, or unnecessary production extraction in the Task 15 changes.
- The replacement metadata-cleanup test is not tautological: it forces `AssetRepository.deleteByObjectKey()` to fail after old R2 deletion, then checks the item remains on the new object, the old R2 object is missing, and old metadata remains for orphan detection.
- The item `imageKey` bypass test is behavior-facing: it submits API payloads with a public URL and internal-looking key, then asserts persisted API output remains server-managed.
- Escape-hatch scan over target files found no `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`, empty catch, or catch-and-swallow pattern.
- Pure LOC check over target changed files is under the 250-line programming threshold; highest reviewed counts were `src/worker/asset-routes.ts` 188, `src/worker/assets.test.ts` 184, and `scripts/qa/api-smoke-support.mjs` 184.
- Code review report coverage check: `.omo/evidence/wave-3-task-15-code-review.md` explicitly includes `Skill-Perspective Check` for `omo:remove-ai-slops` and `omo:programming`, and calls out tautological-test/slop criteria. Its BLOCK findings are stale relative to the latest code and were directly rechecked above.

## commandEvidence

- `pnpm test:worker -- --run src/worker/assets.test.ts`: PASS. Vitest reported 7 worker test files and 38 tests passed.
- `pnpm qa:api -- --scenario assets --output .omo/evidence/wave-3-assets-api-final-gate.txt`: PASS. Evidence file reports live upload, protected content retrieval, replacement cleanup, explicit delete, and cleanup assertions passed.
- `pnpm verify:cleanup -- --output .omo/evidence/wave-3-cleanup-assets-final-gate.md`: PASS. Evidence reports port 5173 listeners: 0.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`: PASS. `tsc --noEmit`, Biome over 73 files, 38 worker tests, and Vite build all exited 0.
- `rg "objectKey|previews/|r2\.dev|storage\.googleapis|githubusercontent" .omo/evidence/wave-3-assets-workflows.txt .omo/evidence/wave-3-assets-api*.txt`: PASS as no-match under Git Bash. A first PowerShell attempt failed because the wildcard path was passed through as an invalid Windows path; it was not used as approval evidence.

## checkedArtifactPaths

- `.omo/plans/prompt-gallery-implementation.md`
- `.omo/evidence/wave-3-assets-workflows.txt`
- `.omo/evidence/wave-3-assets-api-final-gate.txt`
- `.omo/evidence/wave-3-assets-api-final-gate-dev.stdout.log`
- `.omo/evidence/wave-3-assets-api-final-gate-dev.stderr.log`
- `.omo/evidence/wave-3-cleanup-assets-final-gate.md`
- `.omo/evidence/wave-3-task-15-code-review.md`
- `.omo/evidence/wave-3-task-15-gate-review.md`
- `.omo/evidence/wave-3-task-15-final-gate-review.md`
- `scripts/qa/api-smoke.mjs`
- `scripts/qa/api-smoke-assets.mjs`
- `scripts/qa/api-smoke-support.mjs`
- `src/worker/asset-routes.ts`
- `src/worker/asset-repository.ts`
- `src/worker/asset-orphans.ts`
- `src/worker/asset-test-support.ts`
- `src/worker/asset-types.ts`
- `src/worker/asset-validation.ts`
- `src/worker/assets.test.ts`
- `src/worker/item-input.ts`
- `src/worker/item-repository.ts`
- `src/worker/item-routes.ts`
- `src/worker/item-types.ts`
- `src/worker/items.test.ts`
- `src/worker/index.ts`

## exactEvidenceGaps

- No updated standalone post-fix code review report was found; existing code-review and prior gate-review artifacts are historical BLOCK/REJECT evidence. This is not treated as a blocker because this final gate directly rechecked each stale finding against current code and required command evidence.
- No separate manual QA matrix was supplied. This review reconstructed manual QA from the plan, live API smoke evidence, cleanup evidence, and Worker API tests.
- `pnpm verify:cleanup` verifies process cleanup/listeners, not asset orphan semantics. Asset orphan/dangling behavior is instead covered by `src/worker/assets.test.ts` and the required worker test run.
- `src/client` still contains pre-existing imageKey form/detail code, but `git status` shows no Task 16 UI changes in this review scope and the Worker API now ignores client-provided imageKey values.

## finalRecommendation

APPROVE
