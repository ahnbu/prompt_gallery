---
slug: prompt-gallery-design-application
status: drafting
intent: clear
pending-action: write .omo/plans/prompt-gallery-design-application.md
approach: Apply the revised light DESIGN.md to the main gallery UI after the parallel UI-feedback work lands, with tests-first browser assertions for square non-image cards, max-four desktop columns, and natural-ratio masonry image prompt cards.
---

# Draft: prompt-gallery-design-application

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
- C1 | DESIGN.md matches the latest accepted card rules, including max-four square non-image cards and natural-ratio masonry image prompt cards | active | DESIGN.md:115-123, DESIGN.md:225-232
- C2 | Main gallery grid applies the design contract without replacing current data flows or section actions | active | src/client/GalleryList.tsx:77-190, src/client/GalleryCard.tsx:63-163
- C3 | Image prompt cards preserve real image proportions in a masonry section instead of fixed square/height thumbnails | active | src/client/ImagePreviewField.tsx:92-165, src/client/styles/cards.css:123-140
- C4 | Browser QA proves layout behavior on desktop/mobile with real fixture data | active | package.json:6-18, scripts/qa/browser-gallery-search.mjs, scripts/qa/browser-image-preview.mjs

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
- Image prompt cards should be masonry, not square, and card height should follow the actual image ratio | Default adopted from user's latest clarification | User explicitly asked whether a long image should grow taller; this supersedes the current square-forward DESIGN.md text | Reversible by editing DESIGN.md and card CSS
- Extreme portrait images need a thumbnail safety cap while the detail/modal view remains uncropped | Use a conservative card thumbnail max-height, but assert that normal tall images are taller than wide/square cards | Prevents one pathological image from consuming the whole viewport without hiding the full asset from detail view | Reversible and tokenized
- Deployment is out of scope | Do not deploy in this plan | User said deployment is already complete and execution will happen after other sessions finish | Reversible by a separate deploy plan
- Commit is out of scope unless explicitly requested | Plan includes commit strategy only | Global rule requires cp skill for commit and no implicit commit | Reversible by user approval

## Findings (cited - path:lines)
- Current `DESIGN.md` already defines the light Notion-inspired surface, warm paper canvas, white cards, and blue action color. Evidence: DESIGN.md:5-13, DESIGN.md:27-43.
- Current `DESIGN.md` still says card grid is `repeat(auto-fit, minmax(220px, 1fr))` and image prompt media is square-forward. This conflicts with the latest user requirement for desktop max-four square general cards and masonry image cards with natural heights. Evidence: DESIGN.md:115-123, DESIGN.md:225-232.
- Current CSS still defines dark tokens in `base.css`, so the written design contract is not fully applied in product CSS. Evidence: src/client/styles/base.css:1-24.
- Current grid can create more than four columns or wide stretched cards because it uses `repeat(auto-fit, minmax(min(100%, 240px), 1fr))`. Evidence: src/client/styles/cards.css:1-5.
- Current compact image preview is forced to `aspect-ratio: 1 / 1` and `img { height: 100%; object-fit: cover; }`, so long images cannot grow taller in gallery cards. Evidence: src/client/styles/cards.css:123-140.
- Current `GalleryList` already has section-level add actions for prompt, image prompt, workflow, and repo sections, so the design application must preserve that work instead of recreating it. Evidence: src/client/GalleryList.tsx:77-190.
- Current `GalleryCard` already renders prompt/repo/workflow through the same `.gallery-card` shell, so the plan should normalize the card primitive rather than split new components. Evidence: src/client/GalleryCard.tsx:63-163.
- Available verification scripts include `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and browser QA entry points. Evidence: package.json:6-18.

## Decisions (with rationale)
- Plan path: `.omo/plans/prompt-gallery-design-application.md`.
- Execution should begin by re-reading `git status` and the latest changed UI files because other sessions may have completed UI/QA work before this plan runs.
- `DESIGN.md` must be corrected before CSS implementation so future UI work does not reintroduce square image thumbnails.
- Use tests-after/TDD hybrid: add browser assertions before or alongside CSS changes so the worker can see the current mismatch fail, then pass after implementation.
- Use CSS-first changes where possible; TypeScript changes are limited to data attributes/classes needed to distinguish image sections or masonry behavior.
- Do not add new dependencies. Use existing React, Lucide, CSS, and Playwright tooling.

## Scope IN
- Update `DESIGN.md` to encode: desktop max-four non-image card columns, square prompt/workflow/repo cards, and masonry image prompt cards with natural image-ratio heights.
- Apply the light/warm design tokens to product CSS.
- Convert prompt/workflow/repo gallery cards to a shared square card primitive.
- Make image prompt gallery cards use a masonry layout and natural image aspect ratio.
- Preserve section-level add buttons and existing CRUD/data behavior.
- Add/extend browser QA fixtures and assertions for layout, image ratio, and responsive behavior.
- Run static, unit, build, browser, and visual QA commands and save evidence under `.omo/evidence/`.

## Scope OUT (Must NOT have)
- No deployment, Worker changes, D1/R2 schema change, or production data migration.
- No fake DOM-only example cards. Any examples must come from real saved fixture/sample data.
- No new package, UI framework, icon library, marketing hero, pricing section, or Notion brand copy.
- No broad refactor of item models, modal CRUD, worker APIs, or storage.
- No direct commit. If commit is later requested, use the `cp` skill.

## Open questions
- None blocking. The latest user decision resolves the image card fork: image prompt cards should not be fixed-height; long images should create taller masonry cards.

## Approval gate
status: approved-for-plan
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
User requested: "이를 반영하여 plan문서를 작성하라." This authorizes writing the plan artifact only, not implementation.

## Local Metis gap review
- Constraint conflict found: DESIGN.md currently says square image prompt media; user latest requirement says natural-ratio masonry. The plan must update DESIGN.md first.
- Scope creep risk found: applying the design could accidentally include deployment or backend changes. The plan excludes them explicitly.
- Parallel work risk found: other sessions may already touch `src/client/App.tsx`, gallery CSS, or QA scripts. The first todo requires rebaseline and no reverting unrelated changes.
- Acceptance gap found: visual preference cannot be proven by unit tests alone. The plan requires browser geometry assertions plus screenshots at desktop/tablet/mobile.
