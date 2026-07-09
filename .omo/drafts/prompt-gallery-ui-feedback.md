---
slug: prompt-gallery-ui-feedback
status: drafting
intent: clear
pending-action: write .omo/plans/prompt-gallery-ui-feedback.md
approach: "Focused React UI plan: square image prompt previews, actual seeded image_prompt sample records, and icon-only lucide Plus add buttons in All-tab section headers. Preserve existing DESIGN.md direction."
---

# Draft: prompt-gallery-ui-feedback

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
- C1 | 이미지 프롬프트 카드 preview가 정사각형 카드 그리드 리듬으로 보인다 | active | src/client/GalleryCard.tsx, src/client/styles/cards.css, scripts/qa/browser-image-preview.mjs
- C2 | 실제 이미지 프롬프트 샘플 데이터가 앱 데이터로 생성되어 사용자가 직접 삭제할 수 있다 | active | scripts/qa/browser-gallery-fixtures.mjs, scripts/qa/api-smoke.mjs, src/worker/item-routes.ts
- C3 | All 탭의 각 분류 섹션 헤더에 lucide Plus 아이콘 추가 버튼이 있고 해당 유형 add modal을 연다 | active | src/client/App.tsx, src/client/GalleryList.tsx, src/client/item-modal-model.ts
- C4 | 변경 후 브라우저 QA와 visual QA가 모바일/태블릿/데스크톱에서 통과한다 | active | scripts/qa/browser-gallery-search.mjs, .omo/evidence/

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
- 전체 디자인 방향 | 기존 DESIGN.md의 dark-native 계약은 유지한다 | 사용자가 2, 3, 4만 먼저 반영하라고 범위를 좁힘 | reversible
- 섹션별 추가 버튼 표기 | 화면에는 Plus 아이콘만 보이고 aria-label/title로 유형을 설명한다 | 사용자가 텍스트가 아니라 간결한 + 버튼을 원함; 접근성은 숨은 라벨로 보강 | reversible
- 샘플 데이터 성격 | 실제 DB item으로 추가되는 image_prompt 샘플이며 placeholder/empty-state가 아니다 | 사용자가 “실제 샘플 데이터”로 확정했고 직접 삭제 예정 | reversible
- 샘플 데이터 생성 위치 | 기존 fixture/seed 흐름 또는 별도 seed 스크립트로 만든다 | 앱 렌더링에 가짜 카드 로직을 넣지 않기 위해 | reversible

## Findings (cited - path:lines)
- `DESIGN.md`는 `dark-native`와 `#08090a` 기반 surface를 명시하므로 이번 계획은 전체 디자인 재정의가 아니라 기존 토큰 안에서 카드/흐름만 조정한다.
- `src/client/styles/cards.css`의 `.image-preview.compact .image-preview-frame`은 `aspect-ratio: 16 / 9`라 현재 이미지 프롬프트 카드가 가로 배너처럼 보이는 원인이다.
- `src/client/GalleryList.tsx`는 All 탭을 `프롬프트`, `이미지 프롬프트`, `Workflow`, `레포` 섹션으로 나누지만 `GallerySection`에 add action prop이 없다.
- `src/client/App.tsx`의 `openAddModal()`은 현재 active tab만 기준으로 default type을 결정한다. 섹션별 버튼에는 명시적 target type/kind handler가 필요하다.
- `src/client/item-modal-model.ts`의 `defaultTypeForTab()`은 `prompt`, `image_prompt`, `repo`만 item default type으로 반환하고 `workflow`는 별도 modal을 연다.
- `scripts/qa/browser-gallery-fixtures.mjs`는 이미 API로 `image_prompt` fixture를 생성하지만 body만 있고 preview asset은 없다.
- `scripts/qa/browser-image-preview.mjs`는 이미지 프롬프트 생성/업로드/삭제 흐름과 카드 thumbnail/no-image 상태를 검증한다.

## Decisions (with rationale)
- 실제 샘플 데이터는 UI 안의 “예시 카드 컴포넌트”가 아니라 API로 생성되는 실제 item으로 처리한다. 사용자가 삭제할 수 있어야 하고, 저장된 카드와 같은 방식으로 동작해야 하기 때문이다.
- 카드 형태 변경은 image preview frame의 compact aspect ratio와 card grid/card min-height 조정에 제한한다. 전체 palette/typography redesign은 범위 밖이다.
- All 탭 섹션 add 버튼은 `Plus` 아이콘 단독 표시로 하되 `aria-label="이미지 프롬프트 추가"`처럼 접근성 라벨을 필수로 둔다.
- 검색/태그 필터로 unified result가 뜬 상태에는 섹션별 추가 버튼을 노출하지 않는다. 섹션이 없는 표면에서는 맥락 버튼도 없기 때문이다.
- 배포는 구현 완료 후 별도 실행 단계로 두고, 이 계획에는 deploy readiness와 공개 URL smoke 확인을 포함한다.

## Scope IN
- 이미지 프롬프트 카드 preview의 정사각형화.
- 실제 이미지 프롬프트 샘플 데이터 생성 경로 추가 또는 기존 seed/fixture 확장.
- All 탭 섹션별 lucide Plus icon-only add button.
- 관련 Playwright/browser QA 시나리오 업데이트.
- `DESIGN.md`의 Section 5 컴포넌트 설명 보강이 필요한 경우 최소 업데이트.
- 구현 후 build/typecheck/lint/test/browser QA/visual QA/deploy check.

## Scope OUT (Must NOT have)
- 전체 디자인 방향 재정의.
- 밝은 테마 전환.
- scrap_sns UI의 복제.
- 랜딩 페이지/마케팅 화면 추가.
- 카드 외 영역의 대규모 레이아웃 재작업.
- 새 icon library 도입.
- 샘플 데이터를 가짜 DOM-only 카드로 렌더링.
- 사용자 승인 없는 실제 공개 배포/커밋.

## Open questions
- 없음. 사용자가 실제 샘플 데이터 방식을 확정했다.

## Approval gate
status: approved-by-request
pending-action: write .omo/plans/prompt-gallery-ui-feedback.md
approval-evidence: user asked “구체적인 구현계획문서를 작성하라” and after interruption “계획작업을 이어서 수행하라”.
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
