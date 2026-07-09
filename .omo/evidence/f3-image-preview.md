# Wave 3 Image Preview Browser QA

Scenario: image-preview
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario image-preview --output .omo/evidence/f3-image-preview.md
Output: .omo/evidence/f3-image-preview.md
Exit code: 0
Local app started: yes
Result: PASS

## Assertions
- Image prompt can be created with no image.
- Card and detail modal show a lucide no-image state without placeholder files.
- Compact gallery image prompt preview frames stay visible and bounded after create, upload, replace, and remove.
- Invalid file upload exposes an accessible error state.
- Browser-side canvas resize/compress keeps uploaded preview content at 1200px max edge.
- Unsaved preview/title edits are discarded on cancel.
- Cancel after staged upload and staged replacement both clean temporary assets through DELETE /api/assets.
- Upload, replace, and remove are reflected only after explicit Save.
- Thumbnails display through the Worker content proxy.
- Asset responses, item responses, and DOM do not expose imageKey, objectKey, previews/, or public storage URLs.

## Screenshots
- desktop no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\f3-image-preview-desktop-no-image.png (32547 bytes)
- desktop uploaded-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\f3-image-preview-desktop-uploaded-thumbnail.png (261002 bytes)
- desktop replaced-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\f3-image-preview-desktop-replaced-thumbnail.png (500329 bytes)
- desktop removed-no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\f3-image-preview-desktop-removed-no-image.png (32547 bytes)
- mobile no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\f3-image-preview-mobile-no-image.png (28759 bytes)
- mobile uploaded-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\f3-image-preview-mobile-uploaded-thumbnail.png (167608 bytes)
- mobile replaced-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\f3-image-preview-mobile-replaced-thumbnail.png (245095 bytes)
- mobile removed-no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\f3-image-preview-mobile-removed-no-image.png (28759 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\f3-image-preview-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\f3-image-preview-dev.stderr.log

## Binary Observable
Playwright invalid upload, bounded preview, resize, explicit-save preview, protected thumbnail, and screenshot assertions passed.

