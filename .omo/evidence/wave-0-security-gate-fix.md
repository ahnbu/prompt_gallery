# Wave 0 Security Gate Fix

## Changed Files

- `scripts/qa/api-smoke.mjs`
- `scripts/qa/browser-smoke.mjs`

## Scenario

Precommit security gate blocked staged QA scripts because each script combined local network checks with broad credential environment inheritance:

- `scripts/qa/api-smoke.mjs`: `env: { ...process.env, BROWSER: "none" }`
- `scripts/qa/browser-smoke.mjs`: `env: { ...process.env, BROWSER: "none" }`

## Fix

Both Vite child processes now receive only explicit non-secret environment values:

- `BROWSER=none`
- `NO_UPDATE_NOTIFIER=1`

No `process.env` or `...process.env` references remain in the two scripts.

## Verification

| Invocation | Result | Binary Observable | Artifact |
| --- | --- | --- | --- |
| `pnpm qa:api -- --output .omo/evidence/wave-0-api-smoke-security-fix.txt` | PASS | HTTP 200 with JSON body containing `ok:true` | `.omo/evidence/wave-0-api-smoke-security-fix.txt` |
| `pnpm qa:browser -- --output .omo/evidence/wave-0-browser-smoke-security-fix.md` | PASS | DOM role assertions passed and screenshots exceeded 1KB | `.omo/evidence/wave-0-browser-smoke-security-fix.md` |
| `pnpm lint` | PASS | Biome checked 21 files with no fixes applied | terminal output |
| `node C:/Users/ahnbu/.claude/skills/_shared/security-gate.mjs precommit --repo D:/vibe-coding/prompt-gallery --staged` | PASS | Security gate returned exit 0 | terminal output |
| `git diff -- scripts/qa/api-smoke.mjs scripts/qa/browser-smoke.mjs` | PASS | Only the two env literals changed | terminal output |
| `git diff --cached -- scripts/qa/api-smoke.mjs scripts/qa/browser-smoke.mjs` | NEEDS RESTAGE | Cached versions still show the old staged files with `...process.env` | terminal output |

## Restage Requirement

Root must stage `scripts/qa/api-smoke.mjs` and `scripts/qa/browser-smoke.mjs` again before the final precommit security gate, because the cached diff still contains the old staged script contents.
