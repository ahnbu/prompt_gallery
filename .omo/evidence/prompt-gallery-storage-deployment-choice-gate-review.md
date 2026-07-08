# Prompt Gallery Storage/Deployment Gate Review

reviewedAt: 2026-07-08 KST

## recommendation

REJECT

## originalIntent

사용자는 개인용 Prompt Gallery의 저장/배포 방식을 결정하려고 했다. 최종 한국어 답변은 `Cloudflare Pages + D1 + R2`를 추천하되, 7개 옵션을 비교하고 다음 섹션을 포함해야 한다.

- conclusion
- comparison table
- recommended architecture
- cost/operation risk
- image preview handling
- backup/migration
- remaining questions

## desiredOutcome

비개발자인 개인 사용자가 실제 선택을 할 수 있도록, 7개 옵션을 모든 필수 기준으로 비교하고, 추천안의 비용·운영·이미지 preview·백업/마이그레이션 리스크를 과장 없이 설명해야 한다.

필수 비교 기준:

- 개인 적합성
- CRUD 난이도
- 이미지 preview 안정성
- 거의 0원 비용 가능성
- 백업/마이그레이션
- 브라우저 보안 제약
- Cloudflare Pages 적합성
- 모바일/다른 PC 접근성
- 구현 복잡도
- 비개발자 운영 난이도

## userOutcomeReview

추천 방향인 `Cloudflare Pages + D1 + R2`는 공식 문서 기준으로 타당하다. Pages는 정적 asset 요청이 Functions를 호출하지 않으면 무료·무제한이고, D1은 metadata 저장에 적합하며, R2는 image preview object storage에 적합하다.

다만 현재 검토 가능한 산출물은 최종 한국어 답변이 아니라 짧은 `SYNTHESIS.md`, `claim-ledger.md`, 일부 wave note뿐이다. 이 상태로는 사용자가 받게 될 최종 답변이 7개 섹션, 7개 옵션, 모든 필수 기준, 비용 caveat, 백업/마이그레이션 경로를 충족한다고 승인할 수 없다.

또한 D1 claim은 Free plan 문맥에서 안전하지 않다. D1 pricing은 Free plan에 5M reads/day, 100K writes/day, 5 GB total storage를 제공한다고 설명하지만, D1 limits table은 maximum database size를 `10 GB (Workers Paid) / 500 MB (Free)`로 구분한다. 최종 답변이 "D1 DB max 10 GB"를 Free plan 추천 근거처럼 쓰면 오도된다.

## checked artifact paths

- `D:/vibe-coding/prompt-gallery/_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md`
- `D:/vibe-coding/prompt-gallery/.omo/ulw-research/20260708-123423/NOTEPAD.md`
- `D:/vibe-coding/prompt-gallery/.omo/ulw-research/20260708-123423/claim-ledger.md`
- `D:/vibe-coding/prompt-gallery/.omo/ulw-research/20260708-123423/SYNTHESIS.md`
- `D:/vibe-coding/prompt-gallery/.omo/ulw-research/20260708-123423/wave-1-librarian-github.md`
- `D:/vibe-coding/prompt-gallery/.omo/ulw-research/20260708-123423/wave-1-librarian-baas.md`
- `D:/vibe-coding/prompt-gallery/.omo/ulw-research/20260708-123423/wave-1-librarian-local-app.md`
- `D:/vibe-coding/prompt-gallery/.omo/ulw-research/20260708-123423/expansion-log.md`
- `https://developers.cloudflare.com/pages/platform/limits/`
- `https://developers.cloudflare.com/pages/functions/pricing/`
- `https://developers.cloudflare.com/d1/platform/pricing/`
- `https://developers.cloudflare.com/d1/platform/limits/`
- `https://developers.cloudflare.com/r2/pricing/`
- `https://developers.cloudflare.com/r2/buckets/public-buckets/`
- `https://developers.cloudflare.com/images/pricing/`
- `https://developers.google.com/workspace/drive/api/reference/rest/v3/files`
- `https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits`
- `https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github`
- `https://docs.github.com/en/rest/repos/contents`
- `https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/`
- `https://firebase.google.com/pricing`
- `https://firebase.google.com/docs/firestore/quotas`
- `https://firebase.google.com/docs/firestore/manage-data/export-import`
- `https://supabase.com/docs/guides/platform/database-size`

## source spot-checks

- Cloudflare Pages limits: Free plan has 1 concurrent build, 500 builds/month, 20,000 files, and 25 MiB maximum single asset size.
- Cloudflare Pages Functions pricing: static asset requests are free and unlimited on free and paid plans when Functions are not invoked; Pages Functions count toward Workers quotas.
- Cloudflare D1 pricing: Free plan includes 5M rows read/day, 100K rows written/day, and 5 GB total storage.
- Cloudflare D1 limits: maximum database size is 10 GB on Workers Paid and 500 MB on Free; maximum account storage is 1 TB paid and 5 GB Free.
- Cloudflare R2 pricing: R2 charges storage plus Class A/B operations, has no egress bandwidth charges, and includes 10 GB-month storage, 1M Class A, 10M Class B monthly free tier for Standard storage.
- Cloudflare R2 public buckets: `r2.dev` is for non-production use cases; custom domains are required for caching, WAF, access controls, and similar production controls.
- Cloudflare Images pricing: Images adds transformation pricing, and stored/delivered image charges apply for Images Paid.
- Google Drive files API: `thumbnailLink` is short-lived, typically lasts hours, and is not intended for direct web app use because of CORS.
- GitHub docs: GitHub Pages, repository/file, Contents API, and unauthenticated raw request limits support the conclusion that GitHub is portable but weak as a live CRUD/image preview source.
- Firebase docs: Firestore/Storage can be viable under free quotas, but managed export/import requires billing/Blaze and Cloud Storage setup.
- Supabase docs: Free plan database size behavior supports Supabase as a viable fallback BaaS, with a 500 MB database quota before read-only mode.

## blockers

1. 최종 한국어 답변 산출물이 없다.
   - `SYNTHESIS.md`는 executive summary 수준이다.
   - 요청된 섹션 구조, 실제 문장, 출처 링크 배치, caveat 표현을 검토할 수 없다.

2. 7개 옵션의 완성된 비교표가 없다.
   - 필수 옵션: static webapp + local JSON/images; static webapp + GitHub repo JSON/images; Cloudflare Pages + D1; Cloudflare Pages + R2; Cloudflare Pages + D1 + R2; Supabase/Firebase BaaS; local Electron/Tauri app.
   - wave note는 일부 영역만 다루며, 최종 side-by-side matrix가 없다.

3. 10개 필수 기준이 옵션별로 매핑되어 있지 않다.
   - 사용자가 "왜 이 선택이 내 상황에 맞는지" 판단할 수 있는 coverage 증거가 없다.
   - compact table을 만들겠다는 계획만으로는 승인할 수 없다.

4. D1 Free plan 한계 표현이 안전하지 않다.
   - `claim-ledger.md`는 "5 GB total storage, with 10 GB max per database"를 verified로 기록했다.
   - 공식 limits는 Free maximum database size를 500 MB로 구분한다.
   - 최종 답변은 "Free: 5 GB account total, 500 MB max per DB; Paid: 10 GB max per DB"로 써야 한다.

5. 비용 표현에 과장 위험이 남아 있다.
   - Pages static asset 요청은 무료·무제한이 맞지만 Functions, D1 queries, R2 storage/operations는 별도 quota와 과금 경계가 있다.
   - R2는 egress fee가 없지만 storage와 Class A/B operation 비용이 있다.
   - 최종 답변은 "개인/저트래픽이면 free tier 안에서 거의 0원 가능"으로 제한해야 한다.

6. 백업/마이그레이션 경로가 충분히 정리되지 않았다.
   - Firebase export/import 근거는 있으나 D1 export, R2 object sync/export, Supabase backup, GitHub/local backup이 최종 matrix로 통합되어 있지 않다.
   - 추천 architecture에는 최소한 D1 SQL export + R2 bucket sync + manifest/versioning 백업 경로가 필요하다.

7. code-review report와 manual QA matrix가 제공되지 않았다.
   - 연구 결론이므로 코드 테스트는 요구하지 않는다.
   - 대신 final-answer coverage checklist가 필요하지만 현재 없다.

## exact evidence gaps

- 완성된 최종 한국어 답변 파일 또는 텍스트가 없다.
- 7개 옵션을 모두 포함한 compact comparison table이 없다.
- 10개 필수 기준의 row/column coverage map이 없다.
- D1 Free-vs-Paid database-size correction이 claim-ledger에 반영되지 않았다.
- R2 비용 caveat의 최종 문구가 없다.
- D1/R2 backup/export/restore 경로가 최종 architecture에 연결되어 있지 않다.
- remaining questions 섹션의 구체 항목이 없다.
- 별도 code-review report 또는 manual QA matrix가 없고, 그 안에 `remove-ai-slops`/`programming` 관점의 overfit/slop coverage도 없다.

## remove-ai-slops / programming direct pass

- Scope: research markdown artifacts only. Production code, code diff, and tests are N/A.
- remove-ai-slops result: code-test slop categories do not apply, but research slop remains. The artifacts compress evidence into "verified" labels without a complete final-answer coverage matrix, and the D1 limit claim is over-broad.
- programming result: code hygiene is N/A. The programming criteria still reject unsupported claims, scope drift, false confidence, and maintenance burden. Current artifacts would force the final answer writer to reconstruct required coverage from scattered notes.
- Report coverage result: no separate review report/manual QA matrix explicitly covers the same skill-perspective checks. This is a gate blocker under the final-review instructions.

## action required

- Draft the actual Korean final answer with the exact requested sections.
- Add one compact comparison table covering all 7 options and all 10 required criteria.
- Correct D1 wording to separate Free and Workers Paid database-size limits.
- Add R2 cost wording: no egress fee, but storage and Class A/B operations still matter beyond free tier.
- Add backup/migration paths for D1, R2, GitHub, Supabase/Firebase, and local app options.
- Add a final-answer QA checklist showing every required section, option, and criterion is present.
