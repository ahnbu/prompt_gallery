# Wave 3 Task 15 Final Gate Review

recommendation: REJECT
reviewedAt: 2026-07-09 KST
mode: read-only final gate review; no production/test/source edits and no commit. This review artifact is the only file intentionally added.

## blockers

### P2 - QA evidence still exposes internal asset key details

- `.omo/evidence/wave-3-assets-workflows.txt:119`, `:183`, `:247`, `:311`, `:359`, `:374`, `:544`, `:598`, `:604`, `:655`, `:866`, `:949`, `:998` contain internal preview-key log output.
- `.omo/evidence/wave-3-assets-workflows.txt:660-685` contains failed assertion output showing the forbidden response field name and a raw asset response with an internal object key.
- The new final smoke evidence is clean, but the latest Task 15 QA evidence set still contains the forbidden field/prefix. The user-visible outcome "QA evidence does not expose internal keys" is therefore not satisfied.

### P2 - Previous asset API error-handling review item remains open

- Previous code review: `.omo/evidence/wave-3-task-15-code-review.md:45-46` flagged asset routes catching unknown errors and returning JSON `server_error` instead of following the item/tag/workflow route pattern of rethrowing unknown errors.
- Current code still has the same behavior at `src/worker/asset-routes.ts:209-214`: unknown errors are caught, `asset_route_failed` is logged, and `serverError()` is returned.
- No updated code review report supersedes the previous BLOCK report. The existing report still says `codeQualityStatus: BLOCK` and `recommendation: REQUEST_CHANGES` at `.omo/evidence/wave-3-task-15-code-review.md:3-4`.

## originalIntent

Wave 3 Task 15 is the Worker-side R2 preview asset API and consistency layer before Task 16 UI work. The intended scope is upload, protected content retrieval through `/api/assets/:id/content`, replacement cleanup, item delete cleanup, D1/R2 orphan reporting, invalid upload rejection, and QA evidence for those behaviors.

## desiredOutcome

- Replacement cleanup failure must not leave `items.image_key` dangling, including old R2 delete success followed by old metadata delete failure.
- External API responses and QA evidence must not expose the internal asset response field or internal preview object-key prefix; internal repository/test source may still use those keys.
- Prior P1/P2/P3 asset API review items must be closed in current code and supported by fresh review evidence.
- Task 16 UI and Task 17 workflow editor scope must remain untouched.

## userOutcomeReview

The main replacement consistency bug is fixed in current code: `src/worker/asset-routes.ts:140-143` keeps the new item image key, and `deleteAssetObjectAndMetadata()` at `src/worker/asset-routes.ts:90-104` swallows old object/metadata cleanup failures after logging. The regression at `src/worker/assets.test.ts:89-110` covers old R2 delete success followed by old metadata delete failure, and asserts the item remains pointed at the new asset.

Current external API response shape is also fixed: `assetResponse()` at `src/worker/asset-routes.ts:15-24` and `:38-48` omits the internal key field and returns `contentUrl`; `src/worker/asset-test-support.ts:62-68` and `scripts/qa/api-smoke-assets.mjs:43-54` assert the forbidden field/prefix is absent from response bodies.

However, approval is blocked because the latest QA evidence set still contains internal-key exposure in `.omo/evidence/wave-3-assets-workflows.txt`, and one prior P2 code review item remains present in production code.

## finalRecheck

| Criterion | Status | Evidence |
|---|---:|---|
| Replacement old cleanup no longer creates dangling `items.image_key` | ✅ Pass | `src/worker/asset-routes.ts:90-104`, `:140-143`; `src/worker/assets.test.ts:89-110`; required worker test passed. |
| Current external API response hides forbidden field/prefix | ✅ Pass | `src/worker/asset-routes.ts:15-24`, `:38-48`; final smoke grep found no matches in `.omo/evidence/wave-3-assets-api-final-gate.txt` or its dev logs. |
| QA evidence hides forbidden field/prefix | ❌ Fail | `.omo/evidence/wave-3-assets-workflows.txt` still contains raw internal-key logs and failed raw API response output at the lines listed under blockers. |
| Previous P1 items closed | ✅ Pass | Arbitrary item `imageKey` input ignored in `src/worker/item-input.ts` and `src/worker/item-repository.ts`; item delete cleanup is best-effort via `src/worker/item-routes.ts:96-106` and `src/worker/asset-routes.ts:90-104`. |
| Previous P2/P3 items closed | ❌ Fail | Upload validation and tautological test issues are fixed, but prior P2 catch-all asset route handling remains at `src/worker/asset-routes.ts:209-214`. |
| Task 16 UI / Task 17 workflow scope untouched | ✅ Pass | `git status --short src/client src/worker/workflow-* src/worker/workflows.test.ts` returned no changed files. |

## slopOverfitReview

- Loaded and applied `omo:remove-ai-slops`, `omo:programming`, and `programming/references/typescript/README.md`.
- Direct test review found the new replacement metadata-cleanup regression is not tautological: it forces `AssetRepository.deleteByObjectKey()` to fail only after old R2 deletion, then checks the item points at the new object and the old R2 object is missing.
- Direct response-shape tests are meaningful: both worker tests and smoke assert on serialized response bodies before consulting internal DB state.
- Remaining slop/maintenance risk: the old code review report is stale and still BLOCK, and the production catch-all in `asset-routes.ts` remains an unresolved prior P2 finding.

## commandEvidence

- `pnpm test:worker -- --run src/worker/assets.test.ts`: PASS; 7 test files, 38 tests passed. Worker runtime emitted compatibility-date fallback warnings.
- `pnpm qa:api -- --scenario assets --output .omo/evidence/wave-3-assets-api-final-gate.txt`: first attempt failed because the local dev server did not become ready within 30s; rerun PASS and produced the final evidence file.
- `pnpm verify:cleanup -- --output .omo/evidence/wave-3-cleanup-assets-final-gate.md`: PASS; port 5173 listeners: 0.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`: PASS; Biome checked 73 files, 38 worker tests passed, Vite build completed.

## checkedArtifactPaths

- `.omo/evidence/wave-3-task-15-code-review.md`
- `.omo/evidence/wave-3-task-15-gate-review.md`
- `.omo/evidence/wave-3-assets-api-final-gate.txt`
- `.omo/evidence/wave-3-assets-api-final-gate-dev.stdout.log`
- `.omo/evidence/wave-3-assets-api-final-gate-dev.stderr.log`
- `.omo/evidence/wave-3-assets-workflows.txt`
- `.omo/evidence/wave-3-cleanup-assets-final-gate.md`
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

## evidenceGaps

- No updated post-fix code review report was found; the only discovered code review report remains `REQUEST_CHANGES`.
- No separate manual QA matrix was supplied; review reconstructed QA coverage from source tests and required CLI evidence.
- `.omo/evidence/wave-3-assets-workflows.txt` appears to include stale failed runs and raw responses. It is still present in the latest evidence set and violates the no-internal-key-evidence criterion.
- The final API smoke evidence is clean, but it does not erase the conflicting existing Task 15 workflow evidence.

## finalRecommendation

REJECT
