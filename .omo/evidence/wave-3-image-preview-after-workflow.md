# Wave 3 Image Preview Browser QA

Scenario: image-preview
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario image-preview --output .omo/evidence/wave-3-image-preview-after-workflow.md
Output: .omo/evidence/wave-3-image-preview-after-workflow.md
Exit code: 0
Local app started: yes
Result: PASS

## Assertions
- Image prompt can be created with no image.
- Card and detail modal show a lucide no-image state without placeholder files.
- Invalid file upload exposes an accessible error state.
- Browser-side canvas resize/compress keeps uploaded preview content at 1200px max edge.
- Unsaved preview/title edits are discarded on cancel.
- Cancel after staged upload and staged replacement both clean temporary assets through DELETE /api/assets.
- Upload, replace, and remove are reflected only after explicit Save.
- Thumbnails display through the Worker content proxy.
- Asset responses, item responses, and DOM do not expose imageKey, objectKey, previews/, or public storage URLs.

## Screenshots
- desktop no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-after-workflow-desktop-no-image.png (30086 bytes)
- desktop uploaded-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-after-workflow-desktop-uploaded-thumbnail.png (259092 bytes)
- desktop replaced-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-after-workflow-desktop-replaced-thumbnail.png (500388 bytes)
- desktop removed-no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-after-workflow-desktop-removed-no-image.png (30086 bytes)
- mobile no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-after-workflow-mobile-no-image.png (26375 bytes)
- mobile uploaded-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-after-workflow-mobile-uploaded-thumbnail.png (167337 bytes)
- mobile replaced-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-after-workflow-mobile-replaced-thumbnail.png (243294 bytes)
- mobile removed-no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-after-workflow-mobile-removed-no-image.png (26375 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-after-workflow-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-image-preview-after-workflow-dev.stderr.log

## Binary Observable
Playwright invalid upload, resize, explicit-save preview, protected thumbnail, and screenshot assertions passed.

