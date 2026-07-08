# Wave 0 QA Scripts DoneClaim

```json
{
  "task": "Wave 0 checkbox 3 only - repeatable QA, fixture, and evidence scripts",
  "result": "PASS",
  "plan_checkbox_changed": false,
  "changed_files": [
    "package.json",
    "scripts/qa/api-smoke.mjs",
    "scripts/qa/browser-smoke.mjs",
    "scripts/qa/create-fixtures.mjs",
    "scripts/qa/deploy-check.mjs",
    "scripts/qa/verify-plan.mjs",
    "scripts/qa/verify-scope.mjs",
    "scripts/qa/verify-cleanup.mjs",
    "test/fixtures/preview.png",
    ".omo/evidence/wave-0-api-smoke-fail.txt",
    ".omo/evidence/wave-0-api-smoke.txt",
    ".omo/evidence/wave-0-browser-smoke.md",
    ".omo/evidence/wave-0-browser-smoke-desktop.png",
    ".omo/evidence/wave-0-browser-smoke-mobile.png",
    ".omo/evidence/wave-0-fixtures.md",
    ".omo/evidence/wave-0-deploy-check.md",
    ".omo/evidence/wave-0-verify-plan.md",
    ".omo/evidence/wave-0-verify-scope.md",
    ".omo/evidence/wave-0-cleanup.md",
    ".omo/evidence/wave-0-malformed-cli.txt",
    ".omo/start-work/ledger.jsonl"
  ],
  "commands": [
    {
      "command": "pnpm qa:api -- --base-url http://127.0.0.1:5999 --output .omo/evidence/wave-0-api-smoke-fail.txt",
      "result": "expected nonzero",
      "observable": "fetch failed evidence recorded",
      "artifact": ".omo/evidence/wave-0-api-smoke-fail.txt"
    },
    {
      "command": "pnpm qa:fixtures",
      "result": "exit 0",
      "observable": "test/fixtures/preview.png generated, 224 bytes",
      "artifact": "test/fixtures/preview.png"
    },
    {
      "command": "pnpm qa:api -- --output .omo/evidence/wave-0-api-smoke.txt",
      "result": "exit 0",
      "observable": "HTTP 200 with JSON body {\"ok\":true}",
      "artifact": ".omo/evidence/wave-0-api-smoke.txt"
    },
    {
      "command": "pnpm qa:browser -- --output .omo/evidence/wave-0-browser-smoke.md",
      "result": "exit 0",
      "observable": "Prompt Gallery title, all tab controls, disabled search, desktop/mobile screenshots",
      "artifact": ".omo/evidence/wave-0-browser-smoke.md"
    },
    {
      "command": "pnpm deploy:check",
      "result": "exit 0",
      "observable": "DB, PREVIEWS, prompt-gallery-db, prompt-gallery-previews, database id present; color-db absent",
      "artifact": ".omo/evidence/wave-0-deploy-check.md"
    },
    {
      "command": "pnpm verify:plan -- --plan .omo/plans/prompt-gallery-implementation.md --evidence-dir .omo/evidence --output .omo/evidence/wave-0-verify-plan.md",
      "result": "exit 0",
      "observable": "required scripts, fixture, evidence files present; checkbox 3 still unchecked",
      "artifact": ".omo/evidence/wave-0-verify-plan.md"
    },
    {
      "command": "pnpm verify:scope -- --plan .omo/plans/prompt-gallery-implementation.md --output .omo/evidence/wave-0-verify-scope.md",
      "result": "exit 0",
      "observable": "forbidden product markers absent; checkbox 3 still unchecked",
      "artifact": ".omo/evidence/wave-0-verify-scope.md"
    },
    {
      "command": "pnpm verify:cleanup",
      "result": "exit 0",
      "observable": "0 listeners on port 5173",
      "artifact": ".omo/evidence/wave-0-cleanup.md"
    },
    {
      "command": "pnpm typecheck",
      "result": "exit 0",
      "observable": "tsc --noEmit passed",
      "artifact": "terminal output"
    },
    {
      "command": "pnpm lint",
      "result": "exit 0",
      "observable": "Biome checked 21 files with no fixes applied",
      "artifact": "terminal output"
    },
    {
      "command": "pnpm test",
      "result": "exit 0",
      "observable": "1 test file passed, 1 test passed",
      "artifact": "terminal output"
    },
    {
      "command": "pnpm test:worker -- --run src/worker/db-migration.test.ts",
      "result": "exit 0",
      "observable": "2 test files passed, required tables printed",
      "artifact": "terminal output"
    }
  ],
  "cleanup_receipt": ".omo/evidence/wave-0-cleanup.md",
  "risks": [
    "scripts/qa/browser-smoke.mjs is 241 pure LOC, below the 250 limit but in warning band; split before adding future scenarios.",
    "Worker tests still log Cloudflare runtime compatibility-date fallback to 2026-03-10, inherited from current dependency/runtime state."
  ]
}
```
