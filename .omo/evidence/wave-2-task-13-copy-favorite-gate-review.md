# Wave 2 Task 13 Copy/Favorite Gate Review

recommendation: APPROVE
reviewedAtKST: 2026-07-09 00:45 KST
mode: read-only gate review; no source edits or commits

## originalIntent

Wave 2 Task 13 after-fix gate review: verify that copy-body-only and favorite UX satisfy the previous BLOCK findings without regressing modal CRUD or gallery search.

## desiredOutcome

- Card copy/favorite controls do not open the detail modal from keyboard Enter/Space.
- Card and modal copy buttons expose success/failure status that is visible and available to assistive tech.
- Official `copy-favorite` browser QA validates prompt, image_prompt, and repo favorites in the Favorite tab.
- Clipboard writes exactly item body text only, not title, tags, notes, or metadata.
- `modal-crud` and `gallery-search` remain green.

## recommendation

APPROVE

## blockers

None.

## findings

No P0-P3 blockers found in the current on-disk state.

## userOutcomeReview

The shipped current state satisfies the user-visible outcome. `GalleryCard` no longer makes the entire card an interactive parent; the detail action is isolated to the `card-open` button, while copy/favorite are sibling buttons. The official QA drives keyboard Enter for copy and keyboard Space for favorite, then verifies no dialog opens. Copy success is rendered through `<output>`, which Playwright resolves by `role="status"` in both card and modal flows. Failure status is also present in production code through the same status output branch.

Clipboard assertions read the real browser clipboard and compare exact body strings from fixtures. The prompt fixture includes a separate title and notes, and the source writes only `item.body`; modal copy also writes only the item body. Favorite tab coverage now includes prompt, image_prompt, repo, plus a modal favorite path.

## checkedArtifactPaths

- `.omo/evidence/wave-2-copy-favorite-gate.md` - PASS.
- `.omo/evidence/wave-2-modal-crud-gate-after-copy.md` - PASS after two consecutive reruns of the same official command.
- `.omo/evidence/wave-2-core-ui-gate-after-copy.md` - PASS.
- `.omo/evidence/wave-2-cleanup-copy-favorite-gate.md` - PASS, port 5173 listeners: 0.
- `.omo/evidence/wave-2-task-13-copy-favorite-code-review.md` - inspected; stale pre-fix BLOCK report, not used as success evidence.
- `.omo/evidence/wave-2-copy-favorite-review-adversarial-all-types.md` - inspected supporting prior adversarial coverage for all favorite item types.

## checkedSourcePaths

- `src/client/GalleryCard.tsx`
- `src/client/ItemModal.tsx`
- `src/client/ItemModalActions.tsx`
- `src/client/item-actions-model.ts`
- `src/client/gallery-model.ts`
- `src/client/item-mutations.ts`
- `scripts/qa/browser-copy-favorite.mjs`
- `scripts/qa/browser-copy-favorite-fixtures.mjs`
- `scripts/qa/browser-copy-favorite-evidence.mjs`
- `scripts/qa/browser-smoke.mjs`

## directEvidence

- Keyboard isolation: `scripts/qa/browser-copy-favorite.mjs` focuses the card copy button, presses Enter, checks clipboard, and asserts no dialog. It then focuses the favorite button, presses Space, and asserts no dialog.
- No nested interactive card: `src/client/GalleryCard.tsx` renders `<article>` as a non-interactive container and uses a separate `card-open` button for detail navigation.
- Status: card and modal copy status render `<output className="copy-status">복사됨</output>` or `복사 실패`; QA confirms `getByRole("status")`.
- Favorite tab all types: the official scenario favorites prompt, image_prompt, and repo through UI paths and asserts all are visible in Favorite tab.
- Clipboard body-only: production code calls `navigator.clipboard.writeText(item.body)` for card copy and body-only write for modal detail copy; QA compares `navigator.clipboard.readText()` to fixture body strings.
- Regression: `gallery-search`, `modal-crud`, cleanup, typecheck, lint, test, and build are green in this gate run.

## commandResults

- `pnpm qa:browser -- --scenario copy-favorite --output .omo/evidence/wave-2-copy-favorite-gate.md`: PASS.
- `pnpm qa:browser -- --scenario modal-crud --output .omo/evidence/wave-2-modal-crud-gate-after-copy.md`: first run failed with `fetch failed`, then the same command passed twice consecutively. The final evidence file is PASS.
- `pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-2-core-ui-gate-after-copy.md`: PASS.
- `pnpm verify:cleanup -- --output .omo/evidence/wave-2-cleanup-copy-favorite-gate.md`: PASS after the final QA run.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build`: PASS. Test result: 6 files, 26 tests passed. Build completed.

## slopAndProgrammingPass

Loaded and applied `omo:remove-ai-slops` and `omo:programming` with TypeScript reference criteria.

- No excessive/useless tests found.
- No deletion-only or removal-only tests found.
- No tautological tests found.
- No implementation-mirroring clipboard test found; QA reads the real browser clipboard and API state.
- No unnecessary production extraction, parsing, or normalization found in the reviewed Task 13 surface.
- No `any`, `as any`, `@ts-ignore`, `@ts-expect-error`, non-null assertion, enum, or empty/swallowed catch found in the reviewed TypeScript files.
- Size check: `GalleryCard.tsx` 184 pure LOC, `ItemModal.tsx` 217, `ItemModalActions.tsx` 107, `browser-copy-favorite.mjs` 236, `browser-smoke.mjs` 205.

## exactEvidenceGaps

- Existing code review report `.omo/evidence/wave-2-task-13-copy-favorite-code-review.md` is stale and still records the previous BLOCK. It does explicitly include the required skill-perspective/slop coverage, but its findings are not current after the fix. This gate review independently rechecked the current source and new evidence.
- One initial `modal-crud` run failed with `fetch failed` after the app started and with empty stderr. The same official command then passed twice consecutively, and final cleanup found no port listener. Treated as a non-blocking transient observation, not a reproduced regression.

Final Status: APPROVE
