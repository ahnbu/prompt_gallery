# Wave 3 Task 15 Gate Review

recommendation: REJECT
reviewedAt: 2026-07-09 KST
mode: read-only gate review; source edits and commits were not performed

## originalIntent

Wave 3 Task 15 was intended to add the Worker-side R2 preview asset API and consistency handling before Task 16 UI work. The plan acceptance criteria require upload, protected content retrieval through `/api/assets/:id/content`, replacement cleanup, item delete cleanup, D1/R2 orphan reporting, invalid upload rejection, and evidence in `.omo/evidence/wave-3-assets-workflows.txt`.

## desiredOutcome

- Client-supplied `imageKey` or public R2 URLs cannot be persisted through item create/update.
- Item deletion succeeds even when associated asset cleanup fails.
- Replacement failure handling cannot leave `items.image_key` pointing to a missing asset object.
- Orphan check reports D1/R2 mismatches and dangling `items.image_key` references.
- Upload validation checks declared content type and magic bytes.
- Tests assert observable cleanup/preservation behavior rather than tautologies.
- API smoke/evidence does not require public R2 URLs or excessive object-key exposure.
- Task 16 preview UI and Task 17 workflow editor scope remains untouched.

## userOutcomeReview

The current state improves most previously blocked areas, but it does not satisfy the replacement consistency outcome. If old asset cleanup fails after the old R2 object has already been deleted but before its D1 `assets` row is deleted, the code rolls `items.image_key` back to the old key. That old key can now point to a missing R2 object, so the item preview can break after a failed replacement.

This is not caught by the current regression test, which only simulates `env.PREVIEWS.delete(oldKey)` throwing before the old object is removed.

## blockers

### P1 - Replacement cleanup can still create a dangling `items.image_key`

Evidence:
- `src/worker/asset-routes.ts:75` deletes the old R2 object first.
- `src/worker/asset-routes.ts:76` deletes the old D1 asset metadata second.
- `src/worker/asset-routes.ts:145` sets the item to the new object key before old cleanup.
- `src/worker/asset-routes.ts:148-151` catches any old-cleanup failure and rolls the item back to `oldObjectKey`.

Failure class:
- If line 75 succeeds and line 76 fails, line 151 can restore the item to an object key whose R2 object was already deleted.
- Result: `items.image_key` points to a key that is missing in R2. This directly violates prior BLOCK item 3.

Test gap:
- `src/worker/assets.test.ts:54-70` mocks old R2 delete to throw. That protects the pre-delete failure path only.
- It does not cover the post-R2-delete / D1-metadata-delete failure path that can create the dangling reference.

### P2 - API smoke evidence claims object keys are not emitted but does not verify that

Evidence:
- `scripts/qa/api-smoke-assets.mjs:91-93` records `internal object key not emitted`.
- `src/worker/asset-types.ts:1-12` defines `Asset` with `objectKey`.
- `src/worker/asset-types.ts:43-56` maps `object_key` into `asset.objectKey`.
- `src/worker/asset-routes.ts:159` returns `Response.json({ asset }, { status: 201 })`.

The new gate evidence no longer logs `previews/...`, which is good:
- `.omo/evidence/wave-3-assets-api-gate.txt`
- `.omo/evidence/wave-3-assets-api-gate-dev.stdout.log`
- `.omo/evidence/wave-3-assets-api-gate-dev.stderr.log`

However, the smoke does not assert absence of `asset.objectKey`, and the production response still includes it. This is an evidence-quality issue and potentially a contract issue if the intended client-visible contract is asset id plus proxy content URL only.

## previousBlockRecheck

| # | Criterion | Status | Evidence |
|---|---|---|---|
| 1 | item create/update arbitrary `imageKey` blocked | ✅ Pass | `src/worker/item-input.ts` no longer reads `imageKey`; `src/worker/item-repository.ts` creates with `NULL` and no longer patches `image_key`; `src/worker/items.test.ts:155-178` covers public URL and object-key input. |
| 2 | item delete cleanup failure does not fail item delete API | ✅ Pass | `src/worker/item-routes.ts:96-106` deletes item first, then calls best-effort cleanup; `src/worker/asset-routes.ts:79-94` catches object and metadata cleanup failures; `src/worker/assets.test.ts:97-108` verifies API returns 200 despite forced R2 cleanup failure. |
| 3 | replacement old asset cleanup failure cannot create dangling `image_key` | ❌ Fail | `src/worker/asset-routes.ts:75-76` can delete old R2 before D1 metadata failure; rollback at `src/worker/asset-routes.ts:151` can restore item to a missing object. Current test only covers pre-delete R2 failure. |
| 4 | orphan-check reports R2/D1 mismatch and dangling item references | ✅ Pass | `src/worker/asset-orphans.ts:31-37`; `src/worker/assets.test.ts:128-141`. |
| 5 | upload validation checks content type and magic bytes | ✅ Pass | `src/worker/asset-validation.ts:6-27` and magic signatures at `src/worker/asset-validation.ts:53-63`; tests at `src/worker/assets.test.ts:144-176`. |
| 6 | tautological asset cleanup assertion replaced | ✅ Pass | `src/worker/assets.test.ts:111-126` now creates the pre-existing R2 object and asserts it remains while the temporary collision upload is removed. |
| 7 | API smoke/evidence avoids public R2 URL / excessive key requirement | ⚠️ Partial | Gate evidence contains no public R2 URL or `previews/...`, but `scripts/qa/api-smoke-assets.mjs:91-93` makes an unverified “object key not emitted” claim while API responses still include `asset.objectKey`. |
| 8 | Task 16 UI / Task 17 workflow editor scope not touched | ✅ Pass | Changed source files are Worker asset/item API and QA scripts/tests only; no `src/client` UI files or workflow editor files are modified. |

## slopOverfitReview

- `omo:remove-ai-slops` and `omo:programming` were loaded and applied directly.
- The D1 collision cleanup test is no longer tautological because it creates and preserves `previews/existing-collision.png`.
- The replacement rollback test is underfit: it validates only `bucket.delete` throwing before deletion, not the important partial old-cleanup sequence where R2 delete succeeds and D1 metadata delete fails.
- The smoke evidence has assertion prose that is not backed by an assertion; this is misleading evidence and should be corrected.
- No unnecessary Task 16/17 production extraction was found.

## commandEvidence

All required/optional commands that were possible were run:

- `pnpm test:worker -- --run src/worker/assets.test.ts`: PASS; Vitest worker pool reported 7 files, 37 tests passed.
- `pnpm qa:fixtures`: PASS; generated `test/fixtures/preview.png` at 224 bytes.
- `pnpm qa:api -- --scenario assets --output .omo/evidence/wave-3-assets-api-gate.txt`: PASS.
- `pnpm verify:cleanup -- --output .omo/evidence/wave-3-cleanup-assets-gate.md`: PASS; 0 listeners on port 5173.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`: PASS.

Observed warning:
- Worker test runtime warns that installed Cloudflare Workers Runtime supports compatibility date `2026-03-10` while config requests `2026-07-08`; tests still passed under fallback runtime.

## checkedArtifactPaths

- `.omo/plans/prompt-gallery-implementation.md`
- `.omo/evidence/wave-3-task-15-code-review.md`
- `.omo/evidence/wave-3-assets-api-gate.txt`
- `.omo/evidence/wave-3-cleanup-assets-gate.md`
- `.omo/evidence/wave-3-assets-api-gate-dev.stdout.log`
- `.omo/evidence/wave-3-assets-api-gate-dev.stderr.log`
- `.omo/evidence/wave-3-assets-workflows.txt`
- `scripts/qa/api-smoke.mjs`
- `scripts/qa/api-smoke-assets.mjs`
- `scripts/qa/api-smoke-support.mjs`
- `scripts/qa/create-fixtures.mjs`
- `scripts/qa/verify-cleanup.mjs`
- `src/worker/asset-routes.ts`
- `src/worker/asset-repository.ts`
- `src/worker/asset-orphans.ts`
- `src/worker/asset-validation.ts`
- `src/worker/asset-types.ts`
- `src/worker/asset-test-support.ts`
- `src/worker/assets.test.ts`
- `src/worker/item-input.ts`
- `src/worker/item-repository.ts`
- `src/worker/item-routes.ts`
- `src/worker/item-types.ts`
- `src/worker/items.test.ts`
- `migrations/0001_initial.sql`
- `wrangler.jsonc`
- `package.json`

## evidenceGaps

- No task-specific notepad path was supplied. The discovered `.omo/ulw-research/20260708-123423/NOTEPAD.md` is storage/deployment research, not Task 15 gate evidence.
- No updated post-fix code review report was found. `.omo/evidence/wave-3-task-15-code-review.md` is the previous BLOCK report and contains stale line references for issues that have since been changed.
- No supplied manual QA matrix was found; the review reconstructed manual QA from the plan and required commands.
- Existing dirty file `.omo/evidence/wave-1-checkbox-8-dev.stdout.log` is unrelated Wave 1 evidence noise and was not used as approval evidence.

## finalRecommendation

REJECT
