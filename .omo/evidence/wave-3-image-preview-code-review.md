# Wave 3 Image Preview Browser QA

Scenario: image-preview
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario image-preview --output .omo/evidence/wave-3-image-preview-code-review.md
Output: .omo/evidence/wave-3-image-preview-code-review.md
Exit code: 1
Local app started: yes
Result: FAIL

## Assertions
- Image prompt can be created with no image.
- Card and detail modal show a lucide no-image state without placeholder files.
- Invalid file upload exposes an accessible error state.
- Browser-side canvas resize/compress keeps uploaded preview content at 1200px max edge.
- Unsaved preview/title edits are discarded on cancel.
- Upload, replace, and remove are reflected only after explicit Save.
- Thumbnails display through the Worker content proxy.
- Asset responses, item responses, and DOM do not expose imageKey, objectKey, previews/, or public storage URLs.

## Failure
Saved thumbnail missing: locator.waitFor: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for locator('[data-qa="gallery-card"]').filter({ hasText: 'Task16 Image 1783558536007-desktop' }).first().locator('[data-qa="image-preview-img"]').first() to be visible[22m


## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-code-review-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-code-review-dev.stderr.log

## Binary Observable
Scenario failed before all assertions completed.

