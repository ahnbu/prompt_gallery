# Wave 1 Checkbox 9 Gate Review

recommendation: REJECT

## originalIntent

Implement Wave 1 checkbox 9 from `.omo/plans/prompt-gallery-implementation.md`: repo item GitHub URL validation plus workflow CRUD with ordered steps. Workflows must support prompt item references, repo item references, memo text, and external links, require a workflow name and at least one step, and avoid UI scope.

## desiredOutcome

The user should be able to rely on the Worker API foundation for workflows and repo items:

- repo items reject invalid GitHub URLs.
- `GET/POST/PATCH/DELETE /api/workflows` works through the real Worker route.
- valid workflows persist and return ordered steps.
- malformed workflow payloads return JSON 400 errors.
- no dev server remains on port 5173.

## checked artifact paths

- `.omo/plans/prompt-gallery-implementation.md`
- `.omo/evidence/wave-1-data-api.txt`
- `.omo/evidence/wave-1-checkbox-9-dev-20260708_162822.stdout.log`
- `.omo/evidence/wave-1-checkbox-9-dev-20260708_162822.stderr.log`
- `src/worker/workflows.test.ts`
- `src/worker/workflow-types.ts`
- `src/worker/workflow-input.ts`
- `src/worker/workflow-repository.ts`
- `src/worker/workflow-routes.ts`
- `src/worker/index.ts`
- `src/worker/item-input.ts`
- `src/worker/item-types.ts`
- `src/worker/item-repository.ts`
- `src/worker/item-routes.ts`
- `migrations/0001_initial.sql`
- `package.json`
- `vitest.worker.config.ts`

## userOutcomeReview

The nominal checkbox 9 behavior is present and covered by `src/worker/workflows.test.ts`: create valid workflow, reject missing name, reject zero steps, return numeric step order, and reject non-GitHub repo URLs.

However, the shipped API is not reliable for the user workflow once normal item deletion occurs. The schema sets `workflow_steps.item_id` to null on item deletion, but `rowToWorkflowStep` treats null as a persistence error. A user can create a workflow referencing an item, delete that item through the existing item API, then receive HTTP 500 when reading the workflow. This is a blocking workflow/repo API foundation defect because the API already exposes both workflow references and item deletion.

## blockers

1. `GET /api/workflows/:id` returns HTTP 500 after a referenced item is deleted.
   - Evidence: live local Worker probe created prompt+repo items, created a workflow, deleted the prompt item, then requested the workflow.
   - Observed: `STALE_REFERENCE_GET_STATUS=500`.
   - Root cause from source inspection: `migrations/0001_initial.sql` uses `item_id TEXT REFERENCES items(id) ON DELETE SET NULL`, while `src/worker/workflow-types.ts` requires `row.item_id` to be non-null for prompt/repo steps and throws `WorkflowPersistenceError`.

2. Checkbox 9-specific review artifacts are incomplete for the final gate standard.
   - No checkbox 9 code review report was present under `.omo/evidence/`.
   - No supplied manual QA matrix or notepad path was available for inspection.
   - The existing evidence file includes DoneClaim and command logs, but report coverage for `omo:programming` and `omo:remove-ai-slops` perspectives is absent for checkbox 9.

## command evidence

- `pnpm test:worker -- --run src/worker/workflows.test.ts`: PASS, 5 worker test files / 18 tests passed. Note: due package script argument forwarding, this ran the worker suite, not only the requested file.
- `pnpm test:worker -- --run src/worker/items.test.ts`: PASS, 5 worker test files / 18 tests passed. Same argument forwarding caveat.
- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm test`: PASS with `No test files found` because `package.json` excludes `src/worker/**/*.test.ts` and uses `--passWithNoTests`; this is not useful coverage by itself.
- `pnpm test:worker`: PASS, 5 worker test files / 18 tests passed.
- Port 5173 cleanup: PASS, final check returned `NO_LISTENER_5173`.

## adversarial classes

- stale_state: FAIL. Current source was reread and a stale-reference state was probed; workflow read fails after referenced item deletion.
- dirty_worktree: PASS with risk. Worktree contains concurrent tag/task changes and untracked evidence; reviewed current artifacts without reverting anything.
- misleading_success_output: PARTIAL. Required commands pass, but `pnpm test` passes with no tests and file-specific `test:worker -- --run ...` invocations run the full worker suite due argument forwarding.
- malformed_input: PASS for covered cases. Evidence and tests cover missing workflow name, zero steps, invalid step kind, invalid link URL, and invalid repo GitHub URL.
- generated_cached_artifacts: PASS with caveat. Worker tests use Miniflare/D1 migrations; live probe used local D1 and cleaned gate-created rows.
- hung_or_long_commands: PASS. Commands completed within bounded time; final port check found no listener.
- flaky_tests: PASS. Worker suite was rerun and passed.
- prompt_injection: N/A. No LLM prompt execution or prompt-rendered trust boundary is involved in checkbox 9.

## remove-ai-slops and programming review

Direct slop pass did not find excessive/deletion-only/tautological tests in `workflows.test.ts`; the tests assert observable API behavior. Production code is mostly scoped and split by input/types/repository/routes. The blocker is not cosmetic slop; it is a real data-contract mismatch between schema deletion behavior and workflow step mapping.

The checkbox 9 evidence does not include an independent code review report showing the same skill-perspective coverage. That absence is an evidence blocker under the final gate instructions.

## exact evidence gaps

- Missing checkbox 9-specific code review report artifact.
- Missing supplied manual QA matrix artifact.
- Missing supplied notepad path artifact.
- `pnpm test` success is weak evidence because it ran zero tests.
- Existing tests do not cover workflow behavior after referenced item deletion, despite current schema explicitly producing nullable references.

