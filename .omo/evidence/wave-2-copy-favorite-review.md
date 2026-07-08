# Wave 2 Copy Favorite

Scenario: copy-favorite
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario copy-favorite --output .omo/evidence/wave-2-copy-favorite-review.md
Output: .omo/evidence/wave-2-copy-favorite-review.md
Exit code: 0
Local app started: yes
Result: PASS

## GREEN Evidence
## Assertions
- Card copy writes exactly the prompt body to clipboard.
- Detail copy writes exactly the image prompt body to clipboard.
- Repo cards do not expose body copy.
- Card favorite toggle includes and excludes the item in the Favorite tab.
- Modal favorite toggle updates detail state and the Favorite tab.

## Screenshots
- mobile copy-action: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-review-mobile-copy-action.png (73933 bytes)
- mobile card-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-review-mobile-card-favorite.png (74197 bytes)
- mobile favorite-tab: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-review-mobile-favorite-tab.png (25711 bytes)
- mobile modal-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-review-mobile-modal-favorite.png (75863 bytes)
- desktop copy-action: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-review-desktop-copy-action.png (66652 bytes)
- desktop card-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-review-desktop-card-favorite.png (66754 bytes)
- desktop favorite-tab: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-review-desktop-favorite-tab.png (33105 bytes)
- desktop modal-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-review-desktop-modal-favorite.png (72393 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-review-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-copy-favorite-review-dev.stderr.log

## Binary Observable
Playwright clipboard, favorite tab, and screenshot assertions passed
