# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-09 15:44 KST
**Commit:** 54f859c
**Branch:** main

## OVERVIEW

Prompt Gallery는 Cloudflare Worker API를 백엔드로 두는 Vite React 앱이다. 하나의 repo가
UI, Worker 라우트/repository, D1 마이그레이션, R2 프리뷰 처리, QA 스크립트를 모두 소유한다.

## STRUCTURE

```markdown
prompt-gallery/
├── src/client/        # React 앱 셸, 갤러리 카드, 모달, 클라이언트 파싱
├── src/worker/        # Cloudflare Worker API, D1/R2 repository, worker 테스트
├── scripts/qa/        # Playwright/API/배포 검증 스크립트
├── migrations/        # D1 스키마 마이그레이션
├── _docs/             # 스펙, 구현 노트, 검토 보고서
├── DESIGN.md          # 구속력 있는 UI 디자인 규칙
├── wrangler.jsonc     # Worker, asset, D1, R2 바인딩
└── vitest.worker.config.ts
```

## WHERE TO LOOK

| 작업 | 위치 | 비고 |
| --- | --- | --- |
| UI 셸, 탭, 검색, 모달 | `src/client` | 시각 변경 전 `DESIGN.md`를 따른다. |
| API 라우팅 | `src/worker/index.ts`, `*-routes.ts` | Worker fetch 핸들러가 첫 경로 세그먼트로 분기한다. |
| 입력 검증 | `src/worker/*-input.ts` | 프로젝트 에러 코드를 담은 `ApiError`를 반환한다. |
| 영속화 | `src/worker/*-repository.ts` | D1 접근과 도메인 조인이 여기 있다. |
| Asset 프리뷰 | `src/worker/asset-*` | R2는 비공개다. 프리뷰는 Worker 프록시를 거친다. |
| 브라우저 QA | `scripts/qa/browser-*.mjs` | 시나리오 스크립트는 Playwright와 fixture 헬퍼를 쓴다. |
| API QA | `scripts/qa/api-*.mjs` | 로컬/dev API 표면에 대한 smoke 테스트. |
| 배포 점검 | `scripts/qa/deploy-check.mjs` | Wrangler 인증, D1, R2, 빌드 출력을 검증한다. |

## CODE MAP

| 심볼 | 유형 | 위치 | 역할 |
| --- | --- | --- | --- |
| `App` | React 컴포넌트 | `src/client/App.tsx` | 앱 상태, fetch 생명주기, 탭/검색/태그 조율. |
| `GalleryResults` | React 컴포넌트 | `src/client/GalleryList.tsx` | 섹션형 갤러리와 통합 결과 그리드를 전환. |
| `GalleryCard` | React 컴포넌트 | `src/client/GalleryCard.tsx` | 카드 표시와 카드 단위 동작. |
| `fetchGalleryData` | 함수 | `src/client/gallery-data.ts` | `/api/items`, `/api/tags`, `/api/workflows`를 읽고 payload를 파싱. |
| `filteredCardEntries` | 함수 | `src/client/gallery-model.ts` | 탭, 태그, 검색 필터링. |
| `handleRequest` | 함수 | `src/worker/index.ts` | Worker 요청 라우터이자 에러 경계. |
| `applyMigrations` | 테스트 헬퍼 | `src/worker/apply-migrations.test-support.ts` | worker 테스트에 D1 마이그레이션을 주입. |

## CONVENTIONS

- 패키지 매니저는 `pnpm@11.7.0`이다.
- TypeScript는 strict다: `any` 금지, non-null 단언 금지, 파라미터 재할당 금지.
- Biome는 2칸 들여쓰기, 큰따옴표, 100칸 라인 폭, 세미콜론 비강제를 쓴다.
- Biome가 요구하는 곳에서는 `import type`를 우선한다.
- Worker 테스트는 `src/worker/**/*.test.ts`만 해당하며 항상 `vitest.worker.config.ts`를 쓴다.
- `wrangler.jsonc`가 배포 계약이다: Worker 엔트리 `src/worker/index.ts`, asset
  `./dist/client`, D1 바인딩 `DB`, R2 바인딩 `PREVIEWS`.
- 생성물/런타임 디렉토리는 소스가 아니다: `.omo`, `.wrangler`, `dist`, `node_modules`,
  `_temp`, `_handoff`.

## ANTI-PATTERNS

- `color-db`를 재사용하지 않는다. 참조 전용으로 문서화돼 있다.
- R2 버킷을 공개하지 않는다. 프리뷰 이미지는 Worker 프록시 라우트 뒤에 있어야 한다.
- 범위가 바뀌지 않는 한, 업로드 원본 이미지를 제품 기능으로 저장하지 않는다.
- 초기 경로에 Cloudflare Images나 Google Drive 프리뷰 전제를 추가하지 않는다.
- 앱을 마케팅 페이지로 만들지 않는다. 첫 뷰포트는 작업 표면이다.
- DOM에만 존재하는 가짜 예시 카드를 쓰지 않는다. 예시는 편집/삭제 가능한 저장 데이터여야 한다.
- `BACKLOG.md`에 취소선 행을 쓰지 않는다. 완료된 백로그 행은 삭제한다.

## COMMANDS

```bash
pnpm dev
pnpm build
pnpm typecheck
pnpm lint
pnpm test
pnpm qa:api
pnpm qa:browser
pnpm deploy:check
pnpm deploy:prod
```

## DEPLOYMENT

- 사용자가 배포를 요청하면 AI가 직접 `pnpm deploy:prod`로 배포한다.
  (`build` → 원격 D1 `migrations apply --remote` → `deploy:check` → `wrangler deploy` 순서)
- 배포 전 필수 통과: `pnpm typecheck && pnpm lint && pnpm test:worker && pnpm qa:browser && pnpm build`.
- 배포 전 확인:
  - Wrangler 인증 — `pnpm exec wrangler whoami`. 미인증이면 배포를 중단하고 사용자에게 로그인을 요청한다.
  - 원격 D1 미적용 마이그레이션 — `pnpm exec wrangler d1 migrations list prompt-gallery-db --remote`.
    미적용 마이그레이션이 있으면 스키마/데이터 영향을 먼저 사용자에게 보고한 뒤 진행한다.
- 배포 후 프로덕션 URL(`https://prompt-gallery.byungwook-an.workers.dev`)을 열어 반영을 확인한다.

## NOTES

- 이 repo에는 GitHub Actions 워크플로가 없다.
- 하위 폴더에 범위별 규칙 문서가 있다: client 세부 규칙은 `src/client/AGENTS.md`,
  worker 세부 규칙은 `src/worker/AGENTS.md`. 해당 폴더 작업 시 함께 참조한다.
- `DESIGN.md`는 UI 변경에 대한 강한 제약이며, 선택적 참고가 아니다.
- 영속 데이터 형태나 생성물 저장 동작을 건드리는 변경이면, 구현 전에 마이그레이션/재처리와
  검증 세부사항을 계획에 갱신한다.
