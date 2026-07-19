# CLIENT KNOWLEDGE BASE

## OVERVIEW

갤러리 아이템을 탐색, 필터링, 편집, 복사, 프리뷰하는 React 작업 UI다.

## WHERE TO LOOK

| 작업 | 위치 | 비고 |
| --- | --- | --- |
| 앱 상태와 데이터 갱신 | `App.tsx` | 갤러리 fetch, 모달 상태, 탭, 태그, 즐겨찾기 갱신을 소유. |
| React 부트스트랩 | `main.tsx` | `#root`를 확인하고 `<App />`을 렌더. |
| 갤러리 카드 렌더링 | `GalleryCard.tsx` | 카드 단위 복사/즐겨찾기/열기 동작. |
| 섹션형 vs 통합 리스트 | `GalleryList.tsx` | 검색/필터 시 통합 결과로 전환. |
| 아이템 모달 | `ItemModal*.tsx`, `item-modal-model.ts` | 프롬프트/이미지/레포 생성/편집/상세 모델. |
| 워크플로 모달 | `WorkflowModal*.tsx`, `workflow-modal-model.ts` | 워크플로 필드와 스텝 편집. |
| 태그 관리 | `TagManagement*.tsx`, `tag-management-model.ts` | 이름변경, 병합, 키워드/색상 관리. |
| API 파싱 | `gallery-data.ts` | Worker JSON payload의 런타임 검증. |
| 스타일링 | `styles.css`, `styles/*.css` | base/layout/cards/modal/actions로 분리된 토큰화 CSS. |
| Export | `export-data.ts` | `/api/export`를 호출하고 결과를 다운로드. |

## CONVENTIONS

- UI 파일은 컴포넌트에 PascalCase, model/mutation 파일명에 lower-kebab 계열을 쓴다.
- 비즈니스 결정은 `*-model.ts`에, 네트워크 쓰기는 `*-mutations.ts`에 둔다.
- `gallery-data.ts`에서 readonly 데이터 형태와 명시적 파서 검사를 유지한다.
- 액션에는 Lucide 아이콘을 쓴다. 아이콘 전용 컨트롤에는 접근성 레이블/타이틀이 필요하다.
- 한국어 레이블은 정상 UI 문구다. 모바일에서 잘리지 않게 맞춘다.
- 섹션 추가 버튼은 해당하는 기본 타입을 설정해야 한다.
- 네트워크 쓰기와 에러 처리는 `api-client.ts`를 재사용한다. `*-mutations.ts`마다
  fetch/에러 로직을 복붙하지 않는다.
- 아이템 신규 스칼라 필드는 `github_url` 배선 경로를 끝까지 그대로 따른다:
  types → input → repository SELECT/INSERT/UPDATE → 클라이언트 파싱 → 폼 → 표시.
- UI 변경 시 상단 액션 버튼이 모든 뷰포트에서 단일 행을 유지하는지 확인한다.
  `qa:browser`의 `assertSingleRow`가 `topbar-actions`를 검사한다.

## DESIGN RULES

- `DESIGN.md`가 시각 방향을 통제한다: 따뜻한 종이 캔버스, 흰 카드, 절제된 블루 액션.
- 첫 뷰포트는 작업 앱 표면으로 유지한다: 검색, 필터, 탭, 섹션, 카드.
- 히어로 섹션, 가격표형 카드, 장식성 랜딩 밴드, 마케팅 구성은 쓰지 않는다.
- 최대 콘텐츠 폭은 `1180px`다. 프롬프트, Workflow, Repo 카드는 가용 폭을 채우는
  반응형 auto-fit 카드 그리드를 쓴다.
- 이미지 프롬프트 카드는 자연 비율 masonry를 쓴다. 컴팩트 갤러리 썸네일을
  `aspect-ratio: 1 / 1`로 강제하지 않는다. 긴 이미지는 더 높은 카드를 만들어야 한다.
- 카드는 스캔하기 좋게 유지하고 중첩 카드 셸을 피한다.
- 디자인 토큰 밖에서 raw 색상을 도입하지 않는다.

## ANTI-PATTERNS

- 정상 흐름으로 편집/삭제할 수 없는 가짜 예시 카드를 추가하지 않는다.
- 툴팁/접근성 지원이 없으면 탭 텍스트를 아이콘 전용 컨트롤로 대체하지 않는다.
- 장식성 모션을 추가하지 않는다. 모션은 상호작용이나 상태를 전달해야 한다.
- 저장 아이템의 의미를 DOM에만 존재하는 UI 상태로 옮기지 않는다.
- 쓰기 동작 후 전체 갤러리를 다시 fetch하지 않는다. 로컬 상태 부분 갱신(optimistic,
  예: `applyItemPatch`)을 기본으로 하고 실패 시 롤백한다.
