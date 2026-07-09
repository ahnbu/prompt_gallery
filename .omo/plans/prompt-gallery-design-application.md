# prompt-gallery-design-application - Work Plan

## TL;DR (For humans)
**What you'll get:** 메인 갤러리가 밝은 Notion형 디자인으로 바뀌고, 프롬프트·Workflow·레포는 같은 정사각형 카드 리듬으로 정리됩니다. 이미지 프롬프트는 고정 정사각형이 아니라 실제 이미지 비율에 따라 높이가 달라지는 masonry 카드로 적용됩니다.

**Why this approach:** 이미 사용자가 확인한 미리보기 방향을 기준으로 하되, 먼저 디자인 문서의 충돌을 고친 다음 QA가 카드 폭·열 수·이미지 높이를 수치로 검증하게 합니다.

**What it will NOT do:** 배포, 백엔드, D1/R2, 데이터 마이그레이션은 하지 않습니다. 병행 세션에서 만든 섹션별 추가 버튼이나 QA 작업을 되돌리지 않습니다. 가짜 DOM-only 예시 카드나 새 UI 라이브러리를 추가하지 않습니다.

**Effort:** Medium
**Risk:** Medium - 병행 세션의 UI 변경과 masonry 레이아웃 QA가 겹칠 수 있습니다.
**Decisions to sanity-check:** 이미지 카드의 극단적으로 긴 세로 이미지에는 카드 썸네일 안전 상한을 둘 수 있지만, 일반 세로 이미지는 실제 비율대로 더 길어져야 합니다.

Your next move: 이 계획으로 실행을 시작할지, 실행 전 고정밀 리뷰를 먼저 돌릴지 결정하면 됩니다. Full execution detail follows below.

---

> TL;DR (machine): Medium risk/effort design-application plan: update DESIGN.md contract, apply light tokens, square non-image card grid max four columns, natural-ratio masonry image cards, and browser evidence.

## Scope
### Must have
- `DESIGN.md`가 최신 결정과 일치한다: 프롬프트·Workflow·레포는 정사각형 카드, 데스크톱 wide 기준 최대 4열, 이미지 프롬프트는 실제 이미지 비율 기반 masonry.
- 현재 product CSS가 `DESIGN.md`의 warm paper/light surface/blue action token을 사용한다.
- All 탭의 섹션별 구조와 섹션별 추가 버튼은 유지한다.
- 프롬프트·Workflow·레포는 같은 `.gallery-card` 계열 카드 primitive로 표시된다.
- 이미지 프롬프트 섹션은 masonry 레이아웃이며, wide/square/tall fixture 이미지의 카드 높이가 서로 다르게 측정된다.
- 모바일에서는 한 열 또는 사용 가능한 좁은 카드 레이아웃으로 깨짐 없이 표시된다.
- 모든 검증은 agent가 실행 가능한 명령과 evidence 파일로 남긴다.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- 배포 금지. 사용자가 배포는 완료됐다고 했으므로 `wrangler deploy`나 deploy 설정 변경은 이 계획 범위가 아니다.
- Worker API, D1/R2 schema, 저장 데이터 구조, 이미지 업로드 계약 변경 금지.
- 병행 세션 변경 되돌리기 금지. 실행 전 `git status`와 관련 파일 diff를 보고 최신 상태 위에서만 작업한다.
- 새 dependency, 새 UI framework, 새 icon library 추가 금지.
- marketing hero, pricing/card marketing section, Notion 브랜드 문구 도입 금지.
- fake DOM-only example card 금지. 예시가 필요하면 실제 fixture/sample item으로 생성한다.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after with red-first browser assertions where practical. Framework: existing Vitest, Biome, Vite build, and Playwright QA scripts.
- Static commands:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
- Browser/visual evidence:
  - `pnpm qa:fixtures`
  - `pnpm qa:browser`
  - targeted scripts under `scripts/qa/browser-gallery-search.mjs`, `scripts/qa/browser-image-preview.mjs`, and any new local QA script added for this plan.
- Evidence: `.omo/evidence/ui-<N>-prompt-gallery-design-application.<ext>`
- Required geometry checks:
  - Desktop 1280px: non-image cards render no more than 4 cards in a row.
  - Prompt/Workflow/Repo cards are square within a small pixel tolerance.
  - Image cards do not share a fixed thumbnail height; tall fixture image card is measurably taller than wide/square fixture cards.
  - Mobile 390px: cards do not overflow horizontally and text/buttons do not overlap.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1: rebaseline, contract/test preparation, and fixture/assertion work.
- Wave 2: CSS/TSX implementation for design tokens, card grid, square cards, and image masonry.
- Wave 3: full verification, screenshots, and final compliance review.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | None | 2, 3, 4, 5, 6, 7 | None |
| 2 | 1 | 5, 6, 7 | 3 |
| 3 | 1 | 4, 5, 6, 7 | 2 |
| 4 | 3 | 7 | 5 |
| 5 | 1, 2 | 6, 7 | 4 |
| 6 | 1, 2, 3 | 7 | 5 |
| 7 | 4, 5, 6 | Final verification | None |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Rebaseline the current branch after parallel sessions finish.
  What to do / Must NOT do: Run `git rev-parse --show-toplevel`, `git status --short --branch --untracked-files=all`, and inspect diffs for `DESIGN.md`, `src/client/**`, `scripts/qa/**`, `_temp/**`, and `.omo/**`. Record which files are already changed by other work. Do not revert, delete, or overwrite unrelated changes.
  Parallelization: Wave 1 | Blocked by: None | Blocks: 2, 3, 4, 5, 6, 7
  References (executor has NO interview context - be exhaustive): `DESIGN.md:115-123`, `DESIGN.md:225-232`, `src/client/GalleryList.tsx:77-190`, `src/client/GalleryCard.tsx:63-163`, `src/client/styles/cards.css:1-16`, `src/client/styles/base.css:1-24`
  Acceptance criteria (agent-executable): `.omo/evidence/ui-1-prompt-gallery-design-application.md` contains repo root, branch, full dirty-file list, and a note that deployment/commit are out of scope.
  QA scenarios (name the exact tool + invocation): happy: `git status --short --branch --untracked-files=all > .omo/evidence/ui-1-prompt-gallery-design-application.status.txt`; failure: if files outside this plan would need edits, stop and record the blocker in `.omo/evidence/ui-1-prompt-gallery-design-application.md`.
  Commit: N | docs(plan): no commit in execution plan

- [ ] 2. Correct `DESIGN.md` so the contract matches the latest card decision.
  What to do / Must NOT do: Update only the relevant Grid, Gallery Card, Image Prompt Card, and Reference Translation Notes sections. Replace square-forward image prompt rules with natural-ratio masonry rules. Encode desktop max-four non-image columns and square prompt/workflow/repo cards. Do not reintroduce dark Linear design or marketing-page language.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 5, 6, 7
  References (executor has NO interview context - be exhaustive): `DESIGN.md:5-21`, `DESIGN.md:59-67`, `DESIGN.md:115-132`, `DESIGN.md:200-239`, `DESIGN.md:279-287`, `_temp/preview-design-main_20260709_01.html`
  Acceptance criteria (agent-executable): `rg -n "max-four|maximum 4|masonry|natural aspect|actual image|aspect-ratio: 1 / 1|square-forward" DESIGN.md` shows explicit max-four/masonry/natural-ratio rules and no remaining instruction that compact image prompt gallery cards must be fixed square.
  QA scenarios (name the exact tool + invocation): happy: `rg -n "masonry|actual image ratio|maximum 4|square" DESIGN.md > .omo/evidence/ui-2-prompt-gallery-design-application.txt`; failure: `rg -n "Image prompt media: square|gallery cards stay square-forward" DESIGN.md` must return no active requirement.
  Commit: Y | docs(design): clarify prompt gallery card layout contract

- [ ] 3. Add or extend real fixture-backed browser assertions for the target layout.
  What to do / Must NOT do: Extend existing QA scripts or add a focused script under `scripts/qa/` that creates/uses real saved fixture data: at least 4 prompt cards, 2 workflow cards, 2 repo cards, and at least 3 image prompt cards with wide, square, and tall preview images. Do not validate fake DOM-only cards.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 4, 6, 7
  References (executor has NO interview context - be exhaustive): `package.json:6-18`, `scripts/qa/browser-gallery-search.mjs`, `scripts/qa/browser-gallery-fixtures.mjs`, `scripts/qa/browser-image-preview.mjs`, `scripts/qa/browser-image-preview-support.mjs`, `src/client/GalleryList.tsx:140-190`, `src/client/GalleryCard.tsx:63-163`
  Acceptance criteria (agent-executable): A browser QA command fails before implementation or logs current mismatch, and after implementation verifies: first desktop row has at most 4 non-image cards, prompt/workflow/repo cards are square, and image cards have distinct heights according to fixture ratios.
  QA scenarios (name the exact tool + invocation): happy: `pnpm qa:fixtures && node scripts/qa/<new-or-updated-layout-script>.mjs --output .omo/evidence/ui-3-prompt-gallery-design-application.md`; failure: temporarily force the assertion threshold to an impossible value in local review or document the pre-implementation mismatch output in the evidence file.
  Commit: Y | test(ui): cover prompt gallery card layout

- [ ] 4. Add image masonry-specific assertions.
  What to do / Must NOT do: Verify the image prompt section independently from the general card grid. Assertions must compare rendered card/image bounding boxes for wide, square, and tall images. Do not accept a test that only checks the presence of `<img>`.
  Parallelization: Wave 1 | Blocked by: 3 | Blocks: 7
  References (executor has NO interview context - be exhaustive): `src/client/ImagePreviewField.tsx:92-165`, `src/client/styles/cards.css:114-140`, `scripts/qa/browser-image-preview.mjs`, `scripts/qa/browser-image-preview-support.mjs`
  Acceptance criteria (agent-executable): Evidence records `wideHeight < squareHeight < tallHeight` or an equivalent ratio-aware comparison for rendered image prompt cards. It also records that image cards are not all equal height.
  QA scenarios (name the exact tool + invocation): happy: `node scripts/qa/browser-image-preview.mjs --output .omo/evidence/ui-4-prompt-gallery-design-application.md`; failure: with the current fixed `aspect-ratio: 1 / 1` CSS, the evidence must show equal heights or the script must fail before the implementation step.
  Commit: Y | test(ui): assert natural-ratio image masonry

- [ ] 5. Apply the light design tokens and app-shell surfaces.
  What to do / Must NOT do: Replace the current dark CSS tokens with the `DESIGN.md` light palette, add missing tokens such as `--text-faint`, `--accent-focus`, `--accent-soft`, and decorative tokens only if needed. Update shell/panel/control styles to warm paper and white surfaces. Do not alter application state, API calls, or modal behavior.
  Parallelization: Wave 2 | Blocked by: 1, 2 | Blocks: 6, 7
  References (executor has NO interview context - be exhaustive): `DESIGN.md:23-67`, `DESIGN.md:136-190`, `DESIGN.md:264-287`, `src/client/styles/base.css:1-24`, `src/client/styles/layout.css:1-78`, `src/client/styles/actions.css`, `src/client/styles/modal.css`, `src/client/styles/responsive.css`
  Acceptance criteria (agent-executable): `rg -n "#08090a|#0f1011|#191a1b|#7170ff|color-scheme: dark" src/client/styles` returns no active app-shell token usage. `pnpm lint` and `pnpm typecheck` pass.
  QA scenarios (name the exact tool + invocation): happy: `pnpm lint && pnpm typecheck | tee .omo/evidence/ui-5-prompt-gallery-design-application.txt`; failure: if contrast or focus ring tokens are missing, record the failed grep or browser assertion in the evidence file and fix before continuing.
  Commit: Y | feat(ui): apply prompt gallery light design tokens

- [ ] 6. Implement max-four square non-image cards and natural-ratio image masonry.
  What to do / Must NOT do: Introduce a shared card-grid rule that caps desktop columns at 4 and keeps prompt/workflow/repo cards square. Use the existing `.gallery-card` primitive for prompt, workflow, and repo. Add image-section or image-card class/data handling only as needed for masonry. Remove compact image preview's forced fixed square behavior in gallery cards; image cards should let the rendered image determine card height, with only a conservative thumbnail max-height guard for extreme images. Detail/modal image display must remain usable and not inherit card thumbnail cropping.
  Parallelization: Wave 2 | Blocked by: 1, 2, 3 | Blocks: 7
  References (executor has NO interview context - be exhaustive): `src/client/GalleryList.tsx:77-190`, `src/client/GalleryCard.tsx:63-163`, `src/client/ImagePreviewField.tsx:92-165`, `src/client/styles/cards.css:1-16`, `src/client/styles/cards.css:97-140`, `src/client/styles/layout.css:38-78`, `src/client/styles/responsive.css`
  Acceptance criteria (agent-executable): Browser geometry evidence shows at 1280px: non-image cards per row is `<= 4`; prompt/workflow/repo card width and height differ by no more than the agreed tolerance; image prompt cards with wide/square/tall fixtures have different heights and tall is taller than square. At 390px no horizontal overflow is detected.
  QA scenarios (name the exact tool + invocation): happy: `pnpm qa:fixtures && node scripts/qa/<new-or-updated-layout-script>.mjs --output .omo/evidence/ui-6-prompt-gallery-design-application.md`; failure: run the same script against the pre-change CSS or force the old `.image-preview.compact .image-preview-frame { aspect-ratio: 1 / 1; }` locally to confirm the masonry assertion fails.
  Commit: Y | feat(ui): apply square card grid and image masonry

- [ ] 7. Run full verification and capture screenshots.
  What to do / Must NOT do: Run all static/build/test/browser checks, capture screenshots for desktop/tablet/mobile, and verify the plan's guardrails. Do not deploy and do not commit unless the user separately asks.
  Parallelization: Wave 3 | Blocked by: 4, 5, 6 | Blocks: Final verification
  References (executor has NO interview context - be exhaustive): `package.json:6-18`, `scripts/qa/browser-smoke.mjs`, `scripts/qa/browser-gallery-search.mjs`, `scripts/qa/browser-image-preview.mjs`, `_temp/preview-design-main_20260709_01.html`, `_temp/preview-design-main_20260709_01-desktop.png`, `_temp/preview-design-main_20260709_01-mobile.png`
  Acceptance criteria (agent-executable): `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm qa:fixtures`, `pnpm qa:browser`, and the targeted layout/image QA scripts all pass. Evidence includes screenshots or screenshot paths for 390px, 768px, and 1280px viewports.
  QA scenarios (name the exact tool + invocation): happy: `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm qa:fixtures && pnpm qa:browser | tee .omo/evidence/ui-7-prompt-gallery-design-application.txt`; failure: if any command fails, stop, save the failing output under `.omo/evidence/ui-7-prompt-gallery-design-application-failure.txt`, and fix within the owning todo scope.
  Commit: N | final verification only

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  Verify every Must have is satisfied and every Must NOT have is still untouched. Evidence: `.omo/evidence/f1-prompt-gallery-design-application.md`.
- [ ] F2. Code quality review
  Review changed CSS/TSX for unnecessary abstraction, duplicated layout rules, inaccessible controls, raw color drift, and mobile overflow risk. Evidence: `.omo/evidence/f2-prompt-gallery-design-application.md`.
- [ ] F3. Real manual QA
  Use Playwright/browser screenshots for All tab, image prompt section, Workflow section, Repo section, search results, and mobile view. Evidence: `.omo/evidence/f3-prompt-gallery-design-application.md` plus screenshots.
- [ ] F4. Scope fidelity
  Confirm no deploy command, backend/storage migration, dependency install, unrelated file revert, or fake DOM-only sample card was introduced. Evidence: `.omo/evidence/f4-prompt-gallery-design-application.md`.

## Commit strategy
- Do not commit during execution unless the user explicitly requests it.
- If a commit is requested later, use the `cp` skill, not raw `git add`/`git commit`.
- Suggested split:
  - `docs(design): clarify prompt gallery card layout contract`
  - `test(ui): cover prompt gallery responsive card layout`
  - `feat(ui): apply prompt gallery light card design`
- Keep deployment separate from these commits.

## Success criteria
- `DESIGN.md` no longer contradicts the accepted image masonry rule.
- Main gallery uses the light/warm design tokens instead of the previous black shell.
- Desktop wide viewport shows no more than 4 non-image cards per row.
- Prompt, Workflow, and Repo cards share the same square card rhythm.
- Image prompt cards use masonry behavior: long images produce taller cards, not fixed square cards.
- Browser evidence proves desktop/tablet/mobile layout without overlap or horizontal overflow.
- Static checks, tests, build, and browser QA pass.
- No deploy, backend/data migration, new dependency, or unrelated revert occurs.
