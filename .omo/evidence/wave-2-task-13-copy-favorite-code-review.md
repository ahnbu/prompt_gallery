# Wave 2 Task 13 Copy Favorite Code Review

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reviewedAtKST: 2026-07-09

## Scope

- Goal: Wave 2 Task 13 copy body only and favorite UX review.
- Acceptance source: `.omo/plans/prompt-gallery-implementation.md` Task 13.
- Reviewed files: `src/client/App.tsx`, `src/client/GalleryCard.tsx`, `src/client/GalleryList.tsx`, `src/client/ItemModal.tsx`, `src/client/ItemModalActions.tsx`, `src/client/item-actions-model.ts`, `src/client/item-mutations.ts`, `src/client/styles.css`, `scripts/qa/browser-copy-favorite.mjs`, `scripts/qa/browser-copy-favorite-evidence.mjs`, `scripts/qa/browser-modal-crud.mjs`, related evidence.
- Browser QA was not rerun because the requested review is read-only and `pnpm qa:browser` writes markdown, dev logs, and screenshots. Existing evidence and QA script logic were inspected directly.

## Skill Perspective Check

- `omo:remove-ai-slops` loaded and applied as a review lens: no deletion-only tests, tautological tests, prompt-string pinning, or body-copy implementation mirroring found. Clipboard QA asserts actual text equality via `navigator.clipboard.readText()`.
- `omo:programming` loaded, and `references/typescript/README.md` consulted for TypeScript review criteria: no `any`, `@ts-ignore`, `@ts-expect-error`, non-null assertions, or empty/swallowed catches found in the reviewed TypeScript client files.
- Diff does violate the programming/a11y perspective through nested interactive controls and unguarded keyboard bubbling in `GalleryCard`.

## Findings

### CRITICAL

- None.

### HIGH

- P1: Card copy/favorite buttons are not keyboard-isolated from the card detail shortcut.
  - Evidence: `src/client/GalleryCard.tsx:41` renders the whole card as `role="button"`; `src/client/GalleryCard.tsx:47` opens detail on `Enter` or `Space`; `src/client/GalleryCard.tsx:61` and `src/client/GalleryCard.tsx:77` render nested copy/favorite `<button>` controls without stopping key events.
  - Impact: when keyboard focus is on the copy or favorite button, `Enter`/`Space` bubbles to the parent card handler and opens the detail modal. This breaks the requested a11y behavior for copy/favorite controls and can make keyboard copy/favorite activation perform an extra, unintended navigation action.
  - Why QA missed it: `scripts/qa/browser-copy-favorite.mjs:165` and `scripts/qa/browser-copy-favorite.mjs:178` use mouse `.click()` paths, where the child handlers call `event.stopPropagation()`. The keyboard path is untested.
  - Required fix: remove the nested interactive pattern, or guard the card open handlers so events originating from buttons/links do not trigger card open. Prefer a semantic non-button card container with explicit controls and a dedicated detail-open target.

### MEDIUM

- P2: Copy action has a clear accessible label but no user-visible or ARIA status for success/failure.
  - Evidence: `src/client/GalleryCard.tsx:61` writes clipboard text directly; `src/client/ItemModal.tsx:119` writes from the modal; `src/client/ItemModalActions.tsx:24` renders the modal copy button. None updates visible text, `aria-live`, or an error state.
  - Impact: the requested a11y status is incomplete. Clipboard denial or failure is silent to users, and successful copy is not announced.

### LOW

- P3: Browser QA does not prove favorite tab coverage for every supported favorite item type.
  - Evidence: `scripts/qa/browser-copy-favorite.mjs:178` favorites a prompt card and `scripts/qa/browser-copy-favorite.mjs:216` favorites another prompt via modal. It seeds an image prompt and repo but only uses image for copy and repo for negative copy exposure.
  - Mitigating evidence: `src/client/gallery-model.ts:97` filters favorite entries generically for all `Item` records, and `src/worker/favorites.test.ts:99` covers prompt, image prompt, and repo at the API level.
  - Risk: future UI regressions could hide repo or image-prompt favorites without the copy-favorite browser scenario failing.

## Verified Behaviors

- Copy UI is limited to prompt and image prompt bodies through `canCopyItemBody()` in `src/client/item-actions-model.ts:3`.
- Repo and workflow cards do not expose copy UI in the reviewed source.
- Card and modal favorite toggles use the same parent `onFavoriteChange` path and the same `/api/items/:id/favorite` mutation.
- Favorite tab filtering uses current refreshed gallery state rather than optimistic local-only state.
- No optimistic update mismatch was found; state refresh occurs after mutation. The remaining failure path risk is loading state/error handling, not stale optimistic state.

## Verification Commands

- `pnpm typecheck` PASS.
- `pnpm lint` PASS.
- `pnpm test` PASS: 6 files, 26 tests.
- Existing evidence inspected:
  - `.omo/evidence/wave-2-copy-favorite-fail.md`
  - `.omo/evidence/wave-2-copy-favorite.md`
  - `.omo/evidence/wave-2-copy-favorite-review.md`
  - `.omo/evidence/wave-2-core-ui.md`
  - `.omo/evidence/wave-2-modal-crud.md`

## Blockers

- Fix the `GalleryCard` keyboard bubbling/nested interactive control issue before approval.

