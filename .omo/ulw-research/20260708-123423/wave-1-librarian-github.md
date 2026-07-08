# Wave 1 - GitHub-backed data store

## Key Findings
- GitHub repository as a source of truth is portable and easy to back up, but weak as a live CRUD data store for a non-developer.
- GitHub Pages has 1 GB published site limit, 100 GB/month soft bandwidth limit, and 10 builds/hour soft limit.
- GitHub regular repository files warn above 50 MiB and block above 100 MiB; repositories should ideally remain under 1 GB and under 5 GB is strongly recommended.
- GitHub Contents API supports create/update/delete, but write operations require Contents write permission and serial write handling.
- raw.githubusercontent.com unauthenticated requests are subject to updated rate limits, so it is not a stable primary image preview CDN.

## Sources
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github
- https://docs.github.com/en/rest/repos/contents
- https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/

## EXPAND
- LEAD: GitHub Pages에서 직접 CRUD 워크플로를 붙일 때의 실제 사용자 경험과 실패 모드 — WHY: 비개발자 운영 가능성 판단에 가장 직접적임 — ANGLE: GitHub API writes from static frontend.
- LEAD: raw.githubusercontent.com의 캐시/429 패턴이 브라우저·지역·헤더별로 어떻게 달라지는지 — WHY: 이미지 프리뷰의 체감 안정성을 가늠해야 함 — ANGLE: GitHub raw unauthenticated rate limits.
- LEAD: GitHub API로 JSON+이미지를 repo에 쓰는 최소 권한 설계 — WHY: 토큰 운영 부담과 보안 부담을 정량화해야 함 — ANGLE: fine-grained PAT Contents write.
