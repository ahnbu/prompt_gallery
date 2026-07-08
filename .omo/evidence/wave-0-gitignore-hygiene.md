# Wave 0 Gitignore Hygiene Evidence

- Timestamp: 2026-07-08 15:32 KST
- Repo: `D:/vibe-coding/prompt-gallery`
- Changed files in this task: `.gitignore`, `.omo/evidence/wave-0-gitignore-hygiene.md`
- Captured artifact path: `.omo/evidence/wave-0-gitignore-hygiene.md`

## Scenario: generated dependency/build/runtime cache directories are ignored

Invocation:

```bash
git status --short --untracked-files=all | grep -E '^(\?\? )?(node_modules|dist|\.wrangler)/'
```

Binary observable:

- Exit status from `grep`: `1`
- Output: empty
- Interpretation: no untracked or modified generated directory lines for `node_modules/`, `dist/`, or `.wrangler/` remain visible in status.

Captured output:

```bash
grep_exit=1
```

## Scenario: status snapshot after hygiene change

Invocation:

```bash
git status --short | sed -n '1,160p'
```

Binary observable:

- Exit status: `0`
- `.gitignore` is modified.
- Pre-existing unrelated work remains visible and was not changed by this task.
- `DESIGN.md` remains visible as an untracked project artifact.
- Generated directories `node_modules/`, `dist/`, and `.wrangler/` are absent from this status output.

Captured output:

```bash
 M .gitignore
 M .omo/plans/prompt-gallery-implementation.md
?? .omo/boulder.json
?? .omo/evidence/wave-0-api-smoke-dev.stderr.log
?? .omo/evidence/wave-0-api-smoke-dev.stdout.log
?? .omo/evidence/wave-0-api-smoke-fail-gate.txt
?? .omo/evidence/wave-0-api-smoke-fail.txt
?? .omo/evidence/wave-0-api-smoke-gate-dev.stderr.log
?? .omo/evidence/wave-0-api-smoke-gate-dev.stdout.log
?? .omo/evidence/wave-0-api-smoke-gate-final-dev.stderr.log
?? .omo/evidence/wave-0-api-smoke-gate-final-dev.stdout.log
?? .omo/evidence/wave-0-api-smoke-gate-final.txt
?? .omo/evidence/wave-0-api-smoke-gate.txt
?? .omo/evidence/wave-0-api-smoke-review-dev.stderr.log
?? .omo/evidence/wave-0-api-smoke-review-dev.stdout.log
?? .omo/evidence/wave-0-api-smoke-review.txt
?? .omo/evidence/wave-0-api-smoke.txt
?? .omo/evidence/wave-0-browser-dev-rerun.stderr.log
?? .omo/evidence/wave-0-browser-dev-rerun.stdout.log
?? .omo/evidence/wave-0-browser-dev.stderr.log
?? .omo/evidence/wave-0-browser-dev.stdout.log
?? .omo/evidence/wave-0-browser-smoke-dev.stderr.log
?? .omo/evidence/wave-0-browser-smoke-dev.stdout.log
?? .omo/evidence/wave-0-browser-smoke-fail-rerun.txt
?? .omo/evidence/wave-0-browser-smoke-fail.txt
?? .omo/evidence/wave-0-browser-smoke-gate-dev.stderr.log
?? .omo/evidence/wave-0-browser-smoke-gate-dev.stdout.log
?? .omo/evidence/wave-0-browser-smoke-gate-final-dev.stderr.log
?? .omo/evidence/wave-0-browser-smoke-gate-final-dev.stdout.log
?? .omo/evidence/wave-0-browser-smoke-gate-final.md
?? .omo/evidence/wave-0-browser-smoke-gate.md
?? .omo/evidence/wave-0-browser-smoke-pass-rerun.txt
?? .omo/evidence/wave-0-browser-smoke-pass.txt
?? .omo/evidence/wave-0-browser-smoke-review-dev.stderr.log
?? .omo/evidence/wave-0-browser-smoke-review-dev.stdout.log
?? .omo/evidence/wave-0-browser-smoke-review.md
?? .omo/evidence/wave-0-browser-smoke.md
?? .omo/evidence/wave-0-browser-smoke.mjs
?? .omo/evidence/wave-0-cleanup-gate-final.md
?? .omo/evidence/wave-0-cleanup-gate.md
?? .omo/evidence/wave-0-cleanup-review.md
?? .omo/evidence/wave-0-cleanup.md
?? .omo/evidence/wave-0-code-review.md
?? .omo/evidence/wave-0-deploy-check.md
?? .omo/evidence/wave-0-dev.stderr.log
?? .omo/evidence/wave-0-dev.stdout.log
?? .omo/evidence/wave-0-fixtures.md
?? .omo/evidence/wave-0-gate-review.md
?? .omo/evidence/wave-0-malformed-cli.txt
?? .omo/evidence/wave-0-qa-scripts-doneclaim.md
?? .omo/evidence/wave-0-scaffold-gate-review.md
?? .omo/evidence/wave-0-scaffold.txt
?? .omo/evidence/wave-0-tasks-2-4-gate-review.md
?? .omo/evidence/wave-0-tasks-3-4-gate-review.md
?? .omo/evidence/wave-0-verify-plan-gate.md
?? .omo/evidence/wave-0-verify-plan.md
?? .omo/evidence/wave-0-verify-scope-gate.md
?? .omo/evidence/wave-0-verify-scope.md
?? .omo/start-work/
?? DESIGN.md
?? biome.json
?? index.html
?? migrations/
?? package.json
?? pnpm-lock.yaml
?? pnpm-workspace.yaml
?? scripts/
?? src/
?? tsconfig.json
?? vite.config.ts
?? vitest.worker.config.ts
?? wrangler.jsonc
```

## Scenario: lint script is available and passes

Invocation:

```bash
pnpm lint
```

Binary observable:

- Exit status: `0`
- Output includes `Checked 21 files` and `No fixes applied`.

Captured output:

```bash
Checked 21 files in 20ms. No fixes applied.
$ biome check .
```

## Scenario: requested `.gitignore` change is narrow

Invocation:

```bash
git diff -- .gitignore
```

Binary observable:

- Exit status: `0`
- Added only `node_modules/`, `dist/`, and `.wrangler/`.
- No `DESIGN.md` ignore rule was added.
- Existing binary ignore rules remain present after the new generated-directory rules.

Captured output:

```diff
@@ -14,6 +14,9 @@ _temp/
 _handoff/
 .playwright-cli/
 .codegraph/
+node_modules/
+dist/
+.wrangler/
 *.pptx
 *.xlsx
 *.docx
```
