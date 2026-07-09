# Wave 3 Task 15 R2 Asset API Code Review

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/wave-3-task-15-code-review.md

## Skill-Perspective Check

- Ran: `omo:remove-ai-slops` was read and applied to production/test review.
- Ran: `omo:programming` was read, plus `references/typescript/README.md`.
- Result: diff violates both perspectives.
  - `programming`: broad catch/cleanup swallowing and arbitrary string storage at a boundary leave invalid states representable.
  - `remove-ai-slops`: at least one test assertion is tautological and does not increase confidence.

## CRITICAL / P0

None found.

## HIGH / P1

1. `POST/PATCH /api/items` can still store and return arbitrary `imageKey`, including a public R2 URL.
   - References: `src/worker/item-input.ts:167`, `src/worker/item-input.ts:178`, `src/worker/item-input.ts:194`, `src/worker/item-repository.ts:100`, `src/worker/item-repository.ts:137`, `src/worker/items.test.ts:120`
   - Why it matters: Task 15 requires no public R2 URL storage/return and content through the Worker proxy. The asset API avoids public R2 URLs, but the existing item API still accepts any string and persists it to `items.image_key`. This bypasses asset metadata, can store `https://...r2...`, and returns it on item reads.
   - Regression risk: existing item API now participates in asset cleanup via `item.imageKey`, so arbitrary values are no longer harmless display metadata.

2. Item delete asset cleanup is not fully best-effort.
   - References: `src/worker/item-routes.ts:101`, `src/worker/item-routes.ts:105`, `src/worker/asset-routes.ts:98`, `src/worker/asset-routes.ts:107`, `src/worker/asset-routes.ts:108`, `src/worker/item-routes.ts:111`
   - Why it matters: `deleteObject()` catches R2 delete failures, but `deleteByObjectKey()` is awaited without a catch. If metadata cleanup fails after the item row is already deleted, `DELETE /api/items/:id` throws instead of returning success with a logged cleanup failure. This violates the Task 15 best-effort item-delete cleanup requirement.

3. Replacement can leave `items.image_key` pointing at a deleted new object when old-asset cleanup fails.
   - References: `src/worker/asset-routes.ts:132`, `src/worker/asset-routes.ts:143`, `src/worker/asset-routes.ts:144`, `src/worker/asset-routes.ts:147`, `src/worker/asset-routes.ts:148`, `src/worker/asset-routes.ts:149`
   - Why it matters: upload replacement updates the item to the new object key before deleting the old object/metadata. If old cleanup throws, the catch deletes the newly uploaded object and metadata but does not restore the item image key. Result: D1 item metadata can reference an R2 object that no longer exists.

## MEDIUM / P2

1. Orphan reporting does not cover item-level dangling image references.
   - References: `src/worker/asset-orphans.ts:13`, `src/worker/asset-orphans.ts:27`, `src/worker/asset-orphans.ts:28`, `src/worker/item-repository.ts:137`
   - Why it matters: `findAssetOrphans()` only compares `assets.object_key` with R2 keys. It does not report `items.image_key` values that have no asset row or missing R2 object, which is exactly the inconsistency created by arbitrary item `imageKey` input or partial replacement failure.

2. Upload validation trusts client-supplied MIME type and buffers before size rejection.
   - References: `src/worker/asset-routes.ts:42`, `src/worker/asset-routes.ts:43`, `src/worker/asset-routes.ts:50`, `src/worker/asset-routes.ts:120`, `src/worker/asset-routes.ts:121`
   - Why it matters: unsupported declared content types are rejected before R2 write, but a non-image body can be uploaded with `type: image/png`. Size is validated after `arrayBuffer()`, so oversized bodies are fully buffered before rejection.

3. Asset API error handling differs from existing Worker API route pattern.
   - References: `src/worker/asset-routes.ts:212`, `src/worker/asset-routes.ts:216`, `src/worker/asset-routes.ts:217`, `src/worker/item-routes.ts:111`, `src/worker/tag-routes.ts:55`, `src/worker/workflow-routes.ts:51`
   - Why it matters: item/tag/workflow routes convert `ApiError` and rethrow unknown errors. Asset routes catch all unknown errors and return JSON `server_error`, hiding unexpected defects and diverging from the existing contract.

## LOW / P3

1. The D1 failure cleanup test contains a tautological R2 assertion.
   - References: `src/worker/assets.test.ts:197`, `src/worker/assets.test.ts:202`, `src/worker/assets.test.ts:209`, `src/worker/assets.test.ts:210`
   - Why it matters: the test inserts a D1 row for `previews/existing-collision.png` but never creates that R2 object, then asserts the R2 object is null. That assertion would pass before the action and does not prove cleanup behavior.

2. The QA smoke records private object keys in evidence.
   - References: `scripts/qa/api-smoke-assets.mjs:47`, `scripts/qa/api-smoke-assets.mjs:95`, `.omo/evidence/wave-3-assets-api.txt:9`
   - Why it matters: no public R2 URL was found, but the smoke explicitly requires and logs `previews/...` keys. If the intended client contract is proxy endpoint only, evidence should avoid normalizing storage-key exposure.

## Verification

- `pnpm test:worker -- --run src/worker/assets.test.ts`: PASS. It ran 7 worker test files, 33 tests.
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm verify:cleanup`: PASS.
- `pnpm verify:scope`: FAIL because the current plan state no longer matched Wave 0 assumptions; the generated evidence change was restored and is not used as approval evidence.
- Inspected evidence: `.omo/evidence/wave-3-assets-workflows.txt`, `.omo/evidence/wave-3-assets-api.txt`.

## Scope Control

- No Task 16 UI image-preview implementation files were changed in the reviewed diff.
- No Task 17 workflow editor implementation files were changed in the reviewed diff.
- Changes are limited to Worker asset API, item delete integration, QA smoke support, and evidence.

## Blockers

- Block arbitrary `imageKey` storage/return through item create/patch or convert it to a validated asset/proxy contract.
- Make item-delete asset cleanup truly best-effort, including metadata cleanup failures.
- Rework replacement failure handling so partial old-asset cleanup cannot leave `items.image_key` pointing at a deleted new object.
