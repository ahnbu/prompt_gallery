# PROJECT KNOWLEDGE BASE

**Generated:** 2026-07-09 15:44 KST
**Commit:** 54f859c
**Branch:** main

## OVERVIEW

Prompt Gallery is a Vite React app backed by a Cloudflare Worker API. The same repo owns
the UI, Worker routes/repositories, D1 migrations, R2 preview handling, and QA scripts.

## STRUCTURE

```markdown
prompt-gallery/
├── src/client/        # React app shell, gallery cards, modals, client parsing
├── src/worker/        # Cloudflare Worker API, D1/R2 repositories, worker tests
├── scripts/qa/        # Playwright/API/deploy verification scripts
├── migrations/        # D1 schema migrations
├── _docs/             # specs, implementation notes, review reports
├── DESIGN.md          # binding UI design rules
├── wrangler.jsonc     # Worker, asset, D1, and R2 bindings
└── vitest.worker.config.ts
```

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| UI shell, tabs, search, modals | `src/client` | Follow `DESIGN.md` before visual changes. |
| API routing | `src/worker/index.ts`, `*-routes.ts` | Worker fetch handler dispatches by first path segment. |
| Input validation | `src/worker/*-input.ts` | Return `ApiError` with project error codes. |
| Persistence | `src/worker/*-repository.ts` | D1 access and domain joins live here. |
| Asset preview | `src/worker/asset-*` | R2 is private; previews go through Worker proxy. |
| Browser QA | `scripts/qa/browser-*.mjs` | Scenario scripts use Playwright and fixture helpers. |
| API QA | `scripts/qa/api-*.mjs` | Smoke tests run against local/dev API surface. |
| Deployment checks | `scripts/qa/deploy-check.mjs` | Verifies Wrangler auth, D1, R2, and build output. |

## CODE MAP

| Symbol | Type | Location | Role |
| --- | --- | --- | --- |
| `App` | React component | `src/client/App.tsx` | App state, fetch lifecycle, tab/search/tag orchestration. |
| `GalleryResults` | React component | `src/client/GalleryList.tsx` | Switches sectioned gallery vs unified result grid. |
| `GalleryCard` | React component | `src/client/GalleryCard.tsx` | Card display and card-level actions. |
| `fetchGalleryData` | function | `src/client/gallery-data.ts` | Reads `/api/items`, `/api/tags`, `/api/workflows` and parses payloads. |
| `filteredCardEntries` | function | `src/client/gallery-model.ts` | Tab, tag, and search filtering. |
| `handleRequest` | function | `src/worker/index.ts` | Worker request router and error boundary. |
| `applyMigrations` | test helper | `src/worker/apply-migrations.test-support.ts` | Injects D1 migrations into worker tests. |

## CONVENTIONS

- Package manager is `pnpm@11.7.0`.
- TypeScript is strict: no `any`, no non-null assertions, no parameter reassignment.
- Biome uses 2 spaces, double quotes, 100-column line width, and no mandatory semicolons.
- Prefer `import type` where required by Biome.
- Worker tests are only `src/worker/**/*.test.ts` and always use `vitest.worker.config.ts`.
- `wrangler.jsonc` is the deployment contract: Worker entry `src/worker/index.ts`, assets
  `./dist/client`, D1 binding `DB`, R2 binding `PREVIEWS`.
- Generated/runtime directories are not source: `.omo`, `.wrangler`, `dist`, `node_modules`,
  `_temp`, and `_handoff`.

## ANTI-PATTERNS

- Do not reuse `color-db`; it is documented as reference-only.
- Do not make the R2 bucket public. Preview images must stay behind Worker proxy routes.
- Do not store original uploaded images as a product feature unless the scope changes.
- Do not add Cloudflare Images or Google Drive preview assumptions to the initial path.
- Do not turn the app into a marketing page. The first viewport is the working surface.
- Do not use fake DOM-only example cards; examples must be saved data that can be edited/deleted.
- Do not use strikethrough rows in `BACKLOG.md`; completed backlog rows are removed.

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

- No GitHub Actions workflow is present in this repo.
- `DESIGN.md` is a strong constraint for UI changes, not optional inspiration.
- If a change touches persistent data shape or generated storage behavior, update the plan with
  migration/reprocessing and verification details before implementation.
