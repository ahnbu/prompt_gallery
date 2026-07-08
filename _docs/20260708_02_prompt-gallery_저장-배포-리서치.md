---
title: Prompt Gallery 저장-배포 리서치
created: 2026-07-08 13:31
session_id: codex:019f3fc9-c216-71a0-9850-b9848c97bdcf
session_path: C:/Users/ahnbu/.codex/sessions/2026/07/08/rollout-2026-07-08T12-33-41-019f3fc9-c216-71a0-9850-b9848c97bdcf.jsonl
ai: codex
---

# 1. 결론

1차 권장안은 **Cloudflare Workers + Static Assets + Vite + D1 + R2**다.

- **Workers + Static Assets**: React/Vite 앱 화면과 API를 같은 Cloudflare Workers 런타임 안에서 다룬다.
- **Vite plugin**: 로컬 개발 때 프론트와 Worker API, Cloudflare binding을 production과 가깝게 확인한다.
- **D1**: 프롬프트, 이미지 프롬프트, Workflow, 레포, 태그, 자동 분류 키워드, 즐겨찾기 같은 구조화 메타데이터를 저장한다.
- **R2**: 사용자가 웹사이트에서 업로드하는 JPG/PNG preview 파일을 저장한다.

기존 리서치 초안은 `Cloudflare Pages + D1 + R2`를 1차 권장안으로 썼다. 이는 사용자가 제시한 검토 선택지에 Pages 조합이 명시되어 있었고, 정적 UI 배포 관점에서는 Pages가 자연스럽기 때문이었다. 그러나 이후 배포·DB 레슨런 문서와 현재 Cloudflare Workers 흐름을 반영하면, 이 앱은 정적 사이트보다 **CRUD와 파일 업로드가 있는 개인용 웹앱**에 가깝다. 따라서 신규 구현은 Pages Functions보다 **Workers + Static Assets + Vite**를 우선하는 편이 맞다.

제외 판단:
- **정적 웹앱 + 로컬 JSON/이미지**: 브라우저 파일 쓰기와 다기기 접근이 약하다.
- **정적 웹앱 + GitHub repo 저장**: 백업·이관은 좋지만 live CRUD와 preview 로딩 원천으로는 불안정하다.
- **Pages + D1/R2**: 가능하지만 신규 CRUD 앱에서는 Vite 개발 흐름과 API/DB binding 확인이 Workers 쪽보다 덜 자연스럽다.
- **D1 단독**: 텍스트·태그·Workflow 저장에는 맞지만, 사용자가 JPG/PNG 썸네일을 업로드하는 UX에는 부적합하다.
- **R2 단독**: 이미지 파일 저장에는 맞지만, 검색/태그/Workflow 관계형 데이터 관리가 불편하다.
- **BaaS**: Supabase는 좋은 fallback이지만 Cloudflare-native 구조보다 외부 운영면이 하나 늘어난다. Firebase는 Firestore/Storage/Auth/Billing/export가 나뉘어 비개발자 운영 부담이 더 크다.
- **Electron/Tauri**: 로컬 파일 제약은 해결하지만 모바일/다른 PC 접근과 배포 운영이 무거워진다.

# 2. 비교표

| 선택지 | 개인용 적합 | CRUD 쉬움 | 이미지 업로드 | 비용 효율 | 백업/이관 | 보안 제약 회피 | Workers 궁합 | 다기기 접근 | 구현 단순성 | 비개발자 운영 |
|---|---|---|---|---|---|---|---|---|---|---|
| 정적+로컬 JSON/이미지 | ████░░ | ██░░░░ | ❌ | ██████ | ████░░ | ❌ | ██░░░░ | ❌ | ████░░ | ██░░░░ |
| 정적+GitHub repo | ████░░ | ██░░░░ | ██░░░░ | ██████ | ✅ | ⚠️ | ██░░░░ | ████░░ | ██░░░░ | ██░░░░ |
| Pages+D1 | ████░░ | ████░░ | ❌ | ██████ | ████░░ | ✅ | ████░░ | ██████ | ████░░ | ████░░ |
| Pages+R2 | ████░░ | ██░░░░ | ✅ | ██████ | ████░░ | ✅ | ████░░ | ██████ | ████░░ | ████░░ |
| Pages+D1+R2 | ████░░ | ✅ | ✅ | ██████ | ████░░ | ✅ | ████░░ | ✅ | ████░░ | ████░░ |
| Workers+D1 | ████░░ | ✅ | ❌ | ██████ | ████░░ | ✅ | ✅ | ✅ | ████░░ | ████░░ |
| Workers+D1+R2 | ✅ | ✅ | ✅ | ██████ | ████░░ | ✅ | ✅ | ✅ | ████░░ | ████░░ |
| Supabase/Firebase | ████░░ | ✅ | ✅ | ████░░ | ████░░ | ✅ | ████░░ | ✅ | ████░░ | ████░░ |
| Electron/Tauri | ████░░ | ✅ | ✅ | ████░░ | ████░░ | ✅ | ❌ | ██░░░░ | ██░░░░ | ██░░░░ |

> 정렬 기준: 이 앱은 개인용이지만 “웹 UI에서 프롬프트와 썸네일을 추가·수정·삭제하고, 다른 PC에서도 같은 데이터를 보는 것”이 핵심이다. 따라서 정적 호스팅보다 API/DB/파일 업로드가 한 런타임에서 확인되는 Workers 조합이 가장 유리하다.

# 3. 권장 아키텍처

- Frontend: **Workers Static Assets**로 React/Vite 앱을 배포한다.
- Development: **Cloudflare Vite plugin**으로 프론트와 Worker API를 함께 개발한다.
- Runtime/API: **Cloudflare Worker**.
  - `/api/items`: 프롬프트, 이미지 프롬프트, 레포 항목 CRUD.
  - `/api/tags`: 태그, 색상, 자동 분류 키워드 CRUD.
  - `/api/workflows`: Workflow와 ordered steps CRUD.
  - `/api/assets`: preview 이미지 업로드, 교체, 삭제.
- DB: **D1**.
  - `items`: type, title, body, notes, github_url, image_key, favorite, created_at, updated_at.
  - `tags`, `tag_keywords`, `item_tags`.
  - `workflows`, `workflow_steps`: ordered steps with prompt/repo/memo/link references.
- Asset: **R2**.
  - preview images: `previews/<item_id>/<filename>`.
  - D1에는 R2 object key와 dimensions/size/hash만 저장한다.
- Auth: 1차는 Cloudflare Access 또는 단일 사용자 보호. 공개 앱처럼 만들지 않는다.

라우팅 원칙:

```markdown
정적 파일 요청
→ Static Assets가 바로 응답

/api/* 요청
→ Worker script 실행
→ D1/R2 binding 사용
```

정적 파일까지 모두 Worker script가 처리하게 만들면 API 사용량 한도를 불필요하게 쓴다. 따라서 앱 화면 파일은 Static Assets가 직접 서빙하고, 데이터 조회·저장·수정·삭제와 이미지 업로드만 Worker API가 처리하게 둔다.

# 4. 비용/운영 리스크

- Workers Static Assets의 정적 asset 요청은 무료·무제한이고, asset 저장 추가 비용도 없다.
- Worker script 요청은 Workers Free/Paid quota를 쓴다. `/api/*`만 Worker가 처리하도록 라우팅해야 비용·한도 관리가 깔끔하다.
- D1 Free는 5M rows read/day, 100K rows written/day, 5 GB account storage, DB당 500 MB 제한이다. 개인용 메타데이터에는 충분하지만 이미지 파일 저장에는 쓰면 안 된다.
- R2는 10 GB-month, Class A 1M, Class B 10M free tier가 있고 egress bandwidth 요금은 없지만, 읽기/쓰기 operation quota는 있다.
- D1+R2 조합은 저장소가 2개라 운영 대상이 늘어난다. 이 복잡도는 D1 dump와 R2 sync를 하나의 백업 스크립트로 묶고, 이미지 삭제/교체 API에서 D1 record와 R2 object를 함께 처리해 낮춘다.
- Cloudflare Images는 변환/저장/전송 과금이 따로 붙으므로 초기 기본값으로 제외한다.
- Supabase는 Free에서 DB 500 MB, Storage 1 GB, egress 5 GB가 가능하지만 inactivity pause와 외부 운영면이 있다.
- Firebase는 Firestore/Storage 무료 quota가 있지만 export/import에 billing과 Cloud Storage bucket이 필요해 운영이 더 복잡하다.

# 5. 이미지 preview 처리 방안

이미지 프롬프트 갤러리의 사용자 기대는 URL 붙여넣기가 아니라 다음 흐름이다.

```markdown
프롬프트 입력
→ 내 PC의 JPG/PNG 선택
→ 저장
→ 카드에 썸네일 표시
```

따라서 이미지 preview를 1차 기능으로 제대로 넣는다면 D1 단독은 맞지 않고, R2 같은 파일 저장소가 필요하다.

- 기본: 브라우저에서 업로드 전 1200px 이하 WebP/JPEG로 압축한 preview를 R2에 저장한다.
- D1에는 이미지 파일 자체가 아니라 `image_key`, `width`, `height`, `size`, `content_type`, `hash` 같은 메타데이터만 저장한다.
- 이미지 없는 카드: 기존 SPEC대로 lucide 아이콘 + 짧은 문구만 표시한다.
- Google Drive: backup/archive 용도만 허용한다. Drive API의 `thumbnailLink`는 short-lived이고 CORS 때문에 웹앱 직접 preview 원천으로 부적합하다.
- GitHub raw: preview 원천으로 비권장한다. GitHub가 raw.githubusercontent.com 무인증 요청 제한을 강화했고, 이미지가 늘면 429/캐시/대역폭 문제가 난다.

단계적 fallback:

```markdown
이미지 preview 업로드를 1차에서 제외한다:
Workers + Static Assets + D1로 시작 가능

사용자가 웹에서 JPG/PNG를 업로드해야 한다:
Workers + Static Assets + D1 + R2가 필요
```

# 6. D1+R2를 함께 쓰는 이유

D1+R2는 비용만의 선택이 아니라 **데이터 성격을 분리하는 선택**이다.

| 데이터 | 성격 | 저장 위치 |
|---|---|---|
| 프롬프트 본문 | 검색·복사·수정 대상 텍스트 | D1 |
| 태그와 자동 분류 키워드 | 필터·관리·관계 데이터 | D1 |
| 즐겨찾기 | 빠른 토글 상태 | D1 |
| Workflow 단계 | 순서와 참조 관계 | D1 |
| GitHub repo URL | 링크와 메타데이터 | D1 |
| JPG/PNG preview | 크고 바이너리인 파일 | R2 |
| R2 object key | 이미지 파일을 찾기 위한 주소표 | D1 |

D1에 이미지 자체를 넣는 것은 기술적으로 가능하지만 실사용 기준으로 부적합하다. DB가 빠르게 커지고, Free 기준 DB당 500 MB 제한에 가까워지며, 백업·조회·이관이 무거워진다. 반대로 R2에 JSON만 넣어 모든 데이터를 관리하면 태그 AND 필터, 즐겨찾기, Workflow 단계 수정, 동시 저장 정합성 관리가 불편해진다.

비유하면 D1은 목록표이고 R2는 파일함이다. 목록표에는 `previews/item-123/preview.webp`라는 파일 위치만 적고, 실제 이미지는 파일함에 둔다.

# 7. 백업/이관 방안

- D1: 정기 export 또는 dump 스크립트로 `backup/YYYYMMDD/d1.sql` 저장.
- R2: S3-compatible sync로 `backup/YYYYMMDD/r2/`에 내려받기.
- 통합 백업: `backup/YYYYMMDD/manifest.json`에 D1 dump 파일명, R2 prefix, 생성 시각, 앱 schema version을 함께 기록한다.
- 앱 내부: “내보내기” 버튼으로 `prompt-gallery-export.json` 생성. 이미지 포함은 ZIP 또는 R2 sync를 별도 안내한다.
- 삭제 정합성: 항목 삭제 API에서 D1 record 삭제와 R2 object 삭제를 같이 처리한다. R2 삭제 실패 시 재시도 queue나 orphan cleanup 스크립트가 필요하다.
- 업로드 정합성: R2 임시 업로드 후 D1 저장이 성공하면 확정하고, D1 저장 실패 시 임시 R2 object를 정리한다.
- GitHub repo 방식 fallback: JSON/이미지 저장소가 아니라 백업 mirror로만 사용한다.
- Supabase fallback: `pg_dump` + Storage 다운로드.
- Firebase fallback: Firestore export/import는 Blaze billing과 Cloud Storage bucket 필요.
- 로컬 앱 fallback: 데이터 폴더 전체 ZIP + 선택한 cloud drive 동기화.

# 8. 구현 전 추가 결정 질문

1. 앱을 Cloudflare Access 뒤에 둘 것인가, 앱 자체 로그인/비밀번호를 둘 것인가?
2. R2 preview를 public custom domain으로 서빙할 것인가, Worker proxy로 보호할 것인가?
3. 이미지 원본도 보관할 것인가, preview 압축본만 보관할 것인가?
4. preview 파일 형식은 원본 JPG/PNG 유지인가, WebP/JPEG 압축본 통일인가?
5. D1/R2를 dev/staging/prod로 분리할 것인가, 개인용 단일 production만 둘 것인가?
6. 업로드 실패, D1 저장 실패, R2 삭제 실패를 어떻게 사용자에게 보여줄 것인가?
7. 백업은 수동 버튼만 둘 것인가, 로컬 스크립트/CI로 정기 실행할 것인가?
8. Free D1 500 MB DB 한도 안에서 장기 운영할 것인가, Paid 전환 가능성을 열어둘 것인가?

# 9. 공식 문서 근거

- [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Workers Static Assets billing and limitations](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)
- [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare storage options](https://developers.cloudflare.com/workers/platform/storage-options/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Cloudflare R2 overview](https://developers.cloudflare.com/r2/)
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare R2 Workers API](https://developers.cloudflare.com/r2/api/workers/workers-api-usage/)
- [Cloudflare Images pricing](https://developers.cloudflare.com/images/pricing/)
- [Google Drive files API](https://developers.google.com/workspace/drive/api/reference/rest/v3/files)
- [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)
- [GitHub large files](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)
- [GitHub raw unauthenticated rate limit changelog](https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/)
