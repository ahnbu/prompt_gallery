# Prompt Gallery

## 서비스 정보

> 최종 확인: 2026-07-22

| 항목 | 값 |
|---|---|
| 서비스 URL | https://prompt-gallery.byungwook-an.workers.dev/ |
| 상태 | ✅ 정상 |
| 호스팅 | Cloudflare Workers (SPA assets 바인딩) |
| DB | **Cloudflare D1** — `prompt-gallery-db` |
| 스토리지 | **Cloudflare R2** — `prompt-gallery-previews` (미리보기 이미지) |
| 인증 | ❌ 없음 |
| 외부 API | 없음 |
| 배포 방식 | `pnpm deploy:prod` — build → **D1 마이그레이션 적용(`--remote`)** → `deploy:check` → `wrangler deploy` |
| 필요 환경변수 | 없음 (시크릿은 `wrangler secret`으로 관리) |

> ⚠️ 배포는 반드시 `pnpm deploy:prod`로 수행할 것. 이 스크립트에 **원격 D1 마이그레이션과 배포 전 점검이 묶여 있다.** `wrangler deploy`만 단독 실행하면 스키마와 코드가 어긋난다.

---

프롬프트를 수집·분류·검색하는 웹 애플리케이션이다.

## 개발

```bash
pnpm dev          # 로컬 개발 서버 (127.0.0.1)
pnpm typecheck    # 타입 검사
pnpm lint         # Biome 검사
pnpm test         # Worker 테스트 (vitest)
```

## QA 스크립트

| 명령 | 용도 |
|---|---|
| `pnpm qa:api` | API 스모크 테스트 |
| `pnpm qa:browser` | 브라우저 스모크 테스트 |
| `pnpm backup:local` | 로컬 백업 |
| `pnpm deploy:check` | 배포 전 점검 |

## 관련 문서

- [[DESIGN]] — 설계 문서
- [[BACKLOG]] — 백로그
- [[CHANGELOG]] — 변경 이력
