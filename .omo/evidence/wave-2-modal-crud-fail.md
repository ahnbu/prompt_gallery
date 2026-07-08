# Wave 2 Modal CRUD

Scenario: modal-crud
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario modal-crud --output .omo/evidence/wave-2-modal-crud-fail.md
Output: .omo/evidence/wave-2-modal-crud-fail.md
Exit code: 1
Local app started: yes
Result: FAIL

## RED Evidence

## Failure
locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for getByRole('button', { name: '추가', exact: true })[22m


## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-modal-crud-fail-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-modal-crud-fail-dev.stderr.log

## Binary Observable
Nonzero CLI exit with captured browser assertion failure
