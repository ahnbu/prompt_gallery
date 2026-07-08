# Wave 2 Task 11 Code Review

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/wave-2-task-11-code-review.md

## Review Scope

- Goal: Wave 2 Task 11 gallery shell, search, tabs, tag filters, and cards.
- Criteria: `.omo/plans/prompt-gallery-implementation.md` Task 11, `DESIGN.md`, real API data, QA RED/GREEN evidence integrity.
- Files reviewed: requested client files, browser QA scripts, and Wave 2 evidence files.
- Notepad path: not provided in review input.

## Skill Perspective Check

- Ran: `omo:remove-ai-slops` skill body was loaded and applied as a review lens.
- Ran: `omo:programming` skill body plus TypeScript reference README were loaded and applied as a review lens.
- remove-ai-slops result: violation found in QA coverage. The browser QA records PASS while omitting required assertions, creating false confidence.
- programming result: no untyped escape hatches found in changed TS/TSX, but the custom client API parsing remains a maintainability watch item because it duplicates API response contracts without direct coverage.

## Verification Evidence

- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm test -- --run src/worker/items.test.ts src/worker/tags.test.ts src/worker/workflows.test.ts src/worker/favorites.test.ts`: PASS, 26 tests.
- Evidence inspected: `.omo/evidence/wave-2-core-ui.md`, `.omo/evidence/wave-2-cleanup-gallery-search.md`, Wave 2 screenshots and dev logs.
- Did not run `pnpm qa:browser` because it writes evidence files; the stale default scenario issue is proven from script/source lines.

## CRITICAL

- None.

## HIGH

### P1 - Default browser QA is stale and will fail against the Wave 2 UI

`package.json:15` exposes `pnpm qa:browser` with no required scenario argument, and `scripts/qa/browser-smoke.mjs:130` defaults to `wave-0`. That calls `runWave0`, which still requires a disabled searchbox named `검색 준비 중` and a `.content-empty` region at `scripts/qa/browser-wave0-smoke.mjs:68-77`.

The current Wave 2 UI renders an enabled searchbox labelled `통합검색` at `src/client/App.tsx:81-87` and no `.content-empty` region at `src/client/App.tsx:131-140`. So the default QA command is now inconsistent with the current app surface.

Impact: future wave gates or a plain `pnpm qa:browser` run can fail even when the Task 11 scenario passes, or reviewers may skip the default command because it is known stale. This is a QA regression in a requested review file.

### P1 - `gallery-search` QA does not assert all Task 11 acceptance criteria

Task 11 requires type badges and max 10 visible tags, and its acceptance criteria say the browser scenario asserts type badges: `.omo/plans/prompt-gallery-implementation.md:262` and `.omo/plans/prompt-gallery-implementation.md:265`.

The scenario checks section presence and seeded titles at `scripts/qa/browser-gallery-search.mjs:49-66`, search/unified switching at `scripts/qa/browser-gallery-search.mjs:69-83`, AND tag inclusion/exclusion at `scripts/qa/browser-gallery-search.mjs:85-100`, and one favorite-tab inclusion at `scripts/qa/browser-gallery-search.mjs:121-125`. It never asserts `.type-badge` text/classes, latest-first ordering, or the `visibleTags` max-10 behavior implemented at `src/client/gallery-model.ts:145-146`.

Impact: `.omo/evidence/wave-2-core-ui.md:14-21` records GREEN assertions, but the script does not prove several required behaviors. This is false confidence, not just a missing nice-to-have test.

## MEDIUM

### P2 - Badge styling violates the design token/accent rule

`DESIGN.md` says the app uses one restrained violet accent only for interaction state, and no raw color outside CSS token definitions. The new badge variants introduce raw green, blue, and yellow borders at `src/client/styles.css:266-275`.

Impact: the UI still looks dark and compact, but it drifts from the personal command surface direction and makes type badges a decorative color system outside the documented design tokens.

### P2 - RED evidence is carried forward from the previous output file, not stored as an independent run artifact

`scripts/qa/browser-smoke.mjs:134` reads the existing output file before running, and `scripts/qa/browser-gallery-evidence.mjs:73-104` extracts any prior `## RED Evidence` or `Result: FAIL` section into the new PASS report. The current evidence has RED text at `.omo/evidence/wave-2-core-ui.md:8-12`, but no separate failure artifact path or dev log path for that red run.

Impact: the current failure is not being packaged as success because the script exits nonzero on catch, but the provenance of the RED half is weak and can become stale or hand-edited. For RED/GREEN auditability, the failure evidence should be an explicit artifact, not only carried inside the later GREEN file.

### P2 - Client response parsing duplicates API contracts without focused coverage

`src/client/gallery-data.ts:63-239` implements a custom response parser for `/api/items`, `/api/tags`, and `/api/workflows`. This is boundary parsing, so it is not automatically wrong, but it duplicates worker response types and has no direct unit coverage in this change.

Impact: response shape changes can break the UI through parser drift, while the current browser QA only covers happy-path seeded data. Keep this as a watch item unless the project adds shared schemas or focused parser tests.

## LOW

### P3 - Favorite star is a disabled button used as a status indicator

`src/client/GalleryList.tsx:99-104` renders the favorite star as a disabled button with a title and aria-label. Disabled buttons are not focusable, and tooltip/accessibility behavior is less reliable for a non-interactive status indicator.

Impact: not blocking for Task 11 because favorite mutation is a later flow, but it is a small a11y polish issue before copy/favorite work builds on this surface.

## Scope And Behavior Notes

- Real API data requirement: PASS. `src/client/gallery-data.ts:224-239` fetches `/api/items`, `/api/tags`, and `/api/workflows`; QA fixtures seed through API routes in `scripts/qa/browser-gallery-fixtures.mjs:18-40`.
- Search: implemented through `src/client/gallery-model.ts:127-134`.
- AND tag filtering: implemented through `src/client/gallery-model.ts:110-117`.
- Latest-first: implemented through `src/client/gallery-model.ts:119-124`, but not asserted by browser QA.
- All section to unified result switching: implemented through `src/client/gallery-model.ts:137-143` and `src/client/GalleryList.tsx:10-24`.
- Type badges: implemented at `src/client/GalleryList.tsx:124-149`, but QA does not assert them.
- Visible tag max 10: implemented at `src/client/gallery-model.ts:145-146`, but QA does not assert it.
- A11y labels/tooltips: tabs/search/tag chips mostly satisfy the requirement; favorite star status should be revisited.

## Blockers

- Fix the stale default browser QA path so `pnpm qa:browser` targets a current scenario or otherwise cannot silently run obsolete Wave 0 assertions.
- Expand `gallery-search` QA to assert type badges, latest-first ordering, max 10 visible tags, and meaningful tab filtering rather than only tab visibility.

