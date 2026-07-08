# Wave 1 Checkbox 9 Code Review

verdict: PASS  
codeQualityStatus: WATCH  
recommendation: APPROVE  
reportPath: `.omo/evidence/wave-1-checkbox-9-code-review.md`

## Scope

Reviewed Wave 1 checkbox 9 only: workflow CRUD foundation, ordered workflow steps, repo GitHub URL validation, and stale deleted item reference behavior.

Checked files:

- `.omo/plans/prompt-gallery-implementation.md`
- `.omo/evidence/wave-1-data-api.txt`
- `.omo/evidence/wave-1-checkbox-9-workflow-repo-api-gate-review.md`
- `.omo/evidence/wave-1-checkbox-9-workflow-repo-api-regate-gate-review.md`
- `src/worker/workflows.test.ts`
- `src/worker/workflow-types.ts`
- `src/worker/workflow-input.ts`
- `src/worker/workflow-repository.ts`
- `src/worker/workflow-routes.ts`
- `src/worker/item-input.ts`
- `src/worker/item-types.ts`
- `src/worker/item-repository.ts`
- `src/worker/item-routes.ts`
- `src/worker/index.ts`
- `migrations/0001_initial.sql` for the stale-reference foreign-key behavior.

## Skill Perspective Check

- `omo:programming`: loaded `SKILL.md` and TypeScript references: `references/typescript/README.md`, `data-modeling.md`, `type-patterns.md`, `error-handling.md`, and `backend-hono.md`.
- `omo:remove-ai-slops`: loaded `SKILL.md` and applied the overfit/slop categories to production code and tests.
- Result: no blocking violation from either perspective. Notes are listed under LOW/MEDIUM.

## Command Results

- `pnpm test:worker -- --run src/worker/workflows.test.ts`: PASS, exit 0. Worker runner executed 5 files / 22 tests, including `workflows.test.ts` 7 tests.
- `pnpm test:worker -- --run src/worker/items.test.ts`: PASS, exit 0. Worker runner executed 5 files / 22 tests, including `items.test.ts` 4 tests.
- `pnpm typecheck`: PASS, exit 0.
- `pnpm lint`: PASS, exit 0. Biome checked 36 files.
- `pnpm test:worker`: PASS, exit 0. Worker runner executed 5 files / 22 tests.
- Port check: PASS. `Get-NetTCPConnection -LocalPort 5173,5190 -State Listen` returned `NO_LISTENER_5173_5190`.

Note: the requested focused `pnpm test:worker -- --run ...` commands currently execute the full Worker suite because the literal `--` is forwarded to Vitest. This is not a blocker here because the target files are included and pass.

## Blocker Resolution

Previous blocker: `GET /api/workflows/:id` returned HTTP 500 after a referenced item was deleted.

Status: RESOLVED.

Evidence:

- Schema allows stale item references by setting workflow step `item_id` to null: `migrations/0001_initial.sql:50`.
- Output type now models prompt/repo step `itemId` as nullable: `src/worker/workflow-types.ts:20`, `src/worker/workflow-types.ts:24`.
- Row mapper returns `row.item_id` directly for prompt/repo steps: `src/worker/workflow-types.ts:137`, `src/worker/workflow-types.ts:143`.
- Create/update input still requires `itemId` for new prompt/repo steps: `src/worker/workflow-input.ts:96`, `src/worker/workflow-input.ts:102`.
- Regression test drives the real Worker handler, deletes the referenced prompt item, then reads the workflow: `src/worker/workflows.test.ts:104`.
- Regression assertion expects `itemId: null`: `src/worker/workflows.test.ts:126`.
- Existing evidence shows RED with `Workflow step row is missing item_id` and manual GREEN with `STALE_REFERENCE_GET_STATUS=200`, `STALE_REFERENCE_PROMPT_ITEM_ID_IS_NULL=True`, and `MISSING_ITEMID_CREATE_STATUS=400`: `.omo/evidence/wave-1-data-api.txt:2679`, `.omo/evidence/wave-1-data-api.txt:3346`, `.omo/evidence/wave-1-data-api.txt:3348`, `.omo/evidence/wave-1-data-api.txt:3349`.

## Findings

### CRITICAL

None.

### HIGH

None.

### MEDIUM

1. Workflow PATCH behavior has no direct regression test.
   - References: `src/worker/workflow-routes.ts:41`, `src/worker/workflow-repository.ts:75`.
   - Impact: workflow update code is simple and statically checked, but the checkbox scope says workflow CRUD. Current tests cover create/read/order/malformed/stale-reference behavior; DELETE has manual cleanup evidence, but PATCH is not directly asserted.
   - Recommendation: add a narrow PATCH test in the next workflow test pass. Not blocking this stale-reference re-review.

### LOW

1. Boundary parsing is manual rather than Zod-based.
   - References: `src/worker/workflow-input.ts:10`, `src/worker/item-input.ts:20`.
   - Skill perspective: `omo:programming` prefers Zod at trust boundaries. The current codebase has no Zod dependency and uses a consistent small manual parser pattern. This is acceptable for the current scoped change, but should not grow into broader ad hoc validation.

2. Focused Worker command shape is misleading.
   - Reference: `package.json` script `test:worker`.
   - Impact: `pnpm test:worker -- --run src/worker/workflows.test.ts` runs the full Worker suite, not only the requested file. This did not hide failure here because `workflows.test.ts` is included and passes.

## API Quality

- Validation shape: JSON errors use `{ error: { code, message } }` via `errorResponse` in `src/worker/item-types.ts:117`. Workflow validation returns `invalid_workflow`; repo URL validation returns `invalid_item`.
- Repo GitHub URL validation: repo items require `https://github.com/<owner>/<repo...>` shape in `src/worker/item-input.ts:56`.
- D1 query safety: user values are bound through `.bind(...)`. Dynamic SQL in scoped code uses fixed column names or placeholder counts, not raw user values.
- Step ordering: persisted reads order by `position ASC, id ASC` in `src/worker/workflow-repository.ts:122`; duplicate positions are rejected in `src/worker/workflow-input.ts:134`.
- Missing-reference representation: deleted prompt/repo references are explicit as `itemId: null`, matching the requested contract.
- Scope fidelity: no UI or unrelated feature work was found in the reviewed checkbox 9 files.

## Test Quality

- RED/GREEN: stale-reference RED and GREEN are present in `.omo/evidence/wave-1-data-api.txt`.
- Behavioral assertions: `workflows.test.ts` drives the Worker handler and D1-backed routes, not isolated implementation functions.
- Malformed inputs: tests cover missing name, zero steps, invalid step kind, invalid link URL, and invalid repo URL.
- Stale-reference regression: covered and passing.
- Slop/overfit review: no deletion-only tests, tautological tests, `.only`, `.skip`, fake tests, prompt-string pinning, or implementation-constant mirroring found.

## Remove-AI-Slops Pass

- No placeholders, TODO/FIXME markers, skipped/focused tests, `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`, or console debug leftovers found in the scoped files.
- Pure LOC counts are below the 250-line hard ceiling:
  - `workflows.test.ts` 183
  - `workflow-types.ts` 137
  - `workflow-input.ts` 155
  - `workflow-repository.ts` 176
  - `workflow-routes.ts` 52
  - `item-input.ts` 175
  - `item-types.ts` 114
  - `item-repository.ts` 151
  - `item-routes.ts` 71
  - `index.ts` 52
- The stale-reference production change is narrow: it updates the output contract to match the existing DB deletion behavior and does not add broad parsing, normalization, or speculative abstraction.

## Residual Risks

- Workflow PATCH lacks a direct test, so CRUD coverage is not perfectly symmetric.
- `pnpm test` was not part of this requested verification set; prior evidence shows it can pass with no non-worker tests due the current package script.
- The worktree is dirty with broader Wave 1 changes and untracked evidence. This review did not revert or modify those files.

## Cleanup

- No product/source/package files were edited by this review.
- Only this report artifact was written.
- No listener remains on ports 5173 or 5190.

## Blockers

None.
