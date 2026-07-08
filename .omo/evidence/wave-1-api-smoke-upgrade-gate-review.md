# Wave 1 API Smoke Upgrade Gate Review

reviewedAt: 2026-07-08 21:56 KST
recommendation: REJECT

## originalIntent

Re-run the Wave 1 checkbox 10 gate after the API smoke upgrade. The user expected the previous failure to be resolved: `pnpm qa:api` must no longer be health-only, evidence headings must clearly show Wave 1 coverage, all Wave 1 gate commands must pass, port 5173 must be clean, and the checkbox should be judged for marking complete and committing.

## desiredOutcome

Checkbox 10 is committable only if full checks pass, `qa:api` proves health/items/tags/favorite/workflow/malformed/cleanup through the real local Worker surface, RED/GREEN Wave 1 evidence is complete, dirty worktree contents are scoped to Wave 1, and required code review evidence covers the programming plus remove-ai-slops perspectives.

## userOutcomeReview

The upgraded API smoke now satisfies the endpoint-surface blocker. The rerun artifact is headed `# Wave 1 API Smoke` and records health, item fallback creation, tag creation, AND tag filtering, favorite toggle/filter, workflow creation with ordered steps, malformed favorite JSON 400, and cleanup with 200 statuses.

The gate cannot approve checkbox 10 yet. `.omo/evidence/wave-1-data-api.txt` still states that items, tags, and workflows have no original explicit RED headings and are GREEN-only in that file. That does not satisfy the checkbox 10 acceptance wording that Wave 1 evidence includes RED then GREEN notes. Also, no independent code review report for the API smoke upgrade files was found; checkbox 6-9 code reviews cover the product API slices, not the new `scripts/qa/api-smoke*.mjs` support split.

## blockers

1. RED/GREEN evidence gap remains for items, tags, and workflows.
   - `.omo/evidence/wave-1-data-api.txt:689` says no explicit `RED - items` heading exists and item evidence is GREEN-only.
   - `.omo/evidence/wave-1-data-api.txt:696` says no explicit `RED - tags` heading exists and tag evidence is GREEN-only.
   - `.omo/evidence/wave-1-data-api.txt:710` says no explicit `RED - workflows` heading exists and workflow evidence is GREEN-only.
   - Checkbox 10 acceptance requires evidence includes RED then GREEN notes for Wave 1.

2. Required code review report coverage is absent for the API smoke upgrade.
   - Search `rg --files --hidden .omo/evidence | rg "api-smoke.*code.*review|code.*review.*api-smoke|smoke.*upgrade.*review|wave-1.*api.*code.*review"` returned no matches.
   - Existing code review reports for checkboxes 6, 7, 8, and 9 include `programming` and `remove-ai-slops` coverage for product API work, but they do not cover `scripts/qa/api-smoke.mjs`, `scripts/qa/api-smoke-support.mjs`, `scripts/qa/api-smoke-wave1.mjs`, or the `package.json` test-script change.

## commandResults

- `pnpm typecheck`: PASS, exit 0.
- `pnpm lint`: PASS, exit 0; Biome checked 39 files.
- `pnpm test`: PASS, exit 0, but no test files were found because worker tests are excluded and `--passWithNoTests` is configured.
- `pnpm test:worker`: PASS, exit 0; 6 files and 26 tests passed.
- `pnpm build`: PASS, exit 0; Vite SSR and client builds completed.
- `pnpm qa:api -- --output .omo/evidence/wave-1-api-smoke-gate-rerun.txt`: PASS, exit 0; real local Worker API smoke recorded Wave 1 coverage.
- `pnpm verify:cleanup -- --output .omo/evidence/wave-1-cleanup-gate-rerun.md`: PASS, exit 0; port 5173 listeners: 0.
- Flaky test probe `pnpm test:worker`: PASS on rerun; 6 files and 26 tests passed again.
- Final port probe: `NO_LISTENER_5173`.

## adversarialReview

- stale_state: PASS. Current plan, evidence, diff, and newly generated rerun artifacts were inspected.
- dirty_worktree: PASS_WITH_EXPECTED_DIRTY_TREE. Dirty files are Wave 1 source/test/evidence/plan/ledger/package changes; no unrelated out-of-scope file was identified as mixed into the intended Wave 1 commit set.
- misleading_success_output: FAIL. `pnpm test` succeeds with zero tests, and the data evidence summaries for items/tags/workflows are labeled RED/GREEN while explicitly admitting no RED heading exists.
- malformed_input: PASS. API smoke records malformed favorite body returning JSON 400 `invalid_item`; worker tests include malformed favorite and invalid JSON paths.
- generated_cached_artifacts: PASS. The rerun API smoke and cleanup artifacts were freshly written at 2026-07-08 21:55 KST and contain current coverage.
- hung_or_long_commands: PASS. All commands completed within bounded tool timeouts; cleanup reports no listener on port 5173.
- flaky_tests: PASS. `pnpm test:worker` passed twice in this review.

## directRemoveAiSlopsProgrammingPass

`omo:remove-ai-slops` and `omo:programming` were loaded before this verdict. Direct pass over the diff, tests, and QA scripts found no `.only`, `.skip`, `as any`, `@ts-ignore`, `@ts-expect-error`, debug `console.log` in production worker code, deletion-only tests, or tests that merely verify a requested removal. Worker tests drive the Worker request surface and D1-backed behavior.

Slop/evidence risks remain:

- `package.json` makes `pnpm test` pass with zero tests; this is acceptable only if not represented as behavior coverage. Actual API coverage comes from `pnpm test:worker`.
- `scripts/qa/api-smoke-wave1.mjs` records cleanup statuses but does not assert every cleanup status is 200 before rendering "cleanup assertions passed." The current artifact shows 200 for each cleanup row, so the observed run is clean, but the script wording can overstate future cleanup failures.
- `src/worker/tag-repository.ts` remains at 248 pure LOC, below the 250 hard ceiling but in the warning band.

## checkedArtifactPaths

- `.omo/plans/prompt-gallery-implementation.md`
- `.omo/evidence/wave-1-api-smoke.txt`
- `.omo/evidence/wave-1-api-smoke-gate-rerun.txt`
- `.omo/evidence/wave-1-data-api.txt`
- `.omo/evidence/wave-1-api-smoke-doneclaim.json`
- `.omo/evidence/wave-1-cleanup-gate-rerun.md`
- `.omo/evidence/wave-1-gate-review.md`
- `.omo/evidence/wave-1-checkbox-6-code-review.md`
- `.omo/evidence/wave-1-checkbox-7-code-review.md`
- `.omo/evidence/wave-1-checkbox-8-code-review.md`
- `.omo/evidence/wave-1-checkbox-9-code-review.md`
- `package.json`
- `scripts/qa/api-smoke.mjs`
- `scripts/qa/api-smoke-support.mjs`
- `scripts/qa/api-smoke-wave1.mjs`
- `src/worker/*.test.ts`
- `src/worker/*-input.ts`
- `src/worker/*-repository.ts`
- `src/worker/*-routes.ts`
- `src/worker/*-types.ts`
- `src/worker/index.ts`

## exactEvidenceGaps

- Missing true RED evidence for item, tag, and workflow Wave 1 slices in `.omo/evidence/wave-1-data-api.txt`.
- Missing independent code review report for the API smoke upgrade with explicit `programming` and `remove-ai-slops` overfit/slop coverage.
- Cleanup artifact `.omo/evidence/wave-1-cleanup-gate-rerun.md` still renders `# Wave 0 Cleanup Receipt`; body content proves the generic cleanup check, but the heading remains confusing for Wave 1 evidence.

## cleanup

No source/package files were edited by this review. This gate review wrote only `.omo/evidence/wave-1-api-smoke-upgrade-gate-review.md` in addition to the user-requested command output artifacts. No commit was made. Port 5173 has no listener.
