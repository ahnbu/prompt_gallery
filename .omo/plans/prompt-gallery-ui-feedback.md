# prompt-gallery-ui-feedback - Work Plan

## TL;DR (For humans)

**What you'll get:** 이미지 프롬프트 카드가 정사각형 중심의 갤러리 카드처럼 보이도록 조정하고, 실제로 저장되는 이미지 프롬프트 샘플 데이터를 넣고, All 화면의 각 분류 제목 옆에 간결한 `+` 버튼을 추가한다.

**Why this approach:** 지금은 전체 디자인 방향을 다시 잡는 단계가 아니다. 사용자가 지적한 사용성 문제 3개만 좁게 고치되, 샘플은 가짜 안내 카드가 아니라 실제 데이터로 넣어 사용자가 직접 삭제할 수 있게 한다.

**What it will NOT do:** 전체 색상/브랜드/테마를 바꾸지 않는다. scrap_sns 화면을 그대로 복제하지 않는다. 새 아이콘 라이브러리나 큰 레이아웃 개편을 넣지 않는다.

**Effort:** Short
**Risk:** Medium - UI 흐름은 작지만 카드 레이아웃, 실제 샘플 데이터, 브라우저 QA가 함께 바뀐다.
**Decisions to sanity-check:** 샘플은 실제 저장 데이터로 생성한다. 섹션별 추가는 텍스트 없이 lucide `Plus` 아이콘 버튼으로 둔다. 전체 디자인 재정의는 제외한다.

Your next move: 이 계획대로 실행하려면 `$omo:start-work` 또는 동등한 실행 지시를 준다. Full execution detail follows below.

---

> TL;DR (machine): Short/medium-risk focused React UI update: square image prompt card previews, actual seeded image prompt samples, All-section Plus add buttons, browser/visual QA, optional deploy after verification.

## Scope
### Must have
- 기존 `DESIGN.md`의 dark-native 디자인 계약을 유지한다.
- 이미지 프롬프트 카드의 compact preview를 `16:9` 배너형에서 정사각형 중심 카드 preview로 바꾼다.
- 카드 grid와 card min-height가 정사각형 preview를 수용하도록 조정하되, 전체 앱 레이아웃 재설계는 하지 않는다.
- 이미지 프롬프트 샘플은 placeholder/empty-state가 아니라 실제 `image_prompt` item으로 생성한다.
- 실제 샘플 데이터는 사용자가 앱에서 상세 열기/수정/삭제할 수 있어야 한다.
- All 탭의 `프롬프트`, `이미지 프롬프트`, `Workflow`, `레포` 섹션 헤더 오른쪽에 icon-only `+` 버튼을 둔다.
- 섹션별 `+` 버튼은 모두 lucide-react `Plus` 아이콘을 사용한다.
- 섹션별 `+` 버튼은 화면 텍스트 없이 `aria-label`과 `title`로 유형을 설명한다.
- `프롬프트 +`, `이미지 프롬프트 +`, `레포 +`는 `ItemModal` add 모드를 해당 type 기본값으로 연다.
- `Workflow +`는 `WorkflowModal` add 모드를 연다.
- 검색어나 태그 필터로 unified results가 표시될 때는 섹션별 `+` 버튼을 표시하지 않는다.
- 기존 상단 `추가` 버튼은 유지한다.
- 관련 Playwright QA가 섹션별 `+` 버튼, default type, square preview, 실제 샘플 데이터 노출을 검증한다.
- 필요하면 `DESIGN.md` Section 5에 `Section heading action`과 `Square image prompt preview` primitive를 최소 보강한다.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- 전체 디자인 방향 재정의 금지.
- 밝은 테마 전환 금지.
- scrap_sns UI의 픽셀 복제 금지.
- 랜딩 페이지/마케팅 hero 추가 금지.
- 새 icon library 도입 금지. 기존 lucide-react를 사용한다.
- fake DOM-only sample card 금지. 샘플은 실제 저장 데이터여야 한다.
- 기존 데이터 삭제/초기화 금지.
- 사용자 승인 없는 공개 배포/커밋 금지.
- `as any`, `@ts-ignore`, `@ts-expect-error`, non-null assertion 추가 금지.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD where practical. First add failing Playwright/browser assertions for the visible UI behavior, then implement.
- Static gates:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`
- Browser QA:
  - `pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/ui-4-prompt-gallery-ui-feedback-gallery.md`
  - `pnpm qa:browser -- --scenario image-preview --output .omo/evidence/ui-4-prompt-gallery-ui-feedback-image.md`
- Visual QA:
  - Start local app through existing QA helper or `pnpm dev`.
  - Capture mobile/tablet/desktop screenshots for All tab and Image Prompt tab.
  - Run `omo:visual-qa` dual review on fresh screenshots before claiming UI complete.
- Deploy readiness only after local verification:
  - `pnpm deploy:check -- --output .omo/evidence/ui-6-prompt-gallery-ui-feedback-deploy-check.txt`
  - Actual `wrangler deploy` only after explicit user approval.
- Evidence root: `.omo/evidence/prompt-gallery-ui-feedback-*` and task-specific paths listed below.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1: pin browser expectations and seed/sample strategy.
- Wave 2: implement focused UI/data changes.
- Wave 3: run static, browser, visual, and deploy-readiness verification.
- Wave 4: optional deploy and public URL smoke only after user approval.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 3, 4 | 2 |
| 2 | none | 3, 5 | 1 |
| 3 | 1, 2 | 4, 5 | none |
| 4 | 3 | 6 | 5 |
| 5 | 3 | 6 | 4 |
| 6 | 4, 5 | optional deploy | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Browser QA red assertions for All-section add buttons and square image preview
  What to do / Must NOT do: Extend the existing browser QA before production changes. Add assertions that currently fail because section headers have no icon-only add buttons and compact image previews are 16:9. Do not weaken existing gallery search assertions.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 3, 4
  References (executor has NO interview context - be exhaustive): `scripts/qa/browser-gallery-search.mjs` `assertAllView`, `assertTabFiltering`, screenshot flow; `src/client/GalleryList.tsx` `GallerySection`; `src/client/styles/cards.css` `.image-preview.compact .image-preview-frame`.
  Acceptance criteria (agent-executable): `pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/ui-1-prompt-gallery-ui-feedback-red.md` fails for missing section add button and/or non-square compact image preview, not for app startup or unrelated fixture failure.
  QA scenarios (name the exact tool + invocation): Happy-after-implementation uses the same command and expects PASS. Failure-first evidence: `.omo/evidence/ui-1-prompt-gallery-ui-feedback-red.md`.
  Commit: N | covered by later UI commit.

- [ ] 2. Actual sample image prompt seed path
  What to do / Must NOT do: Add or extend a deterministic seed/fixture path that creates real `image_prompt` items with concrete titles/body/notes/tags. If preview images are included, attach them through the existing protected asset API, not public R2 URLs. Do not render fake sample cards in React.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 3, 5
  References (executor has NO interview context - be exhaustive): `scripts/qa/browser-gallery-fixtures.mjs` `seedGalleryData`; `scripts/qa/api-smoke-assets.mjs` image prompt asset upload flow; `src/worker/item-input.ts` item type validation; `src/client/gallery-data.ts` item response parsing.
  Acceptance criteria (agent-executable): A seed command or QA fixture creates at least 2 real `image_prompt` items whose titles appear in `/api/items`, in All > 이미지 프롬프트, and in the 이미지 프롬프트 tab. They can be deleted through the existing item delete API/UI.
  QA scenarios (name the exact tool + invocation): `pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/ui-2-prompt-gallery-ui-feedback-samples.md` verifies sample titles render as real cards. Failure scenario: delete one seeded sample via UI/API and verify it disappears from `/api/items` and the card grid.
  Commit: N | covered by later UI/fixture commit.

- [ ] 3. Focused UI implementation for section Plus buttons and add modal routing
  What to do / Must NOT do: Update `GalleryResults`/`SectionedList`/`GallerySection` to accept section add actions. Add icon-only `Plus` buttons in section headers. Update `App.tsx` to expose explicit add handlers for `prompt`, `image_prompt`, `repo`, and `workflow`. Do not change tab labels, topbar behavior, or modal validation rules beyond what section buttons need.
  Parallelization: Wave 2 | Blocked by: 1, 2 | Blocks: 4, 5
  References (executor has NO interview context - be exhaustive): `src/client/App.tsx` `openAddModal`, `tabs`; `src/client/GalleryList.tsx` `SectionedList`, `GallerySection`; `src/client/ItemModal.tsx` exported `defaultTypeForTab`; `src/client/item-modal-model.ts` `defaultTypeForTab`; lucide usage in `src/client/App.tsx` and `src/client/GalleryCard.tsx`.
  Acceptance criteria (agent-executable): On All tab, each section heading has one visible icon-only Plus button with accessible name `프롬프트 추가`, `이미지 프롬프트 추가`, `Workflow 추가`, `레포 추가`. Clicking each opens the correct add modal with the correct default type or workflow modal. Unified search/tag results do not show section add buttons.
  QA scenarios (name the exact tool + invocation): Playwright action sequence: open `/`, click `[data-qa="section-image_prompt"] button[aria-label="이미지 프롬프트 추가"]`, expect dialog `항목 추가`, expect type select value `image_prompt`; click workflow section Plus and expect dialog for workflow add. Evidence `.omo/evidence/ui-3-prompt-gallery-ui-feedback-section-add.md`.
  Commit: Y | `feat(ui): add section-level prompt gallery actions`

- [ ] 4. Focused CSS/card implementation for square image prompt previews
  What to do / Must NOT do: Change compact image preview styling so image prompt cards present a square preview. Keep stable dimensions, no text overlap, and no layout shift. Do not apply square media boxes to non-image prompt cards unless needed for grid rhythm.
  Parallelization: Wave 2 | Blocked by: 3 | Blocks: 6
  References (executor has NO interview context - be exhaustive): `src/client/GalleryCard.tsx` conditional `ImagePreviewField compact`; `src/client/ImagePreviewField.tsx`; `src/client/styles/cards.css` `.card-grid`, `.gallery-card`, `.image-preview.compact`, `.image-preview.compact .image-preview-frame`; `DESIGN.md` spacing/radius tokens.
  Acceptance criteria (agent-executable): Compact image preview frame reports width and height within 2px of each other in browser QA at 390, 768, and 1280px viewports. Cards remain readable and do not overlap controls/text.
  QA scenarios (name the exact tool + invocation): `pnpm qa:browser -- --scenario image-preview --output .omo/evidence/ui-4-prompt-gallery-ui-feedback-square-preview.md` captures no-image/uploaded/removed states; a Playwright bounding-box assertion verifies square ratio. Visual screenshots saved under `.omo/evidence/ui-4-prompt-gallery-ui-feedback-*.png`.
  Commit: Y | same commit as Todo 3 unless fixture changes are separate.

- [ ] 5. DESIGN.md and QA evidence updates
  What to do / Must NOT do: If new reusable patterns are introduced, update only the relevant `DESIGN.md` component sections. Update browser evidence renderer text only if assertions changed. Do not rewrite the full design system.
  Parallelization: Wave 2 | Blocked by: 3 | Blocks: 6
  References (executor has NO interview context - be exhaustive): `DESIGN.md` Section 5 Components; `scripts/qa/browser-gallery-evidence.mjs`; `scripts/qa/browser-image-preview.mjs` evidence text.
  Acceptance criteria (agent-executable): `DESIGN.md` documents section heading action and square image prompt preview if they are reusable. Evidence markdown lists the new assertions so future readers know what passed.
  QA scenarios (name the exact tool + invocation): `rg -n "section.*add|Plus|square|정사각" DESIGN.md scripts/qa` returns the new documented behavior. Evidence `.omo/evidence/ui-5-prompt-gallery-ui-feedback-doc-check.txt`.
  Commit: Y | `docs(ui): document prompt gallery card refinements` if separated, otherwise included in UI commit.

- [ ] 6. Full local verification and visual QA
  What to do / Must NOT do: Run the full static/test/build/browser verification after implementation. Then run visual QA on fresh screenshots. Do not claim complete from tests alone.
  Parallelization: Wave 3 | Blocked by: 4, 5 | Blocks: optional deploy
  References (executor has NO interview context - be exhaustive): `package.json` scripts; `scripts/qa/browser-smoke.mjs`; `omo:visual-qa` requirement for fresh mobile/tablet/desktop captures and dual reviewer pass.
  Acceptance criteria (agent-executable): All commands exit 0: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, gallery browser QA, image preview browser QA. Visual QA returns PASS with no blocking layout/CJK/accessibility findings.
  QA scenarios (name the exact tool + invocation): `pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/ui-6-prompt-gallery-ui-feedback-gallery.md`; `pnpm qa:browser -- --scenario image-preview --output .omo/evidence/ui-6-prompt-gallery-ui-feedback-image.md`; visual QA over fresh screenshots at 390/768/1280. Evidence `.omo/evidence/ui-6-prompt-gallery-ui-feedback-visual-qa.md`.
  Commit: N | verification only.

- [ ] 7. Deploy readiness and optional public deployment
  What to do / Must NOT do: Check deploy readiness after local verification. Do not run actual public deploy unless the user explicitly approves deployment in that execution turn.
  Parallelization: Wave 4 | Blocked by: 6 | Blocks: final handoff
  References (executor has NO interview context - be exhaustive): `wrangler.jsonc`; `scripts/qa/deploy-check.mjs`; existing Cloudflare D1/R2 bindings.
  Acceptance criteria (agent-executable): `pnpm deploy:check -- --output .omo/evidence/ui-7-prompt-gallery-ui-feedback-deploy-check.txt` exits 0. If user approves deploy, `pnpm exec wrangler deploy` returns a public URL and a browser smoke check against that URL passes.
  QA scenarios (name the exact tool + invocation): Readiness: `pnpm deploy:check -- --output .omo/evidence/ui-7-prompt-gallery-ui-feedback-deploy-check.txt`. Optional deploy smoke: `pnpm qa:browser -- --base-url <deployed-url> --scenario gallery-search --output .omo/evidence/ui-7-prompt-gallery-ui-feedback-deployed-smoke.md`.
  Commit: N | deploy action only after approval.

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` plus evidence file review confirms every Todo acceptance criterion has an artifact.
- [ ] F2. Code quality review: reviewer checks changed TS/TSX/CSS for strict typing, no scope creep, no new icon library, no fake sample cards.
- [ ] F3. Real manual QA: Playwright/browser drives All tab section `+` buttons, image prompt tab, actual sample card delete, and square preview at mobile/tablet/desktop.
- [ ] F4. Scope fidelity: reviewer confirms no full redesign, no bright theme conversion, no scrap_sns clone, no unauthorized deploy/commit.

## Commit strategy
- Use the `cp` skill for commits if the user asks to commit.
- Do not stage/commit automatically during implementation unless explicitly requested.
- Recommended commit split:
  - `feat(ui): add section-level prompt gallery actions`
  - `feat(fixtures): seed image prompt sample cards`
  - `docs(ui): document prompt gallery card refinements` only if `DESIGN.md` changes are substantial enough to separate.
- Before any commit, run `node C:/Users/ahnbu/.claude/skills/_shared/security-gate.mjs precommit --repo D:/vibe-coding/prompt-gallery --staged` through the commit workflow.

## Success criteria
- Image prompt cards no longer read as wide banners; compact preview is square at mobile, tablet, and desktop breakpoints.
- Actual image prompt sample data exists as deletable app data, not as fake placeholder UI.
- All tab section headings expose icon-only lucide `Plus` add buttons with accessible labels.
- Section `+` buttons open the correct add modal/type.
- Existing search, tag filtering, favorite, image preview upload/remove, and workflow/repo behavior remain green.
- Static checks, build, browser QA, and visual QA pass with fresh evidence.
- Deploy readiness passes; actual deployment happens only after explicit user approval.
