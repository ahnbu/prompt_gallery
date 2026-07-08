---
slug: prompt-gallery-implementation
status: execution-ready
intent: clear
review_required: false
pending-action: execute .omo/plans/prompt-gallery-implementation.md only after explicit start-work instruction
approach: Build a React/Vite Cloudflare Workers Static Assets app with Worker API, D1 metadata storage, R2 preview storage, browser QA, wave-end verification, and wave-end cp commits.
---

# Draft: prompt-gallery-implementation

## Components (topology ledger)

| id | outcome | status | evidence path |
|---|---|---|---|
| C1 | Cloudflare React/Vite Workers app scaffold runs locally and builds for deploy | active | _docs/20260708_02_prompt-gallery_저장-배포-리서치.md:47 |
| C2 | D1 schema and Worker API support items, tags, favorites, workflows, and repos | active | _docs/20260708_02_prompt-gallery_저장-배포-리서치.md:51 |
| C3 | R2-backed image preview upload, replacement, deletion, and protected retrieval work through Worker API | active | _docs/20260708_02_prompt-gallery_저장-배포-리서치.md:60 |
| C4 | Browser UI supports search, tabs, AND tag filters, cards, modals, copy, favorites, tag management, workflows, and repo opening | active | _docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:23 |
| C5 | Backup/export, deployment readiness, evidence capture, and wave-end commits are repeatable | active | _docs/20260708_02_prompt-gallery_저장-배포-리서치.md:150 |

## Open assumptions (announced defaults)

| assumption | adopted default | rationale | reversible? |
|---|---|---|---|
| Authentication | Do not implement app-level login in phase 1; require Cloudflare Access before public deployment | Research says the app is personal and should not be public; Access avoids storing credentials in app code | yes |
| R2 preview serving | Serve preview images through Worker proxy at `/api/assets/:id/content`, not public R2 bucket | Keeps private app posture and avoids public bucket policy decisions | yes |
| Image storage | Store compressed preview only; do not retain original uploaded file | SPEC treats preview as optional, and research excludes heavy image pipelines | yes |
| Preview format | Browser compresses to WebP where supported, JPEG fallback allowed | Keeps R2 storage small and card loading fast | yes |
| Environments | Implement local dev and production config; defer separate staging | Personal phase 1 does not need extra Cloudflare resource management | yes |
| Error display | Inline field errors for validation, toast/banner for API and upload failure | Non-developer UI needs direct language, not technical errors | yes |
| Backup | Add local/manual backup/export commands, not scheduled CI | Scheduling needs account/secret decisions not required for first usable app | yes |
| Cloudflare remote resources | Use existing `prompt-gallery-db` D1 database and `prompt-gallery-previews` R2 bucket | Verified by Wrangler against the logged-in Cloudflare account on 2026-07-08 KST | yes |
| Package manager | Use pnpm | Global rule says pnpm unless repo specifies otherwise; this repo has no package manager yet | yes |

## Findings (cited - path:lines)

- The app goal is a personal work hub for prompts, image prompts, workflows, and repos, not a simple archive: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:15`.
- Required user-facing scope includes search, tabs, AND tag filters, copy body only, minimal add flow, tag management, workflow steps, GitHub open, image preview, detail modal CRUD, delete confirmation, explicit save, and favorites: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:23`.
- The UI success criteria require real browser-visible flows for search, copy, add, edit, workflow creation, repo opening, tag management, image empty state, and favorites: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:43`.
- Phase 1 must avoid local folder open, public/collaboration features, Cloudflare Images, and Google Drive as preview source: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:54`.
- The chosen architecture is Cloudflare Workers + Static Assets + Vite + D1 + R2: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:11`.
- Worker API routes are `/api/items`, `/api/tags`, `/api/workflows`, and `/api/assets`; D1 stores metadata and R2 stores previews: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:47`.
- Static assets should be served directly and only `/api/*` should execute Worker code: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:77`.
- Image previews should be compressed before upload, stored in R2, and represented in D1 by metadata and object key only: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:103`.
- Backup must combine D1 dump, R2 sync, manifest, app export, and deletion/upload consistency handling: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:150`.
- Context7 Cloudflare Workers SDK docs confirm `@cloudflare/vite-plugin` belongs in `vite.config.ts`, Worker config uses `main`, R2 bindings are declared in Wrangler config, and D1 migrations can be applied in worker tests through `@cloudflare/vitest-pool-workers`.
- `_docs/20260708_03_cloudflare-환경세팅-구현착수.md` records Cloudflare setup values for implementation: D1 `prompt-gallery-db`, R2 `prompt-gallery-previews`, binding names `DB` and `PREVIEWS`, and Worker proxy preview path `/api/assets/:id/content`.
- Current Wrangler verification on 2026-07-08 KST confirmed the logged-in account can list D1 `prompt-gallery-db` and R2 `prompt-gallery-previews`; `color-db` remains a reference-only database and must not be used.

## Decisions (with rationale)

- Build a single full-stack Cloudflare Workers app, not separate static site plus API, because local dev should exercise Worker API, D1, and R2 bindings close to production.
- Use TypeScript end to end because Worker bindings, D1 row contracts, and UI state need compile-time checks.
- Use a small domain layer around D1/R2 access rather than embedding SQL in route handlers so tests can target behavior without duplicating UI code.
- Use API-first TDD for D1/R2 contracts, then Playwright browser QA for user flows.
- Use wave-end commits with the `cp` skill only, after verification and security gate, to match the user's commit workflow.

## Scope IN

- React/Vite/TypeScript app scaffold for Cloudflare Workers Static Assets.
- Worker API for health, items, tags, favorites, workflows, repos, and assets.
- D1 migrations, seed data, repository layer, validation, and export/dump helpers.
- R2 preview upload, replacement, deletion, metadata storage, and protected retrieval.
- Browser UI for integrated search, compact tabs, AND tag filters, cards, detail modal CRUD, explicit save, delete confirmation, copy body only, favorites, tag management, workflows, repos, image prompt gallery, and no-image state.
- Local verification scripts, Playwright browser QA, API smoke checks, build/type/lint/test commands, evidence files.
- Deployment readiness for Cloudflare Workers with local production build and Wrangler checks; actual public deployment remains gated by account/auth readiness.
- Wrangler config must bind D1 as `DB` using `prompt-gallery-db` and R2 as `PREVIEWS` using `prompt-gallery-previews`.

## Scope OUT (Must NOT have)

- No app-level multi-user auth, roles, collaboration, teams, sharing, or public gallery.
- No local folder open, local path display/copy, or desktop-only integration.
- No Cloudflare Images, Google Drive preview source, GitHub raw preview source, Supabase, Firebase, Electron, or Tauri.
- No direct image storage in D1.
- Do not use `color-db`; it is reference-only.
- No automatic scheduling/CI backup unless separately requested.
- No commit through raw `git add`/`git commit`; use `cp` skill.

## Open questions

None blocking. Defaults above are explicit and reversible.

## Approval gate

status: execution-ready
approval: User asked to continue with the original OMO workflow after discussing `.omo/plans` as the correct source of truth.
