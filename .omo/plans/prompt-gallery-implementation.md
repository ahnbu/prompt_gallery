# prompt-gallery-implementation - Work Plan

## TL;DR (For humans)

**What you'll get:** 자주 쓰는 프롬프트, 이미지 프롬프트, Workflow, GitHub 레포를 한 화면에서 찾고, 저장하고, 복사하고, 다시 실행할 수 있는 개인용 웹앱을 만든다. 이미지 썸네일은 앱에서 업로드하고, 프롬프트와 태그 같은 목록 데이터는 검색과 필터가 되는 형태로 저장한다.

**Why this approach:** 이 앱은 정적 페이지가 아니라 저장, 수정, 삭제, 이미지 업로드가 있는 개인용 작업 도구다. 그래서 Cloudflare Workers 앱 안에서 화면, API, D1 저장소, R2 이미지 저장소를 함께 검증하는 구조가 맞다.

**What it will NOT do:** 공개 서비스, 협업 기능, 앱 자체 로그인, 로컬 폴더 열기, Google Drive/GitHub raw 이미지 미리보기, Cloudflare Images는 만들지 않는다.

**Effort:** Large
**Risk:** High - 새 웹앱, Worker API, D1 schema, R2 파일 처리, 브라우저 QA, 배포 준비가 모두 포함된다.
**Decisions to sanity-check:** Cloudflare Access 전제, R2 preview Worker proxy, 원본 이미지 미보관, staging 미구성, 수동 백업 우선.
**Cloudflare resources:** 기존 원격 리소스를 사용한다. D1은 `prompt-gallery-db`를 `DB`로, R2는 `prompt-gallery-previews`를 `PREVIEWS`로 바인딩한다. `color-db`는 참고용이며 사용하지 않는다.

Your next move: 이 계획을 실행하려면 `$omo:start-work` 또는 동등한 실행 지시를 준다. Full execution detail follows below.

---

> TL;DR (machine): Large/high-risk full-stack Cloudflare Workers React app with D1, R2, browser QA, wave-end verification, and wave-end cp commits.

## Scope
### Must have
- React + Vite + TypeScript + Cloudflare Workers Static Assets scaffold.
- `wrangler.jsonc` config uses the existing Cloudflare resources:
  - D1 binding `DB`, database name `prompt-gallery-db`, database id `138200be-9d3b-4acf-bb71-42d5ca7e43b7`
  - R2 binding `PREVIEWS`, bucket name `prompt-gallery-previews`
- Worker API routes:
  - `GET /api/health`
  - `GET/POST /api/items`
  - `GET/PATCH/DELETE /api/items/:id`
  - `POST /api/items/:id/favorite`
  - `GET/POST /api/tags`
  - `PATCH/DELETE /api/tags/:id`
  - `POST /api/tags/merge`
  - `GET/POST /api/workflows`
  - `GET/PATCH/DELETE /api/workflows/:id`
  - `POST/DELETE /api/assets`
  - `GET /api/assets/:id/content`
- D1 migrations for `items`, `tags`, `tag_keywords`, `item_tags`, `workflows`, `workflow_steps`, and `assets`.
- D1 repository layer with validation, default title derivation, AND tag filtering, favorite filtering, latest-first sorting, and automatic tag keyword application.
- R2 preview flow: browser-side compression, Worker upload, metadata in D1, protected preview retrieval, replacement, deletion, and orphan-check script.
- UI:
  - compact icon tab bar for `즐겨찾기`, `All`, `프롬프트`, `이미지 프롬프트`, `Workflow`, `레포`
  - integrated search
  - AND tag filters
  - sectioned All view and unified search results
  - common cards with type badge, favorite star, key action
  - detail modal with view/edit/delete
  - explicit save
  - delete confirmation
  - copy body only
  - image prompt gallery and no-image state
  - tag management screen with rename, delete, merge, color, and auto keywords
  - workflow editor with ordered steps containing prompt, repo, memo, and external link
  - repo cards opening GitHub page
- Scripts:
  - `pnpm dev`
  - `pnpm build`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm test:worker`
  - `pnpm qa:api`
  - `pnpm qa:browser`
  - `pnpm backup:local`
  - `pnpm deploy:check`
  - `pnpm verify:plan`
  - `pnpm verify:scope`
  - `pnpm verify:cleanup`
- Evidence files under `.omo/evidence/` for every wave.
- Wave-end verification and wave-end commit using the `cp` skill.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not create a duplicate plan in `_docs`; this `.omo/plans/prompt-gallery-implementation.md` is the source of truth.
- Do not implement public sharing, collaboration, account roles, app-level login, billing, or invite flows.
- Do not expose R2 as a public bucket in phase 1.
- Do not store image binaries in D1.
- Do not use `color-db`; it is reference-only.
- Do not use Cloudflare Images, Google Drive thumbnails, GitHub raw URLs, Supabase, Firebase, Electron, or Tauri.
- Do not add local folder open or local path copy/display.
- Do not add placeholder image files for missing previews; use lucide icon plus short empty-state copy.
- Do not auto-save edits; all add/edit flows must use explicit save.
- Do not copy title, tags, or notes from prompt copy buttons; copy body only.
- Do not perform raw `git add` or `git commit`; use `cp` skill for wave commits.
- Do not run destructive cleanup commands; use `safe-trash` only if deletion is ever needed.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for API/data contracts and tests-after for browser layout/interaction polish.
- Unit/integration tools:
  - Vitest for pure TypeScript logic.
  - `@cloudflare/vitest-pool-workers` for Worker API, D1 migrations, and R2 bindings.
  - Playwright for real browser QA.
- Required repeated verification commands:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
  - `pnpm test:worker`
  - `pnpm build`
- Shell rule:
  - Run shell commands from `D:/vibe-coding/prompt-gallery`.
  - Commands using `VAR=$(...)`, `jq`, or chained curl calls are explicitly **Git Bash commands**. In this Windows repo, run them through the OMO `git_bash` tool or Git Bash, not PowerShell.
  - Commands using `Tee-Object` are PowerShell commands and are labeled as such.
- Required real-surface checks:
  - API surface: `pnpm qa:api`, which starts the local dev server when no `--base-url` is supplied, records status, headers, and JSON bodies from Worker endpoints, then stops the server.
  - Browser surface: `pnpm qa:browser`, which starts the local dev server when no `--base-url` is supplied, drives the running app, captures screenshots, records action logs, then stops the server.
- Evidence naming:
  - `.omo/evidence/wave-0-scaffold.txt`
  - `.omo/evidence/wave-1-data-api.txt`
  - `.omo/evidence/wave-2-core-ui.txt`
  - `.omo/evidence/wave-3-assets-workflows.txt`
  - `.omo/evidence/wave-4-ops-deploy.txt`
  - `.omo/evidence/final-verification.md`
- RED to GREEN rule:
  - Before each behavior implementation, add the smallest faithful failing test or failing QA script assertion first.
  - Capture the failing output in the wave evidence file.
  - Implement the behavior.
  - Capture the passing output in the same wave evidence file.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 0: project scaffold, tooling, local Worker health, QA harness, and first commit.
- Wave 1: D1 schema, core API, validation, tags, favorites, and first data commit.
- Wave 2: UI shell, search/tabs/tag filters, cards, modal CRUD, copy, favorites, and second product commit.
- Wave 3: R2 preview, image prompt UX, workflows, repo actions, and third product commit.
- Wave 4: tag management, backup/export, deploy readiness, final docs/evidence, and ops commit.
- Final wave: plan compliance, code quality, browser QA, API QA, scope fidelity, and final user-visible summary.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 3, 4 | none |
| 2 | 1 | 5, 6, 15, 21 | 3, 4 |
| 3 | 1 | 5, 15, 20, 21 | 2, 4 |
| 4 | 1 | 5, 11, browser QA | 2, 3 |
| 5 | 1, 2, 3, 4 | 6, 7, 8, 9 | none |
| 6 | 5 | 7, 8, 9, 10 | none |
| 7 | 6 | 10, 19 | 8, 9 |
| 8 | 6 | 10, 13 | 7, 9 |
| 9 | 6 | 10, 17 | 7, 8 |
| 10 | 6, 7, 8, 9 | 11, 15, 20 | none |
| 11 | 10 | 12, 13, 16, 17, 19 | none |
| 12 | 11 | 13, 14 | none |
| 13 | 11, 12 | 14 | none |
| 14 | 11, 12, 13 | 15, 16, 17 | none |
| 15 | 3, 10 | 16, 18, 20 | none |
| 16 | 11, 15 | 18 | 17 |
| 17 | 9, 11 | 18 | 16 |
| 18 | 15, 16, 17 | 19, 20, 21 | none |
| 19 | 7, 11 | 22 | 20, 21 |
| 20 | 3, 10, 15 | 22 | 19, 21 |
| 21 | 1, 2 | 22 | 19, 20 |
| 22 | 19, 20, 21 | F1-F5, 23 | none |
| 23 | 22, F1-F5 | final user report | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Wave 0 - Scaffold Cloudflare Workers React app
  What to do / Must NOT do: Create the minimal app structure, not product features yet. Add `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `wrangler.jsonc`, `tsconfig*.json`, `src/client/*`, `src/worker/*`, and a visible home shell. Use `@cloudflare/vite-plugin`, React, TypeScript, lucide-react, Vitest, Playwright, and Wrangler. Do not create `_docs` plan duplicates.
  Parallelization: Wave 0 | Blocked by: none | Blocks: 2, 3, 4
  References: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:47`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:54`, Context7 `/cloudflare/workers-sdk` Vite plugin docs.
  Acceptance criteria: `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` all exit 0.
  QA scenarios:
  - Failure first: run `pnpm test -- --run src/worker/health.test.ts` before implementing `/api/health`; expected FAIL mentioning missing route or 404. Append output to `.omo/evidence/wave-0-scaffold.txt`.
  - Happy path: start `pnpm dev -- --host 127.0.0.1`, run `curl -i http://127.0.0.1:5173/api/health`, capture output, then stop the dev server; expected `HTTP/1.1 200` and JSON containing `"ok":true`. Append output to `.omo/evidence/wave-0-scaffold.txt`.
  Commit: No, commit at Wave 0 gate.

- [ ] 2. Wave 0 - Configure D1/R2 bindings and local migrations directory
  What to do / Must NOT do: Add `migrations/0001_initial.sql`, typed Worker `Env`, and `wrangler.jsonc` bindings for the existing Cloudflare resources: D1 binding `DB` -> `prompt-gallery-db` with database id `138200be-9d3b-4acf-bb71-42d5ca7e43b7`, and R2 binding `PREVIEWS` -> bucket `prompt-gallery-previews`. Do not create new Cloudflare resources in this task. Do not use `color-db`.
  Parallelization: Wave 0 | Blocked by: 1 | Blocks: 5, 6, 7, 8, 9
  References: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:56`, `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:60`, `_docs/20260708_03_cloudflare-환경세팅-구현착수.md`, Context7 `/cloudflare/workers-sdk` D1/R2 binding docs.
  Acceptance criteria: `pnpm test:worker -- --run src/worker/db-migration.test.ts` applies migrations and asserts every required table exists; `pnpm deploy:check` later confirms `wrangler.jsonc` contains `DB`, `PREVIEWS`, `prompt-gallery-db`, `prompt-gallery-previews`, and the D1 database id above.
  QA scenarios:
  - Failure first: run the migration test before adding SQL; expected FAIL because required tables are missing. Evidence `.omo/evidence/wave-0-scaffold.txt`.
  - Happy path: rerun `pnpm test:worker -- --run src/worker/db-migration.test.ts`; expected PASS and output listing `items`, `tags`, `tag_keywords`, `item_tags`, `workflows`, `workflow_steps`, `assets`. Evidence `.omo/evidence/wave-0-scaffold.txt`.
  Commit: No, commit at Wave 0 gate.

- [ ] 3. Wave 0 - Add repeatable QA, fixture, and evidence scripts
  What to do / Must NOT do: Add `scripts/qa/api-smoke.mjs`, `scripts/qa/browser-smoke.mjs`, `scripts/qa/create-fixtures.mjs`, `scripts/qa/verify-plan.mjs`, `scripts/qa/verify-scope.mjs`, `scripts/qa/verify-cleanup.mjs`, and package scripts `qa:api`, `qa:browser`, `qa:fixtures`, `verify:plan`, `verify:scope`, `verify:cleanup`, `deploy:check`. Scripts must write evidence under `.omo/evidence/`, generate `test/fixtures/preview.png`, and must not require manual browser action.
  Parallelization: Wave 0 | Blocked by: 1 | Blocks: all browser/API QA
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:43`, `.omo/plans/prompt-gallery-implementation.md:Verification strategy`
  Acceptance criteria: `pnpm qa:fixtures && pnpm qa:api -- --output .omo/evidence/wave-0-api-smoke.txt` generates `test/fixtures/preview.png`, auto-starts/stops the local app, and records health response.
  QA scenarios:
  - Failure first: run `pnpm qa:api -- --base-url http://127.0.0.1:5999 --output .omo/evidence/wave-0-api-smoke-fail.txt`; expected non-zero exit and connection failure recorded.
  - Happy path: run `pnpm qa:api -- --output .omo/evidence/wave-0-api-smoke.txt`; expected auto-start/stop and PASS with health JSON.
  Commit: No, commit at Wave 0 gate.

- [ ] 4. Wave 0 - Establish visual baseline without product scope creep
  What to do / Must NOT do: Implement only the app shell placeholder needed for Playwright to confirm nonblank render: app title, search input disabled/placeholder, tab bar placeholders, empty content area. Do not implement CRUD in this todo.
  Parallelization: Wave 0 | Blocked by: 1 | Blocks: all UI todos
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:87`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:102`
  Acceptance criteria: `pnpm qa:browser -- --output .omo/evidence/wave-0-browser-smoke.md` auto-starts/stops the local app, captures desktop and mobile screenshots, and asserts the app title and tab controls are visible.
  QA scenarios:
  - Failure first: run browser QA before shell implementation; expected FAIL because title/tabs are absent.
  - Happy path: run browser QA after shell implementation; expected PASS and screenshot paths recorded in `.omo/evidence/wave-0-browser-smoke.md`.
  Commit: No, commit at Wave 0 gate.

- [ ] 5. Wave 0 gate - Verify and commit scaffold
  What to do / Must NOT do: Run the full Wave 0 verification bundle, update this plan todo checkboxes only after evidence exists, then commit through `cp`. Do not use raw git commit.
  Parallelization: Wave 0 gate | Blocked by: 1, 2, 3, 4 | Blocks: Wave 1
  References: `.gitignore`, `CHANGELOG.md`, global Git rule requiring cp skill.
  Acceptance criteria: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:worker && pnpm build && pnpm qa:api && pnpm qa:browser` exits 0; `node C:/Users/ahnbu/.claude/skills/_shared/security-gate.mjs precommit --repo D:/vibe-coding/prompt-gallery --staged` reports no blocking secret issue after staging via cp workflow.
  QA scenarios:
  - Happy path: capture command bundle output in `.omo/evidence/wave-0-scaffold.txt`.
  - Failure path: if any command fails, do not commit; append failing command and fix before rerun.
  Commit: Yes | `chore(app): Cloudflare Workers React scaffold 추가`

- [ ] 6. Wave 1 - Implement D1 item repository and item API
  What to do / Must NOT do: Implement item CRUD, type validation, latest-first sorting, title fallback from body prefix, notes, GitHub URL, image metadata reference, favorite field, and JSON error contract. Do not implement UI here.
  Parallelization: Wave 1 | Blocked by: 2, 5 | Blocks: 10, 11, 12
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:23`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:126`, `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:52`
  Acceptance criteria: `pnpm test:worker -- --run src/worker/items.test.ts` covers create/list/get/update/delete, missing body validation for prompt types, fallback title, and latest-first sorting.
  QA scenarios:
  - Failure first: test creating a prompt with body only before implementation; expected FAIL.
  - Happy path: start `pnpm dev -- --host 127.0.0.1`, run `curl -i -X POST http://127.0.0.1:5173/api/items -H "content-type: application/json" --data "{\"type\":\"prompt\",\"body\":\"Draft a launch plan\"}"`, capture output, then stop the dev server; expected `201` and title derived from body. Evidence `.omo/evidence/wave-1-data-api.txt`.
  Commit: No, commit at Wave 1 gate.

- [ ] 7. Wave 1 - Implement tags, AND filtering, and auto keyword application
  What to do / Must NOT do: Implement tag catalog, item-tag join, tag keyword rules, automatic tag assignment on save, manual tag add/remove, AND filtering in list API, tag color, rename, delete foundation, and merge foundation. Do not build the tag management UI yet.
  Parallelization: Wave 1 | Blocked by: 6 | Blocks: 10, 16
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:30`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:137`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:171`
  Acceptance criteria: `pnpm test:worker -- --run src/worker/tags.test.ts` covers AND filtering, auto keyword assignment, manual tag override, rename, delete protection, and merge.
  QA scenarios:
  - Failure first: test two selected tags returning only items containing both tags before implementation; expected FAIL.
  - Happy path: start `pnpm dev -- --host 127.0.0.1`, create two tagged items, run `curl -i "http://127.0.0.1:5173/api/items?tags=research,slides"`, capture output, then stop the dev server; expected only items with both tags. Evidence `.omo/evidence/wave-1-data-api.txt`.
  Commit: No, commit at Wave 1 gate.

- [ ] 8. Wave 1 - Implement favorite API and special favorite filter
  What to do / Must NOT do: Implement favorite toggle endpoint and list filter that returns favorite items across all item types. Do not make favorite a normal item type.
  Parallelization: Wave 1 | Blocked by: 6 | Blocks: 10, 12
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:41`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:62`
  Acceptance criteria: `pnpm test:worker -- --run src/worker/favorites.test.ts` covers toggle on/off and `favorite=true` listing across item types.
  QA scenarios:
  - Failure first: favorite filter test before endpoint implementation; expected FAIL.
  - Happy path: start `pnpm dev -- --host 127.0.0.1`; Git Bash command `ITEM_ID=$(curl -s -X POST http://127.0.0.1:5173/api/items -H "content-type: application/json" --data "{\"type\":\"prompt\",\"body\":\"Favorite body\"}" | jq -r '.item.id'); curl -i -X POST "http://127.0.0.1:5173/api/items/$ITEM_ID/favorite" -H "content-type: application/json" --data "{\"favorite\":true}"; curl -i "http://127.0.0.1:5173/api/items?favorite=true"`; capture output, then stop the dev server. Expected favorite POST `200` and favorite listing includes `Favorite body`. Evidence `.omo/evidence/wave-1-data-api.txt`.
  Commit: No, commit at Wave 1 gate.

- [ ] 9. Wave 1 - Implement workflow and repo API foundation
  What to do / Must NOT do: Implement repo item validation and workflow CRUD with ordered steps. Steps may reference existing item IDs, repo IDs, memo text, and external links. Enforce workflow name plus at least one step. Do not implement drag/drop unless trivial; ordered numeric positions are enough.
  Parallelization: Wave 1 | Blocked by: 6 | Blocks: 15
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:32`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:150`, `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:54`
  Acceptance criteria: `pnpm test:worker -- --run src/worker/workflows.test.ts` covers valid workflow, missing name rejection, zero-step rejection, ordered step persistence, repo GitHub URL validation.
  QA scenarios:
  - Failure first: test saving workflow with zero steps expects 400 before validation exists; expected FAIL.
  - Happy path: start `pnpm dev -- --host 127.0.0.1`; Git Bash command `PROMPT_ID=$(curl -s -X POST http://127.0.0.1:5173/api/items -H "content-type: application/json" --data "{\"type\":\"prompt\",\"body\":\"Research prompt\"}" | jq -r '.item.id'); REPO_ID=$(curl -s -X POST http://127.0.0.1:5173/api/items -H "content-type: application/json" --data "{\"type\":\"repo\",\"title\":\"Repo\",\"githubUrl\":\"https://github.com/example/example\"}" | jq -r '.item.id'); curl -i -X POST http://127.0.0.1:5173/api/workflows -H "content-type: application/json" --data "{\"name\":\"Research flow\",\"steps\":[{\"kind\":\"prompt\",\"itemId\":\"$PROMPT_ID\",\"position\":1},{\"kind\":\"repo\",\"itemId\":\"$REPO_ID\",\"position\":2},{\"kind\":\"memo\",\"memo\":\"Check sources\",\"position\":3},{\"kind\":\"link\",\"url\":\"https://example.com\",\"position\":4}]}"`; capture output, then stop the dev server. Expected `201` and steps returned in positions 1-4. Evidence `.omo/evidence/wave-1-data-api.txt`.
  Commit: No, commit at Wave 1 gate.

- [ ] 10. Wave 1 gate - Verify and commit data/API foundation
  What to do / Must NOT do: Run full tests and API smoke for created endpoints. Commit only after evidence is updated. Do not add UI work into this commit.
  Parallelization: Wave 1 gate | Blocked by: 6, 7, 8, 9 | Blocks: Wave 2
  References: `.omo/evidence/wave-1-data-api.txt`
  Acceptance criteria: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:worker && pnpm build && pnpm qa:api` exits 0 and evidence includes RED then GREEN notes for Wave 1.
  QA scenarios:
  - Happy path: `pnpm qa:api -- --output .omo/evidence/wave-1-api-smoke.txt`; expected auto-start/stop and item/tag/favorite/workflow API PASS.
  - Failure path: if API smoke receives non-2xx or missing JSON keys, fix before commit.
  Commit: Yes | `feat(api): D1 기반 항목과 태그 API 추가`

- [ ] 11. Wave 2 - Implement gallery shell, search, tabs, tag filters, and cards
  What to do / Must NOT do: Build the main browser experience over real API data. Implement compact icon tabs with tooltip/accessibility labels, search behavior, All sections, unified search results, AND tag chips, latest-first cards, type badges, and max 10 visible tags. Do not use fake static data after API is available.
  Parallelization: Wave 2 | Blocked by: 10 | Blocks: 12, 14, 15, 16
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:61`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:87`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:102`
  Acceptance criteria: `pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-2-core-ui.md` auto-starts/stops the local app and asserts tabs, search, tag AND filtering, type badges, and section/unified result switching.
  QA scenarios:
  - Failure first: run `gallery-search` before UI is wired to API; expected FAIL on missing seeded cards.
  - Happy path: run `gallery-search`; expected PASS with screenshots for All, search result, and filtered result. Evidence `.omo/evidence/wave-2-core-ui.md`.
  Commit: No, commit at Wave 2 gate.

- [ ] 12. Wave 2 - Implement add/detail modal CRUD with explicit save and delete confirmation
  What to do / Must NOT do: Implement `+ 추가`, type selection from All, current-tab default type, body-only required rule for prompts, optional title/tags/notes/image fields, card click detail modal, edit mode, explicit save, and one-step delete confirmation. Do not auto-save.
  Parallelization: Wave 2 | Blocked by: 11 | Blocks: 14, 15, final browser QA
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:38`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:117`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:126`
  Acceptance criteria: Playwright scenario `modal-crud` creates a prompt with body only, verifies fallback title, edits title/tags/notes, confirms delete dialog, cancels once, then confirms delete.
  QA scenarios:
  - Failure first: run `pnpm qa:browser -- --scenario modal-crud --output .omo/evidence/wave-2-modal-crud-fail.md`; expected auto-start/stop and FAIL before modal implementation.
  - Happy path: rerun same scenario after implementation; expected PASS and screenshots for add, detail, edit, delete confirm. Evidence `.omo/evidence/wave-2-core-ui.md`.
  Commit: No, commit at Wave 2 gate.

- [ ] 13. Wave 2 - Implement copy body only and favorite UX
  What to do / Must NOT do: Add card and modal copy buttons for prompt/image prompt bodies only. Add favorite star toggle on cards and detail modal, and favorite tab showing all favorite types. Do not copy title, tags, notes, or metadata.
  Parallelization: Wave 2 | Blocked by: 11, 12 | Blocks: final browser QA
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:27`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:41`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:78`
  Acceptance criteria: Playwright scenario `copy-favorite` verifies clipboard text equals body exactly and favorite tab includes toggled item.
  QA scenarios:
  - Failure first: scenario expects clipboard body-only before copy implementation; expected FAIL.
  - Happy path: `pnpm qa:browser -- --scenario copy-favorite --output .omo/evidence/wave-2-copy-favorite.md`; expected auto-start/stop and PASS with clipboard assertion.
  Commit: No, commit at Wave 2 gate.

- [ ] 14. Wave 2 gate - Verify and commit core UI
  What to do / Must NOT do: Run full checks and browser QA for Wave 2. Commit only UI/API integration work from Wave 2. Do not include R2/workflow/tag management features unless already required by the completed Wave 2 tasks.
  Parallelization: Wave 2 gate | Blocked by: 11, 12, 13 | Blocks: Wave 3
  References: `.omo/evidence/wave-2-core-ui.md`
  Acceptance criteria: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:worker && pnpm build && pnpm qa:browser` exits 0.
  QA scenarios:
  - Happy path: browser QA scenarios `gallery-search`, `modal-crud`, and `copy-favorite` all PASS.
  - Failure path: any screenshot with overlapping text, blank content, or broken modal blocks commit.
  Commit: Yes | `feat(ui): 핵심 갤러리 탐색과 편집 UX 추가`

- [ ] 15. Wave 3 - Implement R2 asset API and consistency handling
  What to do / Must NOT do: Implement upload, replace, delete, protected content retrieval, metadata persistence, content-type/size validation, temporary upload cleanup when D1 save fails, item-delete object cleanup, and orphan-check script. On item delete, delete associated R2 object best-effort and record failures in evidence/log output. Do not publicize the bucket.
  Parallelization: Wave 3 | Blocked by: 3, 10 | Blocks: 16
  References: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:103`, `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:150`
  Acceptance criteria: `pnpm test:worker -- --run src/worker/assets.test.ts` covers upload, content retrieval, replacement deleting old object, item delete cleanup, forced D1 failure cleaning temporary R2 object, orphan-check reporting, and invalid content type rejection.
  QA scenarios:
  - Failure first: asset upload test before implementation; expected FAIL.
  - Happy path: start `pnpm dev -- --host 127.0.0.1`; Git Bash command `pnpm qa:fixtures; ASSET_ID=$(curl -s -X POST http://127.0.0.1:5173/api/assets -F "file=@test/fixtures/preview.png" | jq -r '.asset.id'); curl -i "http://127.0.0.1:5173/api/assets/$ASSET_ID/content"`; capture output, then stop the dev server. Expected upload `201`, D1 asset metadata, and content response with image content-type. Evidence `.omo/evidence/wave-3-assets-workflows.txt`.
  Commit: No, commit at Wave 3 gate.

- [ ] 16. Wave 3 - Implement image prompt preview UI
  What to do / Must NOT do: Add image prompt tab gallery, browser-side resize/compress to 1200px max, upload progress/error UI, preview display through Worker proxy, replace/remove preview, and lucide no-image state. Do not load a placeholder image file.
  Parallelization: Wave 3 | Blocked by: 11, 15 | Blocks: final browser QA
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:36`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:160`, `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:116`
  Acceptance criteria: Playwright scenario `image-preview` creates image prompt with no image, verifies no-image state, uploads fixture image, verifies thumbnail appears, replaces it, removes it, and verifies no-image state returns.
  QA scenarios:
  - Failure first: run `image-preview` before UI upload wiring; expected FAIL.
  - Happy path: `pnpm qa:browser -- --scenario image-preview --output .omo/evidence/wave-3-image-preview.md`; expected auto-start/stop and PASS with screenshots.
  Commit: No, commit at Wave 3 gate.

- [ ] 17. Wave 3 - Implement repo cards and workflow editor
  What to do / Must NOT do: Implement repo item form/card/detail with GitHub open action, and workflow list/detail/editor with ordered steps. Steps must support prompt reference, repo reference, memo, and external link. Do not implement local folder actions.
  Parallelization: Wave 3 | Blocked by: 9, 11 | Blocks: final browser QA
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:32`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:34`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:150`
  Acceptance criteria: Playwright scenario `workflow-repo` creates a repo, verifies GitHub open target, creates workflow with prompt/repo/memo/link steps, reloads, and verifies ordered steps persist.
  QA scenarios:
  - Failure first: run `workflow-repo` before editor implementation; expected FAIL.
  - Happy path: `pnpm qa:browser -- --scenario workflow-repo --output .omo/evidence/wave-3-workflow-repo.md`; expected auto-start/stop and PASS.
  Commit: No, commit at Wave 3 gate.

- [ ] 18. Wave 3 gate - Verify and commit assets/workflows
  What to do / Must NOT do: Run Worker R2 tests and browser QA for image, repo, and workflow flows. Commit only after screenshots and API evidence exist.
  Parallelization: Wave 3 gate | Blocked by: 15, 16, 17 | Blocks: Wave 4
  References: `.omo/evidence/wave-3-assets-workflows.txt`
  Acceptance criteria: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:worker && pnpm build && pnpm qa:api && pnpm qa:browser` exits 0.
  QA scenarios:
  - Happy path: scenarios `image-preview` and `workflow-repo` PASS and screenshots are saved.
  - Failure path: broken image, public R2 URL leakage, or local folder action blocks commit.
  Commit: Yes | `feat(media-workflows): 이미지 preview와 Workflow 실행 흐름 추가`

- [ ] 19. Wave 4 - Implement tag management screen
  What to do / Must NOT do: Add management entry icon, tag list with usage counts, rename, color edit, delete confirmation, merge flow, and auto keyword edit. Use user-facing language for keyword behavior. Do not create a separate advanced admin vocabulary.
  Parallelization: Wave 4 | Blocked by: 7, 11 | Blocks: final browser QA
  References: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:31`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:137`, `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:203`
  Acceptance criteria: Playwright scenario `tag-management` renames a tag, changes color, edits keywords, merges two tags, and verifies item filters reflect the result.
  QA scenarios:
  - Failure first: run `tag-management` before screen implementation; expected FAIL.
  - Happy path: `pnpm qa:browser -- --scenario tag-management --output .omo/evidence/wave-4-tag-management.md`; expected auto-start/stop and PASS.
  Commit: No, commit at Wave 4 gate.

- [ ] 20. Wave 4 - Implement export and local backup helpers
  What to do / Must NOT do: Add app export endpoint/button producing `prompt-gallery-export.json`, and local backup script producing D1 dump/export JSON, downloaded preview files from the protected asset API, `r2-objects.json`, and `manifest.json` with schema version. Do not leave R2 backup as instructions only. Do not add scheduled backup or CI secrets.
  Parallelization: Wave 4 | Blocked by: 3, 10, 15 | Blocks: final ops QA
  References: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:150`
  Acceptance criteria: `pnpm backup:local -- --out .omo/evidence/backup-smoke` starts/stops the local app when no `--base-url` is supplied, then creates `manifest.json`, `prompt-gallery-export.json`, `d1.sql` or equivalent D1 export, `r2-objects.json`, and preview files for every asset returned by the API; `pnpm test:worker -- --run src/worker/export.test.ts` validates export shape.
  QA scenarios:
  - Failure first: export shape test before endpoint implementation; expected FAIL.
  - Happy path: run `pnpm backup:local -- --out .omo/evidence/wave-4-backup`; expected automatic local app start/stop, manifest with schema version, D1 dump/export path, `r2-objects.json`, and at least one downloaded preview file when assets exist. Evidence `.omo/evidence/wave-4-ops-deploy.txt`.
  Commit: No, commit at Wave 4 gate.

- [ ] 21. Wave 4 - Implement deployment readiness checks
  What to do / Must NOT do: Add `pnpm deploy:check` that validates Wrangler config, required binding names, expected D1/R2 remote resource names, D1 database id, build output, `wrangler whoami`, `wrangler d1 list`, and `wrangler r2 bucket list` status. Do not create remote Cloudflare resources or deploy publicly unless user gives a separate deploy instruction.
  Parallelization: Wave 4 | Blocked by: 1, 2 | Blocks: final ops QA
  References: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:90`, `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:165`, `_docs/20260708_03_cloudflare-환경세팅-구현착수.md`
  Acceptance criteria: `pnpm deploy:check` exits 0 for local config checks, confirms D1 `prompt-gallery-db`, confirms R2 `prompt-gallery-previews`, confirms binding names `DB` and `PREVIEWS`, confirms `color-db` is not referenced by app config, and reports Cloudflare auth status without printing secrets.
  QA scenarios:
  - Failure first: deliberately missing required binding in a test fixture causes deploy check to fail; expected FAIL recorded by unit test.
  - Happy path: PowerShell command `pnpm deploy:check | Tee-Object .omo/evidence/wave-4-deploy-check.txt`; expected build/config checks PASS and auth status reported. Do not expose tokens.
  Commit: No, commit at Wave 4 gate.

- [ ] 22. Wave 4 gate - Verify and commit ops/tag management
  What to do / Must NOT do: Run full verification, backup check, deploy check, security gate, then commit through cp. Do not perform public deploy in this commit.
  Parallelization: Wave 4 gate | Blocked by: 19, 20, 21 | Blocks: final verification
  References: `.omo/evidence/wave-4-ops-deploy.txt`
  Acceptance criteria: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:worker && pnpm build && pnpm qa:api && pnpm qa:browser && pnpm backup:local -- --out .omo/evidence/wave-4-backup && pnpm deploy:check` exits 0 or records auth-only deploy limitation clearly.
  QA scenarios:
  - Happy path: all Wave 4 checks PASS and evidence paths exist.
  - Failure path: any secret leak, missing backup manifest, or broken tag management flow blocks commit.
  Commit: Yes | `feat(ops): 태그 관리와 백업 점검 흐름 추가`

- [ ] 23. Final gate - Verify final evidence and commit plan/results update
  What to do / Must NOT do: Run the final verification wave, update this plan checkboxes and final evidence references, then commit the plan/evidence status through `cp`. Do not claim complete from test output alone; real browser/API evidence must exist.
  Parallelization: Final gate | Blocked by: 22 and F1-F5 | Blocks: final user report
  References: `.omo/evidence/final-verification.md`, `.omo/evidence/final-plan-compliance.md`, `.omo/evidence/final-code-review.md`, `.omo/evidence/final-browser-qa.md`, `.omo/evidence/final-api-qa.txt`, `.omo/evidence/final-scope-fidelity.md`, `.omo/evidence/final-cleanup.md`
  Acceptance criteria: all F1-F5 final verification files exist, all final checks pass, `git status --short` is clean after the final cp commit or contains only explicitly documented user-owned changes.
  QA scenarios:
  - Happy path: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:worker && pnpm build && pnpm qa:api -- --scenario full-regression --output .omo/evidence/final-api-qa.txt && pnpm qa:browser -- --scenario full-regression --output .omo/evidence/final-browser-qa.md`; expected QA scripts automatically start/stop the local app and all checks PASS.
  - Failure path: any missing final evidence file, live dev process without cleanup note, or dirty uncommitted plan/evidence file blocks completion.
  Commit: Yes | `docs(plan): 구현 결과와 최종 검증 기록 반영`

## Final verification wave
> Runs after all implementation waves. ALL checks must pass. Surface results in the final report after the final cp commit; do not wait for a user decision inside automated verification.
- [ ] F1. Plan compliance audit
  Command/evidence: `pnpm verify:plan -- --plan .omo/plans/prompt-gallery-implementation.md --evidence-dir .omo/evidence --output .omo/evidence/final-plan-compliance.md`.
  PASS requires exit 0 and `.omo/evidence/final-plan-compliance.md` states every Must have item is represented by tests, QA, or an explicit user-approved deferred note.
- [ ] F2. Code quality review
  Command/evidence: Run `pnpm typecheck && pnpm lint && pnpm test && pnpm test:worker && pnpm build`; run a code review pass focused on D1/R2 consistency, validation, no `as any`, no skipped tests, and no scope creep; write `.omo/evidence/final-code-review.md`.
  PASS requires no blocking findings.
- [ ] F3. Real manual QA
  Command/evidence: Run `pnpm qa:browser -- --scenario full-regression --output .omo/evidence/final-browser-qa.md` and `pnpm qa:api -- --scenario full-regression --output .omo/evidence/final-api-qa.txt`; both scripts must automatically start/stop the local app when no `--base-url` is supplied.
  PASS requires visible browser flows for add, search, filter, copy, favorite, edit, delete, image preview, workflow, repo, tag management, export.
- [ ] F4. Scope fidelity
  Command/evidence: `pnpm verify:scope -- --plan .omo/plans/prompt-gallery-implementation.md --output .omo/evidence/final-scope-fidelity.md`; the script must automatically start/stop the local app when no `--base-url` is supplied.
  PASS requires exit 0 and `.omo/evidence/final-scope-fidelity.md` states no app login, public sharing, Cloudflare Images, Google Drive preview, GitHub raw preview, local folder open, or D1 image blobs were found.
- [ ] F5. Cleanup receipt
  Command/evidence: `pnpm verify:cleanup -- --output .omo/evidence/final-cleanup.md`.
  PASS requires exit 0 and `.omo/evidence/final-cleanup.md` states no dev server, browser context, temporary backup folder outside `.omo/evidence`, or test artifact is left running unless intentionally documented.

## Commit strategy
- Commit after each wave, not after every todo.
- Use the `cp` skill for every commit. Do not run raw `git add` or `git commit`.
- Before each commit:
  - verify repo root with `git rev-parse --show-toplevel`
  - inspect `git status --short`
  - run the wave verification bundle
  - run `node C:/Users/ahnbu/.claude/skills/_shared/security-gate.mjs precommit --repo D:/vibe-coding/prompt-gallery --staged` inside the cp workflow
- Planned commits:
  - Wave 0: `chore(app): Cloudflare Workers React scaffold 추가`
  - Wave 1: `feat(api): D1 기반 항목과 태그 API 추가`
  - Wave 2: `feat(ui): 핵심 갤러리 탐색과 편집 UX 추가`
  - Wave 3: `feat(media-workflows): 이미지 preview와 Workflow 실행 흐름 추가`
  - Wave 4: `feat(ops): 태그 관리와 백업 점검 흐름 추가`
  - Final gate: `docs(plan): 구현 결과와 최종 검증 기록 반영`
- If a wave changes unrelated concerns, split the commit inside that wave and record the split in this plan before committing.
- Each wave-end commit must update this plan checklist and relevant `.omo/evidence/*` references.

## Success criteria
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm test:worker`, and `pnpm build` pass.
- API QA proves item, tag, favorite, workflow, repo, asset, export, and health endpoints through real local Worker requests.
- Browser QA proves the user can:
  - search across all item types
  - narrow by tab and AND tag filter
  - add a prompt with body only
  - copy prompt body only
  - favorite an item and view it in the favorite tab
  - open detail modal
  - edit and explicitly save
  - cancel and confirm delete
  - manage tags and auto keywords
  - create image prompt with no image and with uploaded preview
  - create workflow with ordered steps
  - open a GitHub repo page from repo item
  - export/backup local data
- Final evidence exists under `.omo/evidence/`.
- Worktree is clean or contains only user-approved follow-up changes.
- No excluded scope appears in the app.
