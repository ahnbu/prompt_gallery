# Wave 2 Copy Favorite

Scenario: copy-favorite
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario copy-favorite --output .omo/evidence/wave-2-copy-favorite-fail.md
Output: .omo/evidence/wave-2-copy-favorite-fail.md
Exit code: 1
Local app started: yes
Result: FAIL

## RED Evidence

## Failure
locator.click: Timeout 30000ms exceeded.
Call log:
[2m  - waiting for locator('[data-qa="gallery-card"]').filter({ hasText: 'Task13 Prompt task13-1783522775519-9d4b69' }).first().getByRole('button', { name: 'Task13 Prompt task13-1783522775519-9d4b69 본문 복사' })[22m


## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-fail-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-fail-dev.stderr.log

## Binary Observable
Nonzero CLI exit with captured browser assertion failure
