# Debugging Runtime Audit

## Hypothesis 1: dark design tokens remain active in the rendered shell
- Runtime evidence: `browser-design-layout` passed after sampling all three viewports.
- Observed values in `.omo/evidence/f3-prompt-gallery-design-application.md`: `colorScheme: light`, `surfaceBase: #f6f5f4`, `bodyBackground: rgb(246, 245, 244)`.
- Result: rejected. The rendered shell is using the light design contract.

## Hypothesis 2: image prompt cards are still fixed square instead of natural-ratio masonry
- Runtime evidence: `browser-design-layout` uploaded generated wide, square, and tall images through the UI before measuring cards.
- Assertion in evidence: image prompt cards use natural-ratio masonry with rendered heights satisfying `wide < square < tall`.
- Result: rejected. Image prompt cards are not locked to a square frame.

## Hypothesis 3: section-level add/default flows regressed while changing All-tab sections
- Runtime evidence: `gallery-search` browser QA passed.
- Assertion in evidence: All default view shows prompt/image/workflow/repo sections, and section headers expose icon-only add buttons with correct default add targets.
- Result: rejected. Section-level add affordances remain exercised.

## Verification Commands
- `pnpm typecheck`: PASS
- `pnpm lint`: PASS
- `pnpm test`: PASS, 8 files / 40 tests
- `pnpm build`: PASS
- `node scripts/qa/browser-design-layout.mjs --output .omo/evidence/f3-prompt-gallery-design-application.md`: PASS
- `pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/f3-gallery-search.md`: PASS
- `pnpm qa:browser -- --scenario image-preview --output .omo/evidence/f3-image-preview.md`: PASS
- `pnpm qa:browser -- --scenario workflow-repo --output .omo/evidence/f3-workflow-repo.md`: PASS
