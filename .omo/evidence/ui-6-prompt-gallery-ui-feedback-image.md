# Wave 3 Image Preview Browser QA

Scenario: image-preview
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario image-preview --output .omo/evidence/ui-6-prompt-gallery-ui-feedback-image.md
Output: .omo/evidence/ui-6-prompt-gallery-ui-feedback-image.md
Exit code: 0
Local app started: yes
Result: PASS

## Assertions
- Image prompt can be created with no image.
- Card and detail modal show a lucide no-image state without placeholder files.
- Compact gallery image prompt preview frames stay square after create, upload, replace, and remove.
- Invalid file upload exposes an accessible error state.
- Browser-side canvas resize/compress keeps uploaded preview content at 1200px max edge.
- Unsaved preview/title edits are discarded on cancel.
- Cancel after staged upload and staged replacement both clean temporary assets through DELETE /api/assets.
- Upload, replace, and remove are reflected only after explicit Save.
- Thumbnails display through the Worker content proxy.
- Asset responses, item responses, and DOM do not expose imageKey, objectKey, previews/, or public storage URLs.

## Screenshots
- desktop no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-6-prompt-gallery-ui-feedback-image-desktop-no-image.png (37585 bytes)
- desktop uploaded-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-6-prompt-gallery-ui-feedback-image-desktop-uploaded-thumbnail.png (277496 bytes)
- desktop replaced-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-6-prompt-gallery-ui-feedback-image-desktop-replaced-thumbnail.png (986220 bytes)
- desktop removed-no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-6-prompt-gallery-ui-feedback-image-desktop-removed-no-image.png (37585 bytes)
- mobile no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-6-prompt-gallery-ui-feedback-image-mobile-no-image.png (29674 bytes)
- mobile uploaded-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-6-prompt-gallery-ui-feedback-image-mobile-uploaded-thumbnail.png (172694 bytes)
- mobile replaced-thumbnail: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-6-prompt-gallery-ui-feedback-image-mobile-replaced-thumbnail.png (248993 bytes)
- mobile removed-no-image: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-6-prompt-gallery-ui-feedback-image-mobile-removed-no-image.png (29674 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-6-prompt-gallery-ui-feedback-image-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\ui-6-prompt-gallery-ui-feedback-image-dev.stderr.log

## Binary Observable
Playwright invalid upload, square preview, resize, explicit-save preview, protected thumbnail, and screenshot assertions passed.

