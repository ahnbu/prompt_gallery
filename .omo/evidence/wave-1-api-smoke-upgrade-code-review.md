# Wave 1 API Smoke Upgrade Code Review

reviewedAt: 2026-07-08 22:15 KST
verdict: PASS
codeQualityStatus: WATCH
recommendation: APPROVE
reportPath: .omo/evidence/wave-1-api-smoke-upgrade-code-review.md
blockers: none

## Scope

- Reviewed files: `scripts/qa/api-smoke.mjs`, `scripts/qa/api-smoke-support.mjs`, `scripts/qa/api-smoke-wave1.mjs`, `package.json`.
- Inspected evidence: `.omo/evidence/wave-1-api-smoke-fix-doneclaim.json`, `.omo/evidence/wave-1-api-smoke.txt`, `.omo/evidence/wave-1-api-smoke-remote-refusal.txt`, `.omo/evidence/wave-1-api-smoke-malformed-base-url.txt`.
- New rerun evidence from this review:
  - `.omo/evidence/wave-1-api-smoke-code-review-rerun.txt`
  - `.omo/evidence/wave-1-api-smoke-code-review-remote-refusal.txt`
  - `.omo/evidence/wave-1-api-smoke-code-review-cleanup.md`
- Product/source/package files were not edited. No commit was made.

## Skill Perspective Check

- `omo:programming` ran: loaded `SKILL.md` plus TypeScript guidance `references/typescript/README.md`, `tsconfig-strict.md`, `type-patterns.md`, `data-modeling.md`, and `error-handling.md`.
- `omo:remove-ai-slops` ran: loaded `SKILL.md`.
- Programming perspective result: no blocking violation in the reviewed diff. URL input is parsed and locally bounded before mutating calls, cleanup status is asserted, the child process uses an env allowlist instead of broad `process.env` spreading, and `pnpm test` delegates to real worker tests.
- Remove-ai-slops perspective result: no deletion-only, tautological, or implementation-mirroring test pattern found in the smoke upgrade. The tags smoke now asserts observable AND semantics with both-tag and one-tag marker items. No unnecessary production data extraction/parsing/normalization was added.

## Command Results

- `pnpm qa:api -- --output .omo/evidence/wave-1-api-smoke-code-review-rerun.txt`: PASS, exit 0. Evidence shows health, item fallback, tag creation, tags AND query, favorite, workflow, malformed favorite 400, and cleanup rows.
- `pnpm qa:api -- --base-url https://example.com --output .omo/evidence/wave-1-api-smoke-code-review-remote-refusal.txt`: expected refusal, exit 1. Evidence contains `Refusing mutating Wave 1 API smoke for non-local --base-url: https://example.com` and no Coverage/Health section.
- `pnpm typecheck`: PASS, exit 0 (`tsc --noEmit`).
- `pnpm lint`: PASS, exit 0 (`Checked 39 files. No fixes applied.`).
- `pnpm test`: PASS, exit 0. It invoked `pnpm test:worker` and ran 6 test files / 26 tests.
- `pnpm test:worker`: PASS, exit 0. It ran 6 test files / 26 tests.
- `pnpm verify:cleanup -- --output .omo/evidence/wave-1-api-smoke-code-review-cleanup.md`: PASS, exit 0. Evidence says `Port 5173 listeners: 0`.
- Direct listener probe after cleanup: PASS, `NO_LISTENER_5173`.

## Blocker Resolution

- Non-local `--base-url` mutating smoke refusal: fixed.
  - Evidence: `scripts/qa/api-smoke.mjs:27-40` parses URL and rejects non-HTTP or non-local hostnames before `runWave1`.
  - Rerun: remote refusal command exited 1 before any smoke coverage.
- Cleanup DELETE status assertion: fixed.
  - Evidence: `scripts/qa/api-smoke-wave1.mjs:16-19` calls `expectStatus(result, 200, ...)`.
  - Rerun: cleanup evidence contains workflow/item/tag DELETE rows with status 200.
- Tags filter smoke proves AND semantics: fixed.
  - Evidence: `scripts/qa/api-smoke-wave1.mjs:77-98` creates a both-tag item and a research-only control item, then requires the query result to include only the both-tag item.
  - Rerun: evidence includes `AND matched ... and excluded ...`.
- `pnpm test` no longer zero-test success: fixed.
  - Evidence: `package.json:12` sets `"test": "pnpm test:worker"`.
  - Rerun: `pnpm test` ran 6 files / 26 tests.
- Dev server child env uses explicit allowlist: fixed.
  - Evidence: `scripts/qa/api-smoke-support.mjs:9-29` defines `forwardedEnvKeys`; `scripts/qa/api-smoke-support.mjs:101-109` builds `childEnv` from that allowlist and adds only `BROWSER` / `NO_UPDATE_NOTIFIER`.
  - Pattern search found no broad `...process.env` spread in the reviewed scripts.

## Findings By Severity

### CRITICAL

- None.

### HIGH

- None.

### MEDIUM

- `scripts/qa/api-smoke-support.mjs:107-128` still starts Vite on the default port without `--strictPort`, then probes fixed `http://127.0.0.1:5173/api/health`. If a compatible stale local server is already listening before the smoke starts, the readiness probe can validate that listener instead of the newly spawned child. Current rerun is clean and post-cleanup listener count is 0, so this is a residual reliability risk, not an approval blocker.

### LOW

- `scripts/qa/api-smoke-support.mjs:1` is 208 pure LOC, which is below the 250 LOC defect threshold but inside the programming skill warning band. It is acceptable for this fix, but the next substantial smoke-support addition should split process management, HTTP/assert helpers, or evidence rendering.
- Worker test output warns that the installed Cloudflare Workers Runtime supports compatibility date `2026-03-10` while config requests `2026-07-08`, so tests fall back to `2026-03-10`. This did not fail the requested gates, but it is a version-alignment risk outside this smoke-script fix.

## Residual Risks

- The worktree contains broader Wave 1 product and evidence changes outside this review scope. This report approves only the scoped smoke-script/package changes and the blocker fixes listed above.
- Existing done-claim evidence was treated as untrusted; verdict is based on source inspection and this review's rerun outputs.

## Cleanup

- `pnpm verify:cleanup` passed.
- Direct port probe found no listener on port 5173 after the smoke run.
- No product/source/package file was modified by this review.

Final Status: PASS
