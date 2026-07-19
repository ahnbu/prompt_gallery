# WORKER KNOWLEDGE BASE

## OVERVIEW

Prompt Gallery의 Cloudflare Worker API. 라우팅, D1 영속화, R2 프리뷰 저장, 입력 검증,
마이그레이션 기반 테스트, asset 프록시를 소유한다.

## STRUCTURE

```markdown
src/worker/
├── index.ts                         # fetch 핸들러와 라우트 분기
├── item-*, tag-*, workflow-*         # 도메인별 input, routes, repository, types
├── asset-*                          # 업로드 검증, R2 routes, orphan 처리
├── *.test.ts                        # Vitest worker-pool 테스트
└── apply-migrations.test-support.ts # 테스트용 D1 마이그레이션 셋업
```

## WHERE TO LOOK

| 작업 | 위치 | 비고 |
| --- | --- | --- |
| 라우트 분기 | `index.ts` | 첫 경로 세그먼트가 도메인 라우트로 매핑된다. |
| 아이템 CRUD/즐겨찾기/태그 | `item-routes.ts`, `item-repository.ts`, `item-input.ts` | 아이템/태그 조인과 이미지 asset 참조를 처리. |
| 태그 이름변경/병합 | `tag-routes.ts`, `tag-repository.ts`, `tag-input.ts` | 병합 규칙은 repository/input 계층에 있다. |
| 워크플로 스텝 | `workflow-routes.ts`, `workflow-repository.ts`, `workflow-input.ts` | 스텝 위치는 양수이며 고유하다. |
| Asset 업로드/프록시/삭제 | `asset-routes.ts`, `asset-repository.ts`, `asset-validation.ts` | R2 오브젝트 키와 콘텐츠 검증. |
| Export | `export-routes.ts` | 갤러리 export 응답을 구성. |
| Schema | `../../migrations/0001_initial.sql` | D1 테이블과 제약. |
| Tests | `*.test.ts` | 마이그레이션 셋업을 갖춘 worker-pool 테스트. |

## CONVENTIONS

- Worker env 바인딩은 D1용 `DB`, R2용 `PREVIEWS`, 정적 asset용 `ASSETS`다.
- API 에러는 `invalid_item`, `invalid_tag`, `invalid_workflow`, `invalid_asset`,
  `invalid_json` 같은 안정적인 코드를 담은 `ApiError`를 쓴다.
- input 모듈은 요청 경계를 검증한다. repository는 검증된 도메인 입력을 전제한다.
- D1 SQL은 명시적으로, repository 모듈에 국한해 유지한다.
- 테스트는 `pnpm test:worker`로 실행한다. config는 `src/worker/**/*.test.ts`만 포함한다.
- 테스트는 `vitest.worker.config.ts`의 `TEST_MIGRATIONS`로 마이그레이션을 받는다.

## ANTI-PATTERNS

- 프리뷰 이미지에서 Worker 프록시를 우회하지 않는다. R2는 비공개로 유지해야 한다.
- asset 콘텐츠를 확장자만으로 받지 않는다. `asset-validation.ts`가 바이트와 타입을 검사한다.
- `color-db`를 참조하지 않는다. 현재 D1 데이터베이스는 `prompt-gallery-db`다.
- 마이그레이션과 worker 테스트 없이 스키마에 영향을 주는 동작을 추가하지 않는다.
- 라우트 핸들러가 `ApiError`의 status/code 세부를 조용히 삼키게 두지 않는다.

## VERIFY

```bash
pnpm test:worker
pnpm typecheck
pnpm deploy:check
```
