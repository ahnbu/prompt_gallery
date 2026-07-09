# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-4-browser-smoke-red.md
Output: .omo/evidence/wave-4-browser-smoke-red.md
Exit code: 1
Local app started: yes
Result: FAIL

## RED Evidence
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-4-browser-smoke-red.md
Output: .omo/evidence/wave-4-browser-smoke-red.md
Exit code: 1
Observed failure: fetch failed

## Current Failure

## Failure
fetch failed

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-dev.stderr.log

## Notes
- Old BLOCK artifacts are superseded by later gate reviews; this evidence records the current gate run.

## Binary Observable
Nonzero CLI exit with captured browser assertion failure
