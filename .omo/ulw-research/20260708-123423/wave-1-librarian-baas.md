# Wave 1 - BaaS

## Key Findings
- Supabase is better aligned than Firebase for a small personal CRUD gallery because prompts/workflows/tags/favorites fit Postgres, while image files fit Supabase Storage.
- Supabase Free includes 500 MB database quota, 1 GB storage, 5 GB egress, and 50,000 MAU, but free projects can pause after inactivity.
- Firebase Firestore has generous no-cost reads/writes for personal use, and Firebase Storage has no-cost quotas, but backup/export requires billing and Cloud Storage setup.
- Firebase can work, but the operational surface is split across Firestore, Storage, Auth, Billing, and export/import.

## Sources
- https://supabase.com/docs/guides/platform/billing-on-supabase
- https://supabase.com/docs/guides/platform/database-size
- https://supabase.com/docs/guides/storage/pricing
- https://supabase.com/docs/guides/platform/manage-your-usage/egress
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/firestore/quotas
- https://firebase.google.com/docs/firestore/manage-data/export-import

## EXPAND
- LEAD: Firebase Cloud Storage의 실제 백업/복구 루트 — WHY: Firestore 데이터만으로는 이미지 파일 운영비와 복구 난이도를 판단할 수 없음 — ANGLE: Firebase export/import and Cloud Storage.
- LEAD: Supabase 무료 플랜의 7일 비활성화/일시정지 실제 운영 영향 — WHY: 개인 프로젝트의 유지비와 자동 중단 리스크를 결정함 — ANGLE: Supabase free project pausing.
- LEAD: Cloudflare Pages에서 Supabase/Firebase를 붙인 실전 배포 패턴 — WHY: 프론트 호스팅과 BaaS 조합의 작업량 차이를 판단 — ANGLE: static app SDK integration.
