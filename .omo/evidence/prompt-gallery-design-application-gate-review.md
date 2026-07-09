# Prompt Gallery Design Application Gate Review

recommendation: REJECT

## originalIntent

사용자는 승인된 디자인 실행 계획을 현재 `D:/vibe-coding/prompt-gallery`에 반영해 `DESIGN.md`와 메인 갤러리 UI가 같은 계약을 따르길 원했다. 핵심은 밝은 Notion형 메인 화면, prompt/workflow/repo 정사각형 카드, desktop 최대 4열, image prompt natural-ratio masonry, All 섹션 add 버튼 보존, QA/정적 검증 통과, package/backend/migrations/deploy 범위 제외, slop/oversized 제거다.

## desiredOutcome

- `DESIGN.md`가 square non-image cards, max-four desktop columns, natural-ratio image masonry를 명시한다.
- UI가 prompt/workflow/repo 정사각형 카드와 image prompt masonry를 mobile/tablet/desktop에서 렌더한다.
- All 탭 섹션별 add 버튼이 보존되고 올바른 기본 타입을 연다.
- QA 스크립트와 evidence가 실제 구현 계약을 정확히 설명한다.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, browser QA가 현재 트리에서 통과한다.
- package/backend/migrations/deploy 파일 변경이 없다.
- `remove-ai-slops`와 `programming` 기준상 false-confidence QA, overfit/slop, oversized touched module이 없다.

## userOutcomeReview

핵심 UI 구현 자체는 현재 렌더에서 대부분 충족된다. 직접 실행한 `browser-design-layout` 결과는 mobile/tablet/desktop non-image cards가 모두 `264x264`, desktop first row count가 `4`, image masonry가 `wide=346 < square=453 < tall=644`, overflow `0px`, light token `--surface-base: #f6f5f4`임을 기록했다. 실제 desktop/mobile screenshot도 prompt/workflow/repo 정사각형 카드, image prompt natural-ratio masonry, All 섹션 add 버튼을 보여준다.

하지만 최종 승인은 불가하다. 현재 QA evidence generator가 새 설계 계약과 반대로 image prompt compact preview를 "square"라고 계속 출력한다. 이 문구는 fresh browser QA output에도 재생성되므로 stale artifact가 아니라 현재 스크립트의 false-confidence slop다. `remove-ai-slops` 기준상 사용자가 요구한 natural-ratio masonry와 충돌하는 QA 설명은 검증 신뢰도를 깨는 unresolved slop이며, 최신 code review report도 같은 사유로 `REQUEST_CHANGES`다.

## blockers

1. `scripts/qa/browser-gallery-evidence.mjs:60`가 현재도 `"- Compact image prompt preview frames are square, not wide banners."`를 출력한다.
   - 직접 재실행한 fresh output `C:/Users/ahnbu/AppData/Local/Temp/prompt-gallery-design-gate-gallery-search.md`에도 같은 문구가 생성됐다.
   - 기존 artifact `.omo/evidence/f3-gallery-search.md:24`도 같은 문구를 포함한다.
   - 실제 assertion은 `assertBoundedImagePreview`라서 구현/검증 이름은 bounded로 바뀌었지만, evidence prose는 square 계약을 계속 주장한다.

2. 현재 task code review report가 approval이 아니다.
   - `.omo/evidence/prompt-gallery-design-application-code-review.md`의 `codeQualityStatus: BLOCK`, `recommendation: REQUEST_CHANGES`.
   - blocker가 위 stale square QA prose와 fresh build evidence 부족으로 기록되어 있다.
   - fresh build는 이번 gate에서 통과 확인했지만, stale square QA prose는 아직 unresolved다.

## checkedArtifactPaths

- `DESIGN.md`
- `src/client/GalleryList.tsx`
- `src/client/GalleryCard.tsx`
- `src/client/styles/base.css`
- `src/client/styles/actions.css`
- `src/client/styles/cards.css`
- `src/client/styles/layout.css`
- `src/client/styles/responsive.css`
- `scripts/qa/browser-design-layout.mjs`
- `scripts/qa/browser-design-layout-api.mjs`
- `scripts/qa/browser-design-layout-browser.mjs`
- `scripts/qa/browser-gallery-search.mjs`
- `scripts/qa/browser-gallery-search-support.mjs`
- `scripts/qa/browser-gallery-evidence.mjs`
- `scripts/qa/browser-image-preview.mjs`
- `scripts/qa/browser-image-preview-support.mjs`
- `.omo/evidence/f3-prompt-gallery-design-application.md`
- `.omo/evidence/f3-gallery-search.md`
- `.omo/evidence/f3-image-preview.md`
- `.omo/evidence/f3-workflow-repo.md`
- `.omo/evidence/f3-prompt-gallery-design-application-clone-fidelity.md`
- `.omo/evidence/f4-prompt-gallery-design-application.md`
- `.omo/evidence/remove-ai-slops-prompt-gallery-design-application.md`
- `.omo/evidence/prompt-gallery-design-application-code-review.md`

## directVerification

- `pnpm typecheck`: PASS
- `pnpm lint`: PASS, 98 files checked
- `pnpm test`: PASS, 8 files / 40 tests
- `pnpm build`: PASS
- `node scripts/qa/browser-design-layout.mjs --output %TEMP%/prompt-gallery-design-gate-layout.md`: PASS
- `pnpm qa:browser -- --scenario gallery-search --output %TEMP%/prompt-gallery-design-gate-gallery-search.md`: PASS, but regenerated the blocking square QA prose
- `pnpm qa:browser -- --scenario image-preview --output %TEMP%/prompt-gallery-design-gate-image-preview.md`: PASS, bounded preview prose
- `pnpm qa:browser -- --scenario workflow-repo --output %TEMP%/prompt-gallery-design-gate-workflow-repo.md`: PASS
- Scope check: `git diff/status -- package.json pnpm-lock.yaml src/worker migrations wrangler.jsonc` returned empty.
- Pure LOC check: touched QA/UI files reviewed are under 250 pure LOC after split (`browser-gallery-search.mjs` 209, `browser-image-preview.mjs` 182, `browser-image-preview-support.mjs` 241, `browser-design-layout-browser.mjs` 200, `GalleryList.tsx` 186, `GalleryCard.tsx` 200).

## exactEvidenceGaps

- Fresh gallery-search evidence still describes image prompt compact preview as square, conflicting with natural-ratio/bounded image prompt contract.
- Current code review report remains `REQUEST_CHANGES` until that false-confidence QA prose is corrected and superseded.
