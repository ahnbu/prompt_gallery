# Prompt Gallery Design System

## 1. Atmosphere & Identity

Prompt Gallery는 재사용 가능한 프롬프트, 이미지 프롬프트, 워크플로, 레포 참조를 위한
차분한 개인 라이브러리다. 시각 방향은 Notion에서 영감을 받은 종이 같은 차분함이다:
따뜻한 오프화이트 캔버스, 조용한 흰 카드, 준-검정 텍스트, 속삭이듯 얇은 테두리,
그리고 주요 액션과 포커스를 위한 확신에 찬 블루 하나.

이것은 앱 작업 공간이지 마케팅 페이지가 아니다. 히어로 섹션, 가격표형 카드, 장식성 랜딩
페이지 밴드, 참조물의 브랜드 카피 패턴을 도입하지 않는다. 첫 뷰포트는 작업 표면으로
유지되어야 한다: 검색, 필터, 탭, 섹션, 카드.

디자인은 네 개의 분리된 레이어로 구성된다:

- 시각 스타일: 따뜻한 종이 캔버스, 흰 표면, 절제된 블루 액션.
- 콘텐츠 레이아웃: 프롬프트, 워크플로, 레포 아이템은 반응형 auto-fit 카드 그리드,
  이미지 프롬프트 카드는 자연 비율 masonry.
- 정보 구조: 탭 + 유용한 곳에서 섹션화된 갤러리 뷰.
- 입력 UX: 전역 추가는 항상 가능하며, 섹션에 명확한 아이템 타입이 있을 때
  섹션 단위 추가 액션을 허용한다.

## 2. Color

### Palette

| Role | Token | Value | Usage |
|------|-------|-------|-------|
| Surface/base | `--surface-base` | `#f6f5f4` | 앱 배경, 따뜻한 종이 캔버스 |
| Surface/panel | `--surface-panel` | `#ffffff` | 헤더, 콘텐츠 패널, 카드, 모달 |
| Surface/raised | `--surface-raised` | `#ffffff` | 부양된 카드/모달 표면 |
| Surface/control | `--surface-control` | `rgba(0,0,0,0.04)` | 입력, 비활성 탭, 보조 버튼 |
| Surface/soft | `--surface-soft` | `#fbfaf8` | 빈 상태, 은은한 섹션 채움 |
| Text/primary | `--text-primary` | `#1f1f1d` | 제목, 선택 레이블, 주요 콘텐츠 |
| Text/secondary | `--text-secondary` | `#31302e` | 본문 텍스트, 컨트롤 레이블 |
| Text/muted | `--text-muted` | `#615d59` | 메타데이터, 설명, 비활성 텍스트 |
| Text/faint | `--text-faint` | `#a39e98` | 플레이스홀더, 비활성 레이블 |
| Border/subtle | `--border-subtle` | `rgba(0,0,0,0.08)` | 구분선, 낮은 강조 이음새 |
| Border/default | `--border-default` | `rgba(0,0,0,0.12)` | 카드, 컨트롤, 패널 |
| Accent/primary | `--accent-primary` | `#0075de` | 주요 추가/저장 액션, 링크, 활성 상태 |
| Accent/hover | `--accent-hover` | `#005bab` | 주요 hover/pressed 상태 |
| Accent/focus | `--accent-focus` | `#097fe8` | 키보드 포커스 링 |
| Accent/soft | `--accent-soft` | `#f2f9ff` | 선택된 칩, 작은 뱃지 |

### Decorative Palette

이 색상들은 작은 카테고리 점, 일러스트 조각, 썸네일 강조로만 나타날 수 있다.
구조적 채움이나 경쟁하는 CTA가 되어서는 안 된다.

| Role | Token | Value |
|------|-------|-------|
| Decor/sky | `--decor-sky` | `#62aef0` |
| Decor/purple | `--decor-purple` | `#d6b6f6` |
| Decor/pink | `--decor-pink` | `#ff64c8` |
| Decor/orange | `--decor-orange` | `#dd5b00` |
| Decor/teal | `--decor-teal` | `#2a9d99` |
| Decor/green | `--decor-green` | `#1aae39` |

### Type Palette

타입 색상은 뱃지와 탭 점을 위한 의미론적 별칭이다. 두 번째 브랜드 팔레트를 더하지 않고
기존 accent/decorative 방향을 재사용한다.

| Item Type | Token | Soft Token | Usage |
|-----------|-------|------------|-------|
| Prompt | `--type-prompt` `#0075de` | `--type-prompt-soft` `#f2f9ff` | 프롬프트 뱃지, 탭 점 |
| Image Prompt | `--type-image` `#8a4edb` | `--type-image-soft` `#f7f0ff` | 이미지 뱃지, 탭 점 |
| Repo | `--type-repo` `#1aae39` | `--type-repo-soft` `#eefbf1` | 레포 뱃지, 탭 점 |
| Workflow | `--type-workflow` `#dd5b00` | `--type-workflow-soft` `#fff4ec` | 워크플로 뱃지, 탭 점 |
| Favorite | `--type-favorite` `#d88a00` | `--type-favorite-soft` `#fff7e8` | 즐겨찾기 탭 점 |
| All | `--type-all` `#615d59` | `--type-all-soft` `#f1efed` | All 탭 점 |

### Rules

- 주요 셸은 라이트 모드만 쓴다. 이전의 검은 Linear 스타일 셸을 유지하지 않는다.
- `--accent-primary`가 유일한 구조적 채도 색상이다.
- 이 문서와 CSS 토큰 정의 밖에서 raw 색상을 도입하지 않는다.
- 텍스트 대비를 높게 유지한다: base 또는 panel 표면 위의 주요 텍스트는 WCAG AA를 충족해야 한다.

## 3. Typography

### Font Stack

- Primary: `Inter Variable, Inter, ui-sans-serif, system-ui, -apple-system,
  BlinkMacSystemFont, "Segoe UI", sans-serif`
- Mono: `Berkeley Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`

참조물은 NotionInter를 언급하지만, Prompt Gallery는 가용한 Inter/시스템 스택을 써야 한다.
독점 브랜드 폰트에 의존하지 않는다.

### Scale

| Level | Size | Weight | Line Height | Tracking | Usage |
|-------|------|--------|-------------|----------|-------|
| H1 | 30px | 700 | 1.12 | 0 | 앱 제목 |
| H2 | 18px | 650 | 1.3 | 0 | 섹션 헤딩 |
| Card title | 15.5px | 700 | 1.35 | 0 | 갤러리 카드 제목 |
| Card preview | 12.5px | 400 | 1.5 | 0 | 갤러리 카드 본문 프리뷰 |
| Detail body | 14.5px | 400 | 1.65 | 0 | 모달 상세 주요 콘텐츠 |
| Body | 15px | 400 | 1.5 | 0 | 기본 콘텐츠 |
| Label | 13px | 560 | 1.4 | 0 | 탭, 컨트롤, 뱃지 |
| Caption | 12px | 400 | 1.4 | 0 | 메타데이터, 비활성 텍스트 |

### Rules

- 자간은 항상 `0`이다. 참조물의 음수 디스플레이 자간을 이 앱에 복사하지 않는다.
- 위계에는 큼직한 마케팅 타입이 아니라 굵기와 여백을 쓴다.
- 본문 텍스트는 메타데이터에서 12px, 컨트롤에서 13px 아래로 내려가지 않는다.
- 한국어·영어 레이블은 모바일에서 잘리지 않고 컨트롤 안에 들어가야 한다.

## 4. Spacing & Layout

### Base Unit

모든 간격은 4px 기본 단위에서 파생된다. 이는 시각 언어를 더 따뜻한 표면으로 옮기면서도
현재 앱의 컴팩트한 작업 리듬을 보존한다.

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | 촘촘한 아이콘 간격 |
| `--space-2` | `8px` | 칩과 컴팩트 컨트롤 패딩 |
| `--space-3` | `12px` | 입력 패딩, 카드 내부 간격 |
| `--space-4` | `16px` | 헤더 패딩, 카드 패딩 |
| `--space-6` | `24px` | 페이지 거터, 패널 패딩 |
| `--space-8` | `32px` | 섹션 분리 |

### Grid

- 최대 콘텐츠 폭: `1180px`.
- 페이지 레이아웃: topbar, tabbar, 태그 필터, 갤러리로 구성된 단일 앱 셸.
- 비이미지 카드 그리드: 가용 폭을 채우는 반응형 auto-fit 열(`minmax(248px, 264px)` 단위).
  카드는 정사각 강제 없이 안정적인 min-height를 쓴다.
- 이미지 프롬프트 그리드: 비이미지 그리드와 같은 열 폭 리듬의 masonry 열(`column-count`,
  데스크톱 4열에서 반응형으로 축소)이지만, 카드 높이는 실제 이미지 종횡비를 따른다.
- 이미지 프롬프트 미디어: 컴팩트 갤러리 카드에서 `aspect-ratio: 1 / 1`을 강제하지 않는다.
  넓은, 정사각, 세로 긴 소스 이미지는 눈에 띄게 다른 카드 높이를 만들어야 한다.
- 컴팩트 이미지 프롬프트 카드에 넓은 배너 미디어를 쓰지 않는다. 넓은 이미지는 masonry 카드
  안에서 넓게 남을 수 있으나, 카드 자체는 열 폭에서 컴팩트하게 유지해야 한다.
- 브레이크포인트: 모바일 `640px` 미만, 태블릿 `640px`~`959px`, 데스크톱 `960px` 이상.

### Rules

- 첫 뷰포트는 랜딩 페이지가 아니라 제품 표면이다.
- 카드는 가로 배너가 아니라 스캔하기 좋게 느껴져야 한다.
- 프롬프트, 워크플로, 레포 카드는 안정적인 min-height를 가진 하나의 카드 프리미티브를
  공유한다(정사각 강제 아님).
- 이미지 프롬프트 카드는 masonry 열로 갈라져 프리뷰 높이가 실제 이미지 종횡비를 따른다.
- 중첩 카드를 피한다. 패널은 반복 카드를 담을 수 있으나, 카드가 추가 카드 셸을 담아서는 안 된다.
- 컨트롤은 안정적인 높이를 써서 레이블, 아이콘, 카운터, 로딩 상태가 레이아웃을 흔들지 않게 한다.

## 5. Components

### App Shell

- 구조: 루트 앱 표면, topbar, 액션 그룹, 검색, 탭, 태그 필터, 갤러리 영역.
- 표면: `--surface-base` 페이지에 `--surface-panel` 컨트롤.
- 폭: 반응형 거터를 갖춘 중앙 정렬 `1180px` 최대 컨테이너.
- 접근성: 정확히 하나의 `main`, 레이블된 내비게이션, 레이블된 검색.

States:

- Loading: 간결한 로딩 문구를 담은 콘텐츠 패널.
- Error: 명확한 실패 문구와 장식적 산만함이 없는 콘텐츠 패널.
- Empty: 가능한 곳에 구체적 다음 액션을 담은 `--surface-soft` 빈 상태.

### Topbar

- 속삭이는 테두리와 은은한 radius를 가진 흰 패널.
- 제목 블록은 컴팩트하게 유지한다. 히어로 스케일 타입 없음.
- 액션 버튼은 데스크톱에서 우측 정렬, 모바일에서 깔끔하게 줄바꿈한다.
- 검색은 문서 도구 느낌을 유지한다: 흰색 또는 반투명 검정 컨트롤, 옅은 테두리, 보이는 포커스 링.

### Buttons

Primary buttons:

- `--accent-primary` 채움과 흰 텍스트를 쓴다.
- 추가, 저장, 그 외 되돌리기 어려운 전진 액션에 예약한다.
- Hover/pressed는 `--accent-hover`를 쓴다.

Secondary buttons:

- 흰색 또는 `--surface-control` 채움, `--border-default`, `--text-secondary`를 쓴다.
- Export, 태그 관리, 취소, 중립 유틸리티에 쓴다.

Icon buttons:

- Lucide 아이콘을 쓴다.
- 고정 정사각 히트 영역, 데스크톱 최소 `36px`, 모바일 `40px`.

States:

- Hover: 색상 또는 테두리 변화만.
- Active: 선택적 `transform: scale(0.98)`.
- Focus-visible: `2px offset`의 `2px solid var(--accent-focus)`.
- Disabled/loading: 낮춘 불투명도, 레이아웃 이동 없음.

### Tabs

- 탭은 마케팅 알약이 아니라 컴팩트한 유틸리티 컨트롤이다.
- 활성 탭은 `--accent-soft` 채움, `--accent-primary` 텍스트 또는 테두리를 쓴다.
- 비활성 탭은 `--surface-control`로 중립을 유지한다.
- 아이콘과 레이블은 보이게 유지한다. 툴팁과 접근성 레이블이 없으면 텍스트 레이블을
  아이콘 전용 컨트롤로 대체하지 않는다.

### Tag Chips

- 태그는 `--surface-control`로 작은 둥근 사각형 또는 은은한 알약을 쓴다.
- 선택된 태그는 `--accent-soft`와 `--accent-primary`를 쓴다.
- 긴 태그 이름은 말줄임으로 자른다.
- 태그는 카테고리 마커가 아닌 한 decorative 팔레트를 쓰지 않으며, 그 경우에도 색상은
  텍스트보다 부차적으로 유지해야 한다.

### Sectioned Gallery

- All 뷰는 스캔을 개선할 때 콘텐츠를 섹션으로 묶을 수 있다.
- 각 섹션 헤더는 제목, 개수, 그리고 섹션이 한 아이템 타입에 매핑될 때 선택적 섹션 단위
  추가 액션을 담는다.
- 섹션 단위 추가 버튼은 올바른 기본 타입을 설정해야 한다. 섹션이 직접 추가 가능하지 않으면
  모호한 액션을 보이는 대신 버튼을 생략한다.
- 검색 결과는 통합 결과 그리드로 전환할 수 있다.

### Gallery Card

- 표면: 따뜻한 종이 캔버스 위의 흰 카드.
- 형태: 밀도에 따라 8px~12px radius.
- 테두리: `--border-default`. 그림자는 선택적이며 매우 부드럽다.
- 프롬프트, 워크플로, 레포 카드는 안정적인 min-height를 써서 갤러리가 고른 카드 보드로
  스캔되게 한다. 이 카드 안의 텍스트는 clamp될 수 있으며, 카드 높이는 정사각으로 고정되지
  않고 내용에 따라 늘어난다.
- 그리드는 auto-fit 열을 쓰므로 행당 카드 수는 가용 폭을 따른다. 태블릿과 모바일은
  자동으로 열이 줄어든다.
- 콘텐츠 순서: 타입 뱃지/액션, 프리뷰/미디어, 제목, 태그. 날짜 메타데이터는 갤러리 카드에
  나타나지 않으며 상세/편집 표면에 속한다.
- 카드 제목은 더 강한 굵기를, 프리뷰 텍스트는 더 작고 muted하게 쓴다. 이는 자동 파생 제목을
  보이게 유지하면서 제목/본문 중복이 두 개의 동등한 헤딩처럼 느껴지지 않게 한다.
- 수동 태그는 칩 단위 제거/추가 컨트롤을 노출할 수 있다. 자동 태그는 삭제 유도 없이
  읽기 좋은 칩으로 남는다.

States:

- Hover/focus: 요란한 색상 워시가 아니라 테두리 + 부드러운 그림자 리프트.
- Favorite: 별 아이콘은 accent 색상을 쓰되 카드를 압도하지 않는다.
- Copy status: 아이콘이 체크로 바뀌고 액션 근처에 컴팩트한 토스트/상태가 나타난다.

### Image Prompt Card

- 이미지 프롬프트 갤러리 카드는 masonry 레이아웃을 쓴다. 미디어 프레임 폭은 카드 열을 따르고,
  높이는 실제 이미지 종횡비를 따른다.
- 빈 이미지 프롬프트 카드는 안정적인 최소 높이를 가진 컴팩트하고 의도된 플레이스홀더를 써서
  빈 업로드 슬롯이 무너지지 않게 한다.
- 빈 미디어 프레임은 여전히 깨진 업로드 슬롯이 아니라 의도된 예시/플레이스홀더처럼 보여야 한다.
- 프리뷰 이미지는 컴팩트 갤러리 카드에서 `width: 100%`와 `height: auto`를 쓴다. 일반 갤러리
  썸네일을 고정 정사각으로 자르지 않는다.
- 극단적으로 세로 긴 이미지는 갤러리에서 보수적인 썸네일 max-height 가드를 쓸 수 있으나,
  일반적인 경우는 여전히 세로 긴 이미지를 정사각이나 넓은 이미지보다 높은 카드로 보여야 한다.
  상세 뷰는 더 크거나 전체 이미지를 별도로 보일 수 있다.

### Example and Empty Cards

- 예시 카드는 다른 아이템과 같은 흐름으로 편집/삭제할 수 있는 실제 저장 샘플 데이터여야 한다.
- 빈 상태는 가능한 경우 섹션의 다음 액션을 포함해야 한다.
- 저장 아이템으로 관리할 수 없는 DOM 전용 가짜 예시를 추가하지 않는다.

### Modals

- 모달 표면은 `--surface-panel`, `--border-default`, Level 2 그림자를 쓴다.
- 폼 필드는 흰 표면, 4px~6px radius, 보이는 포커스 링을 쓴다.
- 모달 헤더와 액션은 컴팩트하게 유지한다. 상세 헤더는 두 행으로 쌓는다: 첫 행에 타입 뱃지와
  아이콘 액션, 둘째 행에 아이템 제목(`h2`, 한 줄 clamp)을 두어 제목이 카드처럼 상단에 오게 한다.
  편집/추가 헤더는 뱃지와 아이콘 액션만 보이고 제목 텍스트나 "편집"/"새 항목" 레이블은 두지
  않는다. 제목은 중복을 피하려고 폼의 제목 입력이 소유한다. 편집/추가 푸터는 파괴적, 취소,
  확인 액션을 안정적인 좌→우 순서로 유지한다.
- 상세 콘텐츠는 제목 헤더로 시작한 뒤, 카드 순서로 주요 콘텐츠를 잇는다: 프롬프트 본문
  (레포는 대신 GitHub 열기 링크), 이미지 프리뷰, 메모, 태그, 구분선, 그리고 마지막으로 왼쪽에
  수정 날짜, 오른쪽에 선택적 출처 링크를 둔 조용한 메타데이터 행.
- 파괴적 액션은 텍스트 또는 테두리 강조를 먼저 쓴다. 상호작용이 요구하지 않는 한 두 번째
  채도 파괴 팔레트를 더하지 않는다.

## 6. Motion & Interaction

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 120ms | ease-out | 탭, 칩, 버튼 색상 피드백 |
| Surface | 160ms | ease-out | 카드 테두리/그림자 강조 |

Rules:

- color, border-color, background-color, opacity, transform만 애니메이션한다.
- 모션은 상호작용이나 상태를 전달해야 한다. 장식성 모션을 더하지 않는다.
- 카드 hover는 부드러운 그림자와 함께 `translateY(-2px)`를 쓸 수 있다. 복사·저장 확인은
  레이아웃을 흔들지 않는 컴팩트한 상태/토스트 피드백을 쓴다.
- `prefers-reduced-motion`을 존중해 비필수 트랜지션을 끈다.
- 참조물의 큰 press 스케일링을 피한다. 버튼에는 최대 `scale(0.98)`만 쓴다.

## 7. Depth & Surface

### Strategy

따뜻한 대비, 헤어라인 테두리, 매우 부드러운 그림자를 쓴다. 표면은 유리, 네온, 검은 대시보드가
아니라 종이와 카드처럼 느껴져야 한다.

| Level | Treatment | Usage |
|-------|-----------|-------|
| Base | `--surface-base` | 앱 배경 |
| Panel | `--surface-panel` plus `--border-subtle` | 헤더, 콘텐츠 패널 |
| Card | `--surface-panel` plus `--border-default` | 갤러리 카드 |
| Soft elevated | `0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)` | hover된 카드, 팝오버 |
| Modal | `0 20px 60px rgba(0,0,0,0.14)` | 다이얼로그 |

### Reference Translation Notes

- 소스 방향: `_temp/DESIGN-notion.md`.
- 채택: 따뜻한 종이 캔버스, 흰 카드, 준-검정 텍스트, 블루 주요 액션, 속삭이는 테두리,
  절제된 레이어드 뎁스.
- 거부: Notion 마케팅 히어로, 가격/인증/장바구니 예시, 독점 폰트 의존, 음수 자간,
  넓은 홍보성 콘텐츠 패턴.
- 이 앱을 위해 추가: 반응형 auto-fit 프롬프트/워크플로/레포 갤러리 카드, 자연 비율 masonry
  이미지 프롬프트 카드, 섹션 단위 추가 액션, 이미지 프롬프트 빈/예시 카드, 그리고 앱 특화
  topbar/tab/tag/modal 규칙.
