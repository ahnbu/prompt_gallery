# prompt-gallery-auto-manual-tags - Work Plan

## TL;DR (For humans)

**What you'll get:** Prompt Gallery will distinguish user-chosen tags from rule-assigned tags. Automatic tag keyword changes will update matching existing items in bulk, while manual tags remain protected.

**Why this approach:** The current app stores only item/tag links, so it cannot know whether a tag was manual or automatic. The plan first fixes that data meaning, then updates API, UI, and QA around the same contract.

**What it will NOT do:** It will not create new tag names automatically from item text. It will not add per-item automatic-tag suppression. It will not touch auth, sharing, workflows, repos, or image preview beyond tag-source compatibility.

**Effort:** Large
**Risk:** High - this changes persistent tag semantics and must preserve existing item/tag data.
**Decisions to sanity-check:** Existing item-tag links are backfilled as manual; automatic keyword changes recompute only `auto` links; item edit changes manual tags only.

Your next move: start execution with `$start-work` or ask for a high-accuracy plan review first. Full execution detail follows below.

---

> TL;DR (machine): Large/high-risk source-aware tag plan: migration, repository/API semantics, UI create/source visibility, browser/API QA, and final review gates.

## Scope
### Must have
- Add a D1 migration that makes `item_tags` source-aware with `manual` and `auto` assignment semantics while preserving existing data.
- Use a row-per-source model: `(item_id, tag_id, source)` is unique/primary, where `source` is exactly `manual` or `auto`.
- API item tags use this exact JSON shape: `{ id, name, color, sources }`, where `sources` is a sorted array containing `manual`, `auto`, or both.
- Backfill existing `item_tags` as `manual` because the current schema has no source evidence.
- Update Worker repository logic so manual tag edits affect only manual links and automatic keyword recalculation affects only auto links.
- Make tag keyword create/update/delete bulk-recompute existing items for that tag.
- Preserve manual links during automatic recalculation, including when the same item/tag also matches auto rules.
- Update tag merge/delete behavior so both manual and auto links are handled correctly.
- Update item/tag response parsing and UI so automatic tags are visible without becoming accidental manual tags.
- Add first-tag creation in tag management so an empty DB can be configured from the UI.
- Replace browser tag-management QA that relies on API seed-only setup with a scenario that creates the first tag through the UI.
- Keep all verification agent-executed: worker tests, API smoke, browser QA, build/type/lint, and data/export checks.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- Do not implement automatic tag catalog creation from arbitrary item input text.
- Do not implement item-level dismissed/suppressed automatic tags.
- Do not delete or weaken existing tests.
- Do not use `as any`, `@ts-ignore`, or `@ts-expect-error`.
- Do not change unrelated workflows, repo cards, image preview storage, Cloudflare Access/auth, sharing, collaboration, or public gallery behavior.
- Do not seed production data as a workaround for missing first-tag creation UI.
- Do not use `color-db` or any database other than the configured `prompt-gallery-db` binding.
- Do not change the current assigned-tag delete protection. In-use tag delete remains rejected unless a later user decision explicitly changes that behavior.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: TDD for Worker/API behavior and browser QA for user-visible tag management behavior.
- RED/GREEN evidence: each implementation todo starts by adding or updating the narrow failing test/scenario named in that todo, captures failure in that todo's numbered `.omo/evidence/task_1_...` through `.omo/evidence/task_11_...` artifact, then implements and captures the matching green output.
- Primary test commands:
  - `pnpm test:worker -- --run src/worker/db-migration.test.ts`
  - `pnpm test:worker -- --run src/worker/tags.test.ts`
  - `pnpm test:worker -- --run src/worker/export.test.ts`
  - `pnpm qa:browser -- --scenario tag-management --output .omo/evidence/task_8_prompt-gallery-auto-manual-tags.md`
  - `pnpm qa:api -- --output .omo/evidence/task_9_prompt-gallery-auto-manual-tags-api.md`
  - `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm test`
- Data checks:
  - Local D1 schema includes source-aware `item_tags`.
  - Existing item/tag links remain visible after migration.
  - Updating a tag keyword removes stale auto links and adds new auto links without deleting manual links.
- Browser checks:
  - Empty DB path creates the first tag from tag management UI.
  - Keyword changes show bulk auto apply/remove through visible item cards/filter behavior.
  - Manual tag remains after auto keyword removal.

## Execution strategy
### Parallel execution waves
> Target 5-8 todos per wave. Fewer than 3 (except the final) means you under-split.
- Wave 1: data model and Worker semantics. Todos 1-5 run mostly sequentially because migration and source-aware repository semantics are shared dependencies.
- Wave 2: client parsing/UI and QA scripts. Todos 6-8 depend on Worker response contracts but can be split after Todo 5 is green.
- Wave 3: export/backup/API smoke and final hardening. Todos 9-11 verify adjacent surfaces and regressions.
- Final wave: F1-F4 independent reviews/QA after all todos are complete.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 | none | 2, 3, 4, 9 | none |
| 2 | 1 | 3, 4, 5, 9 | none |
| 3 | 2 | 4, 5, 7, 9 | none |
| 4 | 2, 3 | 5, 7, 8, 9 | none |
| 5 | 2, 3 | 7, 8, 9 | 6 after response shape is fixed |
| 6 | 3 | 7, 8 | 5 |
| 7 | 4, 5, 6 | 8, 10 | none |
| 8 | 7 | 10, final QA | none |
| 9 | 4, 5, 6 | 10 | none |
| 10 | 8, 9 | 11 | none |
| 11 | 10 | final wave | none |

## Todos
> Implementation + Test = ONE todo. Never separate.
- [ ] 1. Add source-aware `item_tags` migration and migration tests
  What to do / Must NOT do: Add a new migration after `migrations/0001_initial.sql` that preserves existing rows and introduces explicit `manual`/`auto` source semantics. Use D1-compatible SQL. Existing item/tag links must remain visible after migration. Do not edit `0001_initial.sql` except if test support requires reading it unchanged.
  Parallelization: Wave 1 | Blocked by: none | Blocks: 2, 3, 4, 9
  References (executor has NO interview context - be exhaustive): `migrations/0001_initial.sql:30` current `item_tags`; `src/worker/db-migration.test.ts:1` migration table coverage; `.omo/drafts/prompt-gallery-auto-manual-tags.md:23` backfill assumption.
  Acceptance criteria (agent-executable): `pnpm test:worker -- --run src/worker/db-migration.test.ts` passes and includes assertions that `item_tags` has source-aware semantics and existing links are backfilled as `manual`.
  QA scenarios (name the exact tool + invocation): Failure: run `pnpm test:worker -- --run src/worker/db-migration.test.ts` before migration test implementation is green and capture the failing assertion in `.omo/evidence/task_1_prompt-gallery-auto-manual-tags-red.txt`. Happy: rerun the same command after implementation; PASS if output reports the migration test file passed and schema assertions include `manual`/`auto`, evidence `.omo/evidence/task_1_prompt-gallery-auto-manual-tags-green.txt`.
  Commit: Y | `feat(tags): add source-aware item tag migration`

- [ ] 2. Update Worker tag/domain types for source-aware item tags
  What to do / Must NOT do: Extend Worker `ItemTag`, `ItemTagRow`, and response mapping so an item tag can report whether it has manual and/or auto source. Prefer a compact shape such as `sources: readonly ("manual" | "auto")[]` to avoid duplicate visible chips. Do not expose raw D1 implementation details beyond the stable source meaning.
  Parallelization: Wave 1 | Blocked by: 1 | Blocks: 3, 4, 5, 6, 9
  References: `src/worker/item-types.ts:22` current `ItemTag`; `src/worker/tag-types.ts:23` current `ItemTagRow`; `src/worker/tag-repository.ts:184` current `tagsForItems`; `src/client/gallery-data.ts:25` client item tag parser must later match this contract.
  Acceptance criteria: `pnpm test:worker -- --run src/worker/tags.test.ts` has a failing-first assertion that item responses distinguish manual and automatic source without duplicate tag chips, then passes.
  QA scenarios: Failure: add/adjust Worker test expecting source data in item tags, run `pnpm test:worker -- --run src/worker/tags.test.ts`, capture RED in `.omo/evidence/task_2_prompt-gallery-auto-manual-tags-red.txt`. Happy: same command GREEN with item response source assertion passing, evidence `.omo/evidence/task_2_prompt-gallery-auto-manual-tags-green.txt`.
  Commit: Y | `feat(tags): expose manual and automatic tag sources`

- [ ] 3. Split manual tag editing from automatic tag assignment in repositories
  What to do / Must NOT do: Replace current all-tag replacement behavior with manual-only update semantics. `setItemTagsByNames()` or its replacement updates `source='manual'` rows only. `addAutomaticTags()` becomes source-aware and inserts `source='auto'` rows only. Manual tags must not suppress auto tags, and auto tags must not delete manual tags.
  Parallelization: Wave 1 | Blocked by: 2 | Blocks: 4, 5, 7, 9
  References: `src/worker/tag-repository.ts:142` current full delete/reinsert manual path; `src/worker/tag-repository.ts:161` current automatic insert path; `src/worker/item-repository.ts:111` create path; `src/worker/item-repository.ts:165` update path; `src/worker/tags.test.ts:120` current manual override test needs revised meaning.
  Acceptance criteria: `pnpm test:worker -- --run src/worker/tags.test.ts` proves manual edit changes only manual rows and automatic matches remain rule-derived.
  QA scenarios: Failure: add test where an item has `manual=slides` and `auto=research`, update manual tags to empty, and expect `auto=research` remains; capture RED in `.omo/evidence/task_3_prompt-gallery-auto-manual-tags-red.txt`. Happy: same command GREEN, evidence `.omo/evidence/task_3_prompt-gallery-auto-manual-tags-green.txt`.
  Commit: Y | `feat(tags): preserve automatic tags during manual edits`

- [ ] 4. Implement bulk automatic recomputation when tag keywords change
  What to do / Must NOT do: When `/api/tags/:id` updates keywords, remove only existing `source='auto'` rows for that tag, scan all current items against the new keywords using the same searchable fields as `itemSearchText()`, insert new `source='auto'` rows, and preserve every `source='manual'` row. Empty keyword list removes only that tag's auto links. Do not implement per-item dismissed/suppressed state.
  Parallelization: Wave 1 | Blocked by: 2, 3 | Blocks: 5, 7, 8, 9
  References: `src/worker/tag-repository.ts:64` tag update path; `src/worker/tag-repository.ts:19` searchable fields; `src/worker/tag-repository.ts:262` keyword replacement; `.omo/drafts/prompt-gallery-auto-manual-tags.md:25` bulk recompute assumption.
  Acceptance criteria: `pnpm test:worker -- --run src/worker/tags.test.ts` includes bulk apply and bulk remove tests over existing items.
  QA scenarios: Failure: add test that creates items before a tag keyword update and expects new auto links after keyword add plus stale auto links removed after keyword delete; capture RED in `.omo/evidence/task_4_prompt-gallery-auto-manual-tags-red.txt`. Happy: same command GREEN, evidence `.omo/evidence/task_4_prompt-gallery-auto-manual-tags-green.txt`.
  Commit: Y | `feat(tags): recompute automatic tags on keyword changes`

- [ ] 5. Make tag delete and merge source-safe without changing delete policy
  What to do / Must NOT do: Keep existing in-use delete protection for assigned tags. Update item counts and in-use checks to count combined manual+auto item/tag assignments once per item/tag. Ensure merge moves both manual and auto rows from source to target, deduplicates safely, merges keywords, and preserves source semantics. Do not silently delete assigned tags.
  Parallelization: Wave 1 | Blocked by: 2, 3, 4 | Blocks: 7, 8, 9
  References: `src/worker/tag-repository.ts:93` delete protection; `src/worker/tag-repository.ts:103` merge implementation; `src/worker/tag-repository.ts:250` item count; `src/worker/tags.test.ts` existing delete/merge coverage.
  Acceptance criteria: `pnpm test:worker -- --run src/worker/tags.test.ts` proves merge preserves manual/auto sources and delete protection rejects any assigned tag regardless of source.
  QA scenarios: Failure: add merge test with source manual row and source auto row, expecting target to retain both source meanings; capture RED in `.omo/evidence/task_5_prompt-gallery-auto-manual-tags-red.txt`. Happy: same command GREEN, evidence `.omo/evidence/task_5_prompt-gallery-auto-manual-tags-green.txt`.
  Commit: Y | `feat(tags): preserve tag sources during merge`

- [ ] 6. Update client parsing and item modal model for tag sources
  What to do / Must NOT do: Update `src/client/gallery-data.ts`, item modal draft creation, detail display, and modal form rendering for item tags shaped as `{ id, name, color, sources }`. Manual tag input must initialize from tags whose `sources` includes `manual` only. Automatic tags must be displayed as automatic in detail/edit context without being copied into the manual input accidentally.
  Parallelization: Wave 2 | Blocked by: 2, 3 | Blocks: 7, 8
  References: `src/client/gallery-data.ts:25` `ItemTag`; `src/client/gallery-data.ts:160` parser; `src/client/item-modal-model.ts:66` current draft includes all tag names; `src/client/ItemModalForm.tsx:80` tag input; `src/client/ItemModalDetail.tsx:26` detail tag display.
  Acceptance criteria: `pnpm typecheck` passes and a focused unit/browser characterization proves automatic tags are not written into manual `tagsText` on edit.
  QA scenarios: Failure: add browser or unit-level scenario that opens an item with auto-only tag and saves without manual tag text, expecting the auto source not to become manual; capture RED in `.omo/evidence/task_6_prompt-gallery-auto-manual-tags-red.txt`. Happy: `pnpm typecheck` plus the chosen scenario GREEN, evidence `.omo/evidence/task_6_prompt-gallery-auto-manual-tags-green.txt`.
  Commit: Y | `feat(ui): show automatic tags without manualizing them`

- [ ] 7. Add first-tag creation and bulk keyword feedback to tag management UI
  What to do / Must NOT do: Add a create-tag row/control to `TagManagementModal` so an empty DB is usable. Add client `createTag()` in `tag-mutations.ts`. Keyword save copy must communicate bulk behavior in user language, e.g. "자동 키워드 저장 시 기존 항목에도 적용됩니다." Do not create tags automatically from item modal free text.
  Parallelization: Wave 2 | Blocked by: 4, 5, 6 | Blocks: 8, 10
  References: `src/client/TagManagementModal.tsx:173` empty state; `src/client/tag-mutations.ts:37` no create mutation; `src/worker/tag-routes.ts:20` POST `/api/tags` already exists; `src/client/TagManagementRow.tsx:51` keyword field.
  Acceptance criteria: `pnpm typecheck` passes and browser QA can create the first tag through the UI from an empty tag list.
  QA scenarios: Failure: update `scripts/qa/browser-tag-management.mjs` to start with no `task-auto-` tags, click tag management, create a tag through UI, and assert visible row; capture RED before UI implementation in `.omo/evidence/task_7_prompt-gallery-auto-manual-tags-red.md`. Happy: rerun after implementation and capture GREEN in `.omo/evidence/task_7_prompt-gallery-auto-manual-tags-green.md`.
  Commit: Y | `feat(ui): create first tag from tag management`

- [ ] 8. Replace browser tag-management QA with source-aware real user flow
  What to do / Must NOT do: Rework `scripts/qa/browser-tag-management.mjs` so the critical setup uses UI for first tag creation. API may still create non-critical fixture items only after UI-created tags exist, but the QA must prove the UI can create tags and keyword edits cause bulk auto apply/remove. Capture screenshots for first-tag, auto-applied filter, auto-removed/manual-preserved states. Do not rely solely on API seed for the tag catalog.
  Parallelization: Wave 2 | Blocked by: 7 | Blocks: 10, final QA
  References: `scripts/qa/browser-tag-management.mjs:93` current `seedTag`; `scripts/qa/browser-tag-management.mjs:132` current API seed before UI; `scripts/qa/browser-smoke.mjs` scenario runner; `.omo/drafts/prompt-gallery-auto-manual-tags.md:54` QA scope.
  Acceptance criteria: `pnpm qa:browser -- --scenario tag-management --output .omo/evidence/task_8_prompt-gallery-auto-manual-tags.md` passes and evidence lists UI first-tag creation plus auto apply/remove assertions.
  QA scenarios: Failure: run the updated browser scenario before the UI supports first-tag creation; PASS only if it fails for missing create control, evidence `.omo/evidence/task_8_prompt-gallery-auto-manual-tags-red.md`. Happy: rerun after implementation; PASS if result is PASS and screenshots/JSON evidence exist, evidence `.omo/evidence/task_8_prompt-gallery-auto-manual-tags-green.md`.
  Commit: Y | `test(qa): cover source-aware tag management flow`

- [ ] 9. Update export, backup, and API smoke for tag source compatibility
  What to do / Must NOT do: Bump export schema version if item tag source metadata is included in exports. Export item tags with `{ id, name, color, sources }` and keep tag catalog data unchanged except for normal keyword updates. Update API smoke so automatic source behavior is observable through API, not only Worker tests. Do not expose R2 object keys or change unrelated export fields.
  Parallelization: Wave 3 | Blocked by: 1, 4, 5, 6 | Blocks: 10
  References: `src/worker/export-routes.ts` export implementation; `src/worker/export.test.ts` export tests; `scripts/qa/api-smoke-wave1.mjs:38` tag API smoke pattern; `scripts/qa/backup-local.mjs` backup helper; `_docs/20260709_01_배포작업-기록.md:39` deployed API endpoints.
  Acceptance criteria: `pnpm test:worker -- --run src/worker/export.test.ts` and `pnpm qa:api -- --output .omo/evidence/task_9_prompt-gallery-auto-manual-tags-api.md` pass with source-aware tag behavior covered.
  QA scenarios: Failure: add export/API expectations for source-aware tags and capture RED in `.omo/evidence/task_9_prompt-gallery-auto-manual-tags-red.txt`. Happy: rerun export test and API smoke; capture GREEN in `.omo/evidence/task_9_prompt-gallery-auto-manual-tags-green.txt` and `.omo/evidence/task_9_prompt-gallery-auto-manual-tags-api.md`.
  Commit: Y | `feat(export): preserve tag source metadata`

- [ ] 10. Run full verification commands and fix only regressions caused by this scope
  What to do / Must NOT do: Run `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm qa:api`, and `pnpm qa:browser`. Fix failures caused by the tag-source work. If unrelated pre-existing failures appear, record them and do not broaden scope.
  Parallelization: Wave 3 | Blocked by: 8, 9 | Blocks: 11
  References: `package.json:7` scripts; `AGENTS.md:59` command list; `.omo/drafts/prompt-gallery-auto-manual-tags.md:60` unrelated scope guard.
  Acceptance criteria: All listed commands exit 0, or any nonzero is proven pre-existing/unrelated with exact evidence.
  QA scenarios: Failure: first full run after integration, if any command fails, capture command, exit code, and failing lines in `.omo/evidence/task_10_prompt-gallery-auto-manual-tags-red.txt`. Happy: final full command run exits 0, evidence `.omo/evidence/task_10_prompt-gallery-auto-manual-tags-green.txt`.
  Commit: Y | `fix(tags): stabilize source-aware tag regressions`

- [ ] 11. Update docs/changelog and final implementation handoff notes
  What to do / Must NOT do: Update only project-owned documentation needed to explain the data semantics and verification. If `CHANGELOG.md` is updated, follow its existing table format and use a concrete scope such as `tags`. Do not create `BACKLOG.md`. Do not commit through raw git; use `cp` only if the user asks for commit.
  Parallelization: Wave 3 | Blocked by: 10 | Blocks: final wave
  References: `CHANGELOG.md:1` existing changelog format; `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:137` tag decision context; project instructions require root changelog format preservation and cp skill for commits.
  Acceptance criteria: Documentation states automatic tags are assignment rules, manual tags are user selections, keyword changes bulk recompute auto links, and manual links are preserved.
  QA scenarios: Failure: grep docs before update for `source-aware`/`manual`/`auto` semantics and capture missing output in `.omo/evidence/task_11_prompt-gallery-auto-manual-tags-red.txt`. Happy: grep updated docs/changelog for required semantics and capture output in `.omo/evidence/task_11_prompt-gallery-auto-manual-tags-green.txt`.
  Commit: Y | `docs(tags): document manual and automatic tag semantics`

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
  Run: `grep -RIn -E "manual|auto|bulk|source|first tag|migration|browser QA" .omo/plans/prompt-gallery-auto-manual-tags.md src/worker src/client scripts/qa migrations`
  PASS: every must-have in this plan has a completed todo with evidence, and no Must NOT Have is implemented.
- [ ] F2. Code quality review
  Run a read-only review of the diff covering TypeScript strictness, no `as any`/ignore directives, DB migration safety, repository transaction boundaries, and UI source semantics.
  PASS: reviewer returns unconditional approval or all findings are fixed and re-reviewed.
- [ ] F3. Real manual QA
  Run: `pnpm qa:browser -- --scenario tag-management --output .omo/evidence/final_prompt-gallery-auto-manual-tags-browser.md`
  PASS: evidence proves empty-DB first tag creation, bulk auto apply/remove, manual preservation, merge/delete regression, and no console/runtime errors.
- [ ] F4. Scope fidelity
  Run: `git diff --name-only` and inspect changes.
  PASS: changed source is limited to migrations, Worker tag/item/export paths, client tag/item parsing/UI, QA scripts, and docs required for this plan. No unrelated workflow/repo/image/auth/sharing implementation changes.

## Commit strategy
- Do not commit unless the user explicitly asks.
- If committing, use the `cp` skill per project rules; never run raw `git add`/`git commit`.
- Prefer one concern per commit:
  - `feat(tags): add source-aware item tag migration`
  - `feat(tags): preserve automatic tags during manual edits`
  - `feat(ui): create first tag from tag management`
  - `test(qa): cover source-aware tag management flow`
  - `docs(tags): document manual and automatic tag semantics`
- Run `node C:/Users/ahnbu/.claude/skills/_shared/security-gate.mjs precommit --repo D:/vibe-coding/prompt-gallery --staged` before any commit.

## Success criteria
- Existing item/tag links survive migration and are treated as manual.
- API responses distinguish manual and automatic tag sources without duplicate visible tags.
- Creating or editing manual tags never deletes automatic links except through automatic-rule recomputation.
- Adding or changing automatic keywords bulk-applies matching auto tags to existing items.
- Removing automatic keywords bulk-removes only stale auto links and preserves manual links.
- Empty production/local DB can create the first tag from the tag management UI.
- Browser QA proves first-tag creation, auto apply/remove, manual preservation, and filter behavior through the real UI.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm qa:api`, and `pnpm qa:browser` pass or any unrelated failure is clearly documented with evidence.
- No automatic tag catalog creation, item-level auto dismissal, auth/sharing expansion, or unrelated UI refactor is introduced.
