# Wave 3 Task 16 Code Review 2

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/wave-3-task-16-code-review-2.md

## Findings

### CRITICAL

- None.

### HIGH

- P1: Required `image-preview` browser QA fails at the explicit-save path.
  - Evidence: `pnpm qa:browser -- --scenario image-preview --output .omo/evidence/wave-3-image-preview-code-review.md` exited 1.
  - Failure artifact: `.omo/evidence/wave-3-image-preview-code-review.md`.
  - Failure text: `Saved thumbnail missing: locator.waitFor: Timeout 5000ms exceeded`.
  - Code path under test: `scripts/qa/browser-image-preview.mjs:111-115` uploads a draft image, clicks `저장`, then requires the gallery card thumbnail to become visible.
  - Why it blocks: this is the core acceptance path for "upload/replace/remove is reflected only after explicit Save." The modal regression is green, but Task 16's own mandatory browser surface is not.

- P1: Staged edit-mode uploads can leak orphan preview assets on cancel or repeated unsaved replacement.
  - Evidence: in draft mode `ImagePreviewField` uploads a real asset without `itemId` (`src/client/ImagePreviewField.tsx:41-44`) and only stores the returned id in draft state (`src/client/ImagePreviewField.tsx:51-55`).
  - Cancel paths close the modal without deleting staged assets: `src/client/ItemModal.tsx:152-154` and `src/client/ItemModalActions.tsx:97-99`.
  - The QA fixture cleanup deletes Task 16 items only (`scripts/qa/browser-image-preview-support.mjs:32-46`), so canceled temporary assets are not cleaned or asserted.
  - Schema confirms this is a real persistent orphan risk: `migrations/0001_initial.sql:58-69` allows `assets.item_id` to be `NULL` and there is no cascade from a canceled draft.
  - Why it blocks: the explicit-save redesign moved item mutation to Save, but still persists upload artifacts before Save. Cancel now preserves the item but can leave R2 objects and metadata behind, creating maintenance burden and false confidence in QA.

### MEDIUM

- None beyond the HIGH findings.

### LOW

- None.

## Scope Reviewed

- Reconstructed scope from `git status`, `git diff`, untracked files, source reads, and prior `.omo/evidence/wave-3-task-16-code-review.md`.
- User did not provide a notepad path or full prepackaged diff; review used the live working tree at `D:/vibe-coding/prompt-gallery`.
- Artifact-only write: this review report plus the user-required QA output artifacts were the only intentional writes by this review.

## Skill Perspective Check

- `omo:remove-ai-slops`: loaded and applied. Violations found: the branch carries a staged-upload lifecycle hole that creates persistent orphan data, and browser QA misses that cleanup invariant.
- `omo:programming`: loaded with `references/typescript/README.md` and applied. Violations found: the current staged asset flow persists boundary data before the user commits the draft and does not model cleanup as part of the typed lifecycle.
- No `as any`, `@ts-ignore`, `@ts-expect-error`, or non-null assertion issue was found in the reviewed Task 16 diff.
- Pure LOC check stayed below 250 for reviewed source/test files.

## Positive Checks

- `/api/items` responses now route through `itemResponse`, omitting `imageKey` and deriving a proxy `contentUrl`: `src/worker/item-types.ts:106-123`, `src/worker/item-routes.ts:47-60`, `src/worker/item-routes.ts:89-110`.
- Client item parsing no longer expects `imageKey`; `contentUrl` is optional/null-tolerant: `src/client/gallery-data.ts:172-177`.
- Edit-mode image remove no longer immediately deletes the original persisted asset; original removal is staged through `imageAssetId: null` and applied by Save.
- Upload progress/removing/error statuses have live/error surfaces in `src/client/ImagePreviewField.tsx:141-155`.
- No placeholder image asset or Task 17 workflow/repo editor scope creep was observed.
- `modal-crud` regression fetch failure is not reproduced in the required rerun.

## Verification

- `pnpm qa:browser -- --scenario image-preview --output .omo/evidence/wave-3-image-preview-code-review.md`: FAIL.
- `pnpm qa:browser -- --scenario modal-crud --output .omo/evidence/wave-3-modal-regression-code-review.md`: PASS.
- `pnpm typecheck && pnpm lint && pnpm test:worker && pnpm build`: PASS.
  - Biome checked 77 files.
  - Worker tests: 7 files, 39 tests passed.
  - Vite build completed for SSR bundle and client bundle.

## Blockers

- Fix the `image-preview` explicit-save browser failure so the required command passes from a clean run.
- Add lifecycle handling for staged draft uploads: cancel and superseded unsaved uploads must delete temporary asset metadata/object or otherwise prevent persistent orphan assets, with QA/test coverage that would fail on the current leak.

Final Status: BLOCK
