# Wave 3 Image Preview Browser QA

Scenario: image-preview
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario image-preview --output .omo/evidence/wave-3-image-preview-fail.md
Output: .omo/evidence/wave-3-image-preview-fail.md
Exit code: 1
Local app started: yes
Result: FAIL

## Assertions
- Image prompt can be created with no image.
- Card and detail modal show a lucide no-image state without placeholder files.
- Fixture upload displays a thumbnail through the Worker content proxy.
- Replacement updates the thumbnail protected content URL.
- Remove clears the preview and returns to no-image state.
- Asset responses and DOM do not expose public storage URLs.

## Failure
Card no-image state missing: locator.waitFor: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('[data-qa="gallery-card"]').filter({ hasText: 'Task16 Image 1783555483988-desktop' }).first().locator('[data-qa="image-preview-empty"]').first() to be visible[22m


## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-fail-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-fail-dev.stderr.log

## Binary Observable
Scenario failed before all assertions completed.

