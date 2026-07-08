# Wave 1 Checkbox 9 Re-Gate Review

recommendation: REJECT

## blockers

1. Missing independent checkbox 9 code review artifact: `.omo/evidence/wave-1-checkbox-9-code-review.md`.
   - Search evidence: `rg --files .omo/evidence | rg 'checkbox-9.*code.*review|code.*review.*checkbox-9|workflow.*repo.*code.*review'` returned no matches.
   - Existing checkbox 9 artifacts are gate/manual/dev logs only, not an independent code review report.
   - This remains a gate blocker even though the stale-reference behavior is fixed, because the required report coverage for the `programming` and `remove-ai-slops` perspectives is absent.

## originalIntent

Review Wave 1 checkbox 9 from `.omo/plans/prompt-gallery-implementation.md`: repo item GitHub URL validation plus workflow CRUD with ordered steps. Workflows must support prompt references, repo references, memo text, and external links, require a workflow name and at least one step, and avoid UI scope.

## desiredOutcome

The user-visible Worker API foundation should be markable complete only when:

- workflow CRUD works through the real Worker route.
- repo items reject invalid GitHub URLs.
- workflow steps persist and return in numeric order.
- deleted prompt/repo references do not make `GET /api/workflows/:id` return HTTP 500.
- malformed workflow payloads return JSON 400 errors.
- required tests/checks pass.
- no dev server remains on ports 5173 or 5190.
- independent checkbox 9 code review evidence exists.

## userOutcomeReview

The stale-reference blocker is fixed in current source and tests.

- `migrations/0001_initial.sql` keeps `workflow_steps.item_id TEXT REFERENCES items(id) ON DELETE SET NULL`.
- `src/worker/workflow-types.ts:20` and `src/worker/workflow-types.ts:24` now model prompt/repo step `itemId` as `string | null`.
- `src/worker/workflow-types.ts:137` and `src/worker/workflow-types.ts:143` return `row.item_id` directly instead of requiring a non-null value.
- `src/worker/workflows.test.ts:104` adds the regression: create workflow, delete referenced prompt item, then `GET /api/workflows/:id`.
- `src/worker/workflows.test.ts:126` asserts the stale prompt step returns `{ itemId: null }`.
- `src/worker/workflow-input.ts:96` and `src/worker/workflow-input.ts:102` still require `itemId` for newly submitted prompt/repo steps, so nullable output does not weaken create/update validation.

From the user's perspective, the API behavior that caused the previous reject is now supported. Checkbox 9 still cannot be marked complete because the independent code review artifact remains missing.

## checked artifact paths

- `.omo/plans/prompt-gallery-implementation.md`
- `.omo/evidence/wave-1-data-api.txt`
- `.omo/evidence/wave-1-checkbox-9-workflow-repo-api-gate-review.md`
- `.omo/evidence/wave-1-checkbox-9-dev-20260708_162822.stdout.log`
- `.omo/evidence/wave-1-checkbox-9-dev-20260708_162822.stderr.log`
- `.omo/evidence/wave-1-checkbox-9-manual-dev.stdout.log`
- `.omo/evidence/wave-1-checkbox-9-manual-dev.stderr.log`
- `.omo/evidence/wave-1-checkbox-9-manual-dev-retry.stdout.log`
- `.omo/evidence/wave-1-checkbox-9-manual-dev-retry.stderr.log`
- `migrations/0001_initial.sql`
- `src/worker/workflow-types.ts`
- `src/worker/workflows.test.ts`
- `src/worker/workflow-input.ts`
- `src/worker/workflow-repository.ts`
- `src/worker/workflow-routes.ts`
- `src/worker/item-input.ts`

## command evidence

- `pnpm test:worker -- --run src/worker/workflows.test.ts`: PASS, exit 0. Worker runner reported 5 files passed / 22 tests passed, including `workflows.test.ts` 7 tests.
- `pnpm test:worker -- --run src/worker/items.test.ts`: PASS, exit 0. Worker runner reported 5 files passed / 22 tests passed, including `items.test.ts` 4 tests.
- `pnpm typecheck`: PASS, exit 0.
- `pnpm lint`: PASS, exit 0.
- `pnpm test:worker`: PASS, exit 0. Worker runner reported 5 files passed / 22 tests passed.
- Port check: `Get-NetTCPConnection -LocalPort 5173,5190 -State Listen` returned `NO_LISTENER_5173_5190`.

Note: the focused `pnpm test:worker -- --run ...` commands still execute the full worker suite because of current package script argument forwarding. This is not a blocker here because the requested target files are included and passed.

## wave-1-data-api inspection

`.omo/evidence/wave-1-data-api.txt` contains the expected stale-reference lifecycle:

- RED: stale-reference regression failed with `Workflow step row is missing item_id`.
- GREEN: rerun passed after the mapper/type fix.
- Manual proof: `STALE_REFERENCE_GET_STATUS=200`.
- Manual proof: `STALE_REFERENCE_PROMPT_ITEM_ID_IS_NULL=True`.
- Validation proof: `MISSING_ITEMID_CREATE_STATUS=400`.
- Cleanup proof: `CLEANUP_DELETE_WORKFLOW_STATUS=200`, `CLEANUP_PORT_5190=NO_LISTENER`, and `LISTENING_5189_5190=NONE`.

The file is interleaved with checkbox 7 evidence, but the checkbox 9 stale-reference section is present and internally consistent.

## direct programming and remove-ai-slops pass

- Pure LOC: `workflow-types.ts=137`, `workflows.test.ts=183`, `workflow-input.ts=155`, `workflow-repository.ts=176`, `workflow-routes.ts=52`; no 250-line source smell.
- Escape hatch scan found no `as any`, `as unknown`, `@ts-ignore`, `@ts-expect-error`, or non-null assertion in the inspected workflow files.
- The stale-reference test is not deletion-only or tautological: it drives the Worker request handler, creates real D1 records, deletes through the item API, then asserts observable workflow JSON.
- The test does not mirror the implementation; it asserts HTTP status and JSON contract.
- The production fix is narrow and does not add unnecessary extraction, parsing, normalization, or speculative abstraction.
- No unresolved direct slop blocker was found in the stale-reference fix.

## exact evidence gaps

- Missing independent checkbox 9 code review report artifact: `.omo/evidence/wave-1-checkbox-9-code-review.md`.
- Because that report is absent, there is no independent artifact showing checkbox 9 coverage for `programming` strictness and `remove-ai-slops` overfit/slop criteria.

