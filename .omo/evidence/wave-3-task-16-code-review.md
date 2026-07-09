# Wave 3 Task 16 Code Review

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/wave-3-task-16-code-review.md

## Scope

- Goal: Wave 3 Task 16 image prompt preview UI review.
- Reviewed files: requested Task 16 file list plus directly related asset API files needed to verify proxy URLs and item response exposure.
- Input completeness: full diff/evidence/notepad path was not supplied by prompt; reviewer reconstructed scope from `git status`, `git diff`, source reads, and `.omo/evidence/*` artifacts.
- Artifact-only write: this review report is the only file intentionally created.

## Skill Perspective Check

- `omo:remove-ai-slops`: loaded and applied as review lens. Violations found: tests miss required boundary cases, and production/client types still carry internal storage data that the UI does not need.
- `omo:programming`: loaded with TypeScript reference and applied as review lens. Violations found: API/client boundary model exposes persistence internals; edit-mode preview mutation bypasses the explicit save contract.
- No `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, or non-null assertion matches found in `src`/`scripts` TypeScript search. Typecheck and Biome passed.

## Findings

### CRITICAL

- None.

### HIGH

- P1: Item API still serializes the internal object key after preview upload, violating the "no public R2 URL or internal object key in UI/API response display" criterion.
  - Evidence: `src/worker/item-repository.ts:17` selects `image_key`; `src/worker/item-types.ts:16` includes `imageKey` in the public `Item` type; `src/worker/item-types.ts:94` maps `row.image_key` into that item; `src/worker/item-routes.ts:48`, `src/worker/item-routes.ts:84`, and `src/worker/item-routes.ts:94` return repository items directly in JSON responses. The client also expects this field at `src/client/gallery-data.ts:22` and `src/client/gallery-data.ts:163`.
  - Why it matters: after `/api/assets` sets `items.image_key`, `/api/items` and `/api/items/:id` can expose values like `previews/<uuid>.webp`, even though asset upload responses hide `objectKey`. Existing tests only assert upload response secrecy (`src/worker/asset-test-support.ts:65`) and direct client-supplied `imageKey` ignoring (`src/worker/items.test.ts:155`); they do not assert item API responses after an asset is attached.

- P1: Preview upload/remove in edit mode bypasses explicit Save and can discard unsaved form edits.
  - Evidence: edit form renders the live preview mutator for an existing item at `src/client/ItemModalForm.tsx:96`; upload posts immediately at `src/client/ImagePreviewField.tsx:23` and calls `onChanged` at `src/client/ImagePreviewField.tsx:43`; remove posts immediately at `src/client/ImagePreviewField.tsx:51` and calls `onChanged` at `src/client/ImagePreviewField.tsx:60`. The parent refresh handler then resets modal state to detail mode at `src/client/App.tsx:98`; `ItemModal` reacts to the new state by resetting mode/draft at `src/client/ItemModal.tsx:42`.
  - Why it matters: user can click Edit, change title/body/tags, upload or remove a preview, and the image mutation is persisted while unsaved draft edits are dropped without pressing Save. This conflicts with the Wave 2 modal evidence that edit changes persist only on explicit save.

### MEDIUM

- P2: Progress/error/removal status does not fully meet the stated a11y status requirement.
  - Evidence: upload progress uses `aria-live="polite"` but no status role or accessible label at `src/client/ImagePreviewField.tsx:122`; removal text and error text are plain paragraphs at `src/client/ImagePreviewField.tsx:128` and `src/client/ImagePreviewField.tsx:131`.
  - Impact: screen reader announcement of upload/removal/error state is inconsistent. File input labeling and preview `alt` text are otherwise present.

- P2: Browser QA does not verify the 1200px resize/compress requirement or upload error UI.
  - Evidence: implementation caps max edge at `src/client/image-assets.ts:8` and converts via canvas at `src/client/image-assets.ts:12`, but `scripts/qa/browser-image-preview.mjs:147` uploads `test/fixtures/preview.png`, which is only 64x40 and 224 bytes. The browser scenario asserts proxy thumbnail/replacement/removal but has no oversized input, no uploaded dimension/content assertion, and no upload error path.
  - Impact: changing or removing resize/compress logic could still leave current browser QA green.

### LOW

- P3: `uploadImageAsset` parses and returns `contentUrl`, but the UI caller ignores the returned upload object.
  - Evidence: `src/client/image-assets.ts:1` and `src/client/image-assets.ts:122` require `contentUrl`; `src/client/ImagePreviewField.tsx:33` awaits upload only for side effects and then refreshes the item.
  - Impact: small remove-ai-slops concern: production parsing of unused response data adds a second contract the UI does not consume. This is not a blocker if retained intentionally for API contract validation elsewhere.

## Positive Checks

- No placeholder image file usage found in client preview UI; no-image state uses lucide `Image` at `src/client/ImagePreviewField.tsx:78`.
- Worker proxy preview path is used by the UI at `src/client/ImagePreviewField.tsx:75`; asset response proxy URL is built at `src/worker/asset-routes.ts:43`.
- Replace/remove behavior is covered by asset API tests and browser QA for the happy path.
- Task 17 workflow/repo editor scope intrusion was not observed in the reviewed UI changes.
- Wave 2 regression artifacts for gallery, modal CRUD, and copy/favorite report PASS.

## Verification

- `git rev-parse --show-toplevel`: `D:/vibe-coding/prompt-gallery`.
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS, 76 files checked.
- `pnpm test:worker`: PASS, 7 files / 38 tests.
- `git diff --check`: no whitespace errors; line-ending warnings only.
- `node` fixture probe: `test/fixtures/preview.png` is 64x40, 224 bytes.
- Browser QA artifacts inspected:
  - `.omo/evidence/wave-3-image-preview.md`: PASS.
  - `.omo/evidence/wave-3-image-preview-review.md`: PASS.
  - desktop no-image and uploaded-thumbnail screenshots visually inspected.
- Build was not rerun because it writes `dist/`; existing `.omo/evidence/wave-3-assets-workflows.txt` records a build PASS.

## Blockers

- Remove `imageKey`/internal object key from public item JSON contracts, or introduce a public item DTO that exposes only safe preview metadata such as `imageAssetId` or proxy `contentUrl`.
- Align preview upload/remove with the explicit Save contract: either keep preview mutation out of edit mode, make it clearly an immediate detail-mode action, or stage preview changes until item Save without dropping drafts.

