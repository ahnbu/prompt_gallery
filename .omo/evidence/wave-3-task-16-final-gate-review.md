# Wave 3 Task 16 Final Gate Review

recommendation: REJECT
reportPath: .omo/evidence/wave-3-task-16-final-gate-review.md
reviewTime: 2026-07-09 KST
mode: read-only gate review, artifact write only

## blockers

### P1 - Required `image-preview` final-gate command is not deterministic PASS

- Required command rerun: `pnpm qa:browser -- --scenario image-preview --output .omo/evidence/wave-3-image-preview-final-gate.md`
- Result: exit 1.
- Evidence: `.omo/evidence/wave-3-image-preview-final-gate.md` now records `Result: FAIL` and `Failure: fetch failed`.
- Dev log evidence: `.omo/evidence/wave-3-image-preview-final-gate-dev.stdout.log` shows Vite ready at `http://127.0.0.1:5173/`; stderr is empty.
- Earlier PASS evidence existed at the same path, but a direct required rerun failed. The user asked for deterministic PASS, so a later failure blocks approval even if earlier artifacts passed.

### P1 - Required Wave 2 `modal-crud` regression command failed once and only passed on a separate rerun

- Required command: `pnpm qa:browser -- --scenario modal-crud --output .omo/evidence/wave-3-modal-regression-final-gate.md`
- Result: exit 1.
- Evidence: `.omo/evidence/wave-3-modal-regression-final-gate.md` records `Result: FAIL` and `Failure: fetch failed`.
- Separate rerun evidence `.omo/evidence/wave-3-modal-regression-final-gate-rerun.md` records PASS, but the exact required artifact remains a failed run. That supports flakiness, not stable regression coverage.

### P2 - Code review evidence is stale/incomplete for final approval

- Checked reports: `.omo/evidence/wave-3-task-16-code-review.md` and `.omo/evidence/wave-3-task-16-code-review-2.md`.
- Both reports contain `omo:remove-ai-slops` and `omo:programming` skill-perspective notes.
- The latest report still has `codeQualityStatus: BLOCK` / `recommendation: REQUEST_CHANGES`.
- The report does not provide a final updated overfit/slop checklist after the later cleanup fixes. My direct pass did not find a new production slop blocker, but the review-report evidence remains unsupported for approval.

## originalIntent

Wave 3 Task 16 was intended to add image prompt preview UI: image prompt tab/gallery preview, browser-side resize/compress to 1200px max edge, upload progress/error UI, Worker-proxy preview display, replace/remove preview, and lucide no-image state without placeholder image files.

The user's final gate focus added these criteria:

- `image-preview` deterministically passes and saved card thumbnails appear.
- edit-mode staged upload cancel and pre-save replacement clean temporary assets.
- `/api/items`, DOM, and evidence do not expose `imageKey`, `objectKey`, internal object-key prefixes, or public storage URLs.
- explicit Save remains the persistence boundary, including cancel negative behavior.
- upload progress/error/remove a11y status remains.
- 1200px resize/compress and invalid upload error UI remain verified.
- Wave 2 regressions remain green.

## desiredOutcome

The user should receive an APPROVE only if the current working tree and fresh artifacts prove Task 16 is stable end to end: preview upload/replace/remove works through explicit Save, temporary uploaded assets are cleaned on cancel/replacement, storage internals remain hidden, and Wave 2 browser flows still pass from fresh required commands.

## userOutcomeReview

Not satisfied. The source now appears to implement much of the intended behavior:

- `src/worker/item-types.ts` exposes `itemResponse()` that omits internal `imageKey` from public item JSON and derives a protected `/api/assets/:id/content` URL.
- `src/client/ItemModal.tsx` cleans a staged draft image asset on edit cancel when the staged id differs from the original item asset.
- `src/client/ImagePreviewField.tsx` cleans superseded staged uploads before Save and stages remove operations through draft state.
- `scripts/qa/browser-image-preview.mjs` covers invalid upload, oversized generated images, explicit Save, cancel cleanup, replacement cleanup, protected thumbnail src, and no-internal-key checks.

However, the actual user-visible outcome is still not approvable because the fresh mandatory browser commands did not all pass. The core `image-preview` final-gate command failed on rerun, and the Wave 2 modal regression failed once before passing on a separate rerun.

## directSkillPass

Loaded/consulted:

- `omo:remove-ai-slops`: `C:/Users/ahnbu/.codex/plugins/cache/sisyphuslabs/omo/4.16.0/skills/remove-ai-slops/SKILL.md`
- `omo:programming`: `C:/Users/ahnbu/.codex/plugins/cache/sisyphuslabs/omo/4.16.0/skills/programming/SKILL.md`
- TypeScript reference: `.../programming/references/typescript/README.md`
- Code smells reference: `.../programming/references/code-smells.md`

Direct overfit/slop pass:

- Excessive/useless tests: no clear blocker. The image-preview browser QA drives real UI and API behavior, not just mocked internals.
- Deletion-only/removal-only tests: no blocker. Negative storage-key assertions are part of the explicit privacy/storage contract.
- Tautological cleanup tests: no blocker found in current Task 16 browser QA. It observes deleted temporary asset content returning 404 after cancel and superseded replacement.
- Implementation-mirroring tests: partial risk only. `waitForItemImageAsset()` uses the public `/api/items` `imageAssetId`, but it pairs that with user-visible card thumbnail/no-image assertions.
- Unnecessary production extraction/parsing/normalization: no approval blocker found. `parseAssetUpload()` validates a returned `contentUrl` that the UI does not directly use, but this is a small API contract validation cost, not a high-risk slop issue.
- Oversized modules: no file exceeded 250 pure LOC. Warning band: `scripts/qa/browser-image-preview.mjs` 246 pure LOC and `src/client/ItemModal.tsx` 245 pure LOC.

## checkedArtifactPaths

- `.omo/plans/prompt-gallery-implementation.md`
- `.omo/evidence/wave-3-task-16-code-review.md`
- `.omo/evidence/wave-3-task-16-code-review-2.md`
- `.omo/evidence/wave-3-image-preview-final-gate.md`
- `.omo/evidence/wave-3-image-preview-final-gate-dev.stdout.log`
- `.omo/evidence/wave-3-image-preview-final-gate-dev.stderr.log`
- `.omo/evidence/wave-3-modal-regression-final-gate.md`
- `.omo/evidence/wave-3-modal-regression-final-gate-rerun.md`
- `.omo/evidence/wave-3-gallery-regression-final-gate.md`
- `.omo/evidence/wave-3-copy-regression-final-gate.md`
- `.omo/evidence/wave-3-cleanup-image-preview-final-gate.md`
- `.omo/evidence/wave-3-cleanup-image-preview-final-gate-after-failure.md`
- `scripts/qa/browser-smoke.mjs`
- `scripts/qa/browser-image-preview.mjs`
- `scripts/qa/browser-image-preview-support.mjs`
- `scripts/qa/browser-modal-fixtures.mjs`
- `src/client/ImagePreviewField.tsx`
- `src/client/ItemModal.tsx`
- `src/client/ItemModalActions.tsx`
- `src/client/ItemModalForm.tsx`
- `src/client/gallery-data.ts`
- `src/client/item-modal-model.ts`
- `src/client/item-mutations.ts`
- `src/worker/item-input.ts`
- `src/worker/item-repository.ts`
- `src/worker/item-routes.ts`
- `src/worker/item-types.ts`
- `src/worker/items.test.ts`
- `src/worker/asset-routes.ts`
- `src/worker/assets.test.ts`

## verificationResults

- `pnpm qa:browser -- --scenario image-preview --output .omo/evidence/wave-3-image-preview-final-gate.md`: FAIL on direct git_bash rerun, `fetch failed`.
- `pnpm qa:browser -- --scenario modal-crud --output .omo/evidence/wave-3-modal-regression-final-gate.md`: FAIL, `fetch failed`.
- `pnpm qa:browser -- --scenario modal-crud --output .omo/evidence/wave-3-modal-regression-final-gate-rerun.md`: PASS on separate rerun.
- `pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-3-gallery-regression-final-gate.md`: PASS.
- `pnpm qa:browser -- --scenario copy-favorite --output .omo/evidence/wave-3-copy-regression-final-gate.md`: PASS.
- `pnpm verify:cleanup -- --output .omo/evidence/wave-3-cleanup-image-preview-final-gate.md`: PASS.
- `pnpm verify:cleanup -- --output .omo/evidence/wave-3-cleanup-image-preview-final-gate-after-failure.md`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS, Biome checked 77 files.
- `pnpm test:worker`: PASS, 7 files / 39 tests.
- `pnpm build`: PASS.
- `git diff --check`: PASS, line-ending warnings only.

## exposureReview

- Final-gate evidence scan over required outputs found no runtime leak values. The only match was the assertion sentence in `.omo/evidence/wave-3-image-preview-final-gate.md` naming the forbidden fields/prefixes.
- Source review found public item responses now use `itemResponse()` and do not serialize internal object keys.
- `scripts/qa/browser-image-preview-support.mjs` directly checks `/api/items` and DOM for `imageKey`, internal object-key prefix, and public storage URLs. It does not explicitly check the `objectKey` field name there, but source-level `itemResponse()` makes that field unavailable in item JSON.

## evidenceGaps

- No separate notepad path was supplied. Scope was reconstructed from live working tree, plan, evidence files, and source.
- No final approving code review artifact exists after the latest fixes; the latest Task 16 code review artifact still requests changes.
- The exact required `image-preview` and `modal-crud` final-gate artifacts are failed runs, so the evidence set cannot support APPROVE.
- Failure text is generic `fetch failed`; dev stdout shows Vite readiness and stderr is empty, so the current artifacts do not localize whether the flake is harness readiness, API startup, browser fetch timing, or app runtime behavior.

## finalRecommendation

REJECT
