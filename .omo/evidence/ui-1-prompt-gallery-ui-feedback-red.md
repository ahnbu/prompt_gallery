# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/ui-1-prompt-gallery-ui-feedback-red.md
Output: .omo/evidence/ui-1-prompt-gallery-ui-feedback-red.md
Exit code: 1
Local app started: yes
Result: FAIL

## RED Evidence
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/ui-1-prompt-gallery-ui-feedback-red.md
Output: .omo/evidence/ui-1-prompt-gallery-ui-feedback-red.md
Exit code: 1
Observed failure: Section add button is missing: 프롬프트 추가

## Current Failure

## Failure
Section add button is missing: 프롬프트 추가

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-1-prompt-gallery-ui-feedback-red-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-1-prompt-gallery-ui-feedback-red-dev.stderr.log

## Notes
- Old BLOCK artifacts are superseded by later gate reviews; this evidence records the current gate run.

## Binary Observable
Nonzero CLI exit with captured browser assertion failure
