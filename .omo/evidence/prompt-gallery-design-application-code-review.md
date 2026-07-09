# Prompt Gallery Design Application Code Review

## Verdict

- codeQualityStatus: BLOCK
- recommendation: REQUEST_CHANGES
- reportPath: `.omo/evidence/prompt-gallery-design-application-code-review.md`
- blockers:
  - `.omo/evidence/f3-gallery-search-desktop-all.png` shows the many-tag prompt card overflowing out of its square card and into the next section area.
  - `scripts/qa/browser-gallery-evidence.mjs:60` and `.omo/evidence/f3-gallery-search.md:24` still claim image prompt preview frames are "square", while current code only asserts bounded preview frames.

## Skill-Perspective Check

- `omo:remove-ai-slops`: ran. Violation remains: the gallery-search PASS evidence contains stale/misleading assertion prose, which creates false confidence.
- `omo:programming`: ran with `references/typescript/README.md` and `references/code-smells.md`. Violation remains in test relevance/maintainability: current QA counts tag chips but does not assert containment, so a visible overflow regression passes.

## Verification Performed

- Inspected current `git status --short`, `git diff --stat`, `git diff --name-status`, tracked full diff, and untracked QA scripts.
- Inspected supplied evidence:
  - `.omo/evidence/f3-prompt-gallery-design-application.md`
  - `.omo/evidence/f3-gallery-search.md`
  - `.omo/evidence/f3-image-preview.md`
  - `.omo/evidence/f3-workflow-repo.md`
  - `.omo/evidence/f4-prompt-gallery-design-application.md`
  - `.omo/evidence/remove-ai-slops-prompt-gallery-design-application.md`
- Opened representative screenshots:
  - `.omo/evidence/f3-prompt-gallery-design-application-desktop-all.png`
  - `.omo/evidence/f3-prompt-gallery-design-application-mobile-all.png`
  - `.omo/evidence/f3-gallery-search-desktop-all.png`
- Recomputed pure LOC for touched source/QA files:
  - `scripts/qa/browser-gallery-search.mjs` 209
  - `scripts/qa/browser-gallery-search-support.mjs` 93
  - `scripts/qa/browser-image-preview.mjs` 182
  - `scripts/qa/browser-image-preview-support.mjs` 241
  - `scripts/qa/browser-design-layout.mjs` 129
  - `scripts/qa/browser-design-layout-api.mjs` 146
  - `scripts/qa/browser-design-layout-browser.mjs` 200
  - `src/client/GalleryList.tsx` 186
- Ran current checks:
  - `pnpm typecheck`: PASS
  - `pnpm lint`: PASS, 98 files checked
  - `pnpm test`: PASS, 8 files / 40 tests
  - `pnpm build`: PASS
  - `git diff --check -- . ':!.omo'`: PASS with line-ending warnings only

## Findings

### CRITICAL

None.

### HIGH

1. Many-tag prompt cards visibly overflow the square card.
   - References: `src/client/styles/cards.css:25`, `src/client/styles/cards.css:279`, `src/client/GalleryCard.tsx:197`.
   - Evidence: `.omo/evidence/f3-gallery-search-desktop-all.png`.
   - Impact: square non-image cards are now fixed-height, but tag chips still wrap freely. The many-tag fixture spills outside the card and into the next section, violating the design/UI constraint that visible elements must not overlap incoherently.

2. Gallery-search PASS evidence still contains stale square-preview wording.
   - References: `scripts/qa/browser-gallery-evidence.mjs:60`, `.omo/evidence/f3-gallery-search.md:24`.
   - Current assertion: `scripts/qa/browser-gallery-search-support.mjs:80` exports `assertBoundedImagePreview`, and `scripts/qa/browser-gallery-search.mjs:45` uses it.
   - Impact: the PASS artifact claims compact image prompt preview frames are square even though the implementation and design now use bounded/natural-ratio behavior. This is misleading success evidence.

### MEDIUM

None.

### LOW

None.

## Non-Blocking Checks

- QA script split is below the 250 pure-LOC ceiling and imports resolve under `pnpm lint`.
- No deletion-only tests, `.only`, `.skip`, `as any`, `as unknown`, `@ts-ignore`, or `@ts-expect-error` blockers were found in the reviewed scope.
- Scope fidelity evidence is now adequate for forbidden backend/package/deploy files; no blocker found there.
