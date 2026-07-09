# Wave 2 Copy Favorite

Scenario: copy-favorite
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario copy-favorite --output .omo/evidence/wave-3-copy-regression-review-2.md
Output: .omo/evidence/wave-3-copy-regression-review-2.md
Exit code: 0
Local app started: yes
Result: PASS

## GREEN Evidence
## Assertions
- Card copy writes exactly the prompt body to clipboard.
- Keyboard copy on a card control does not open the detail modal and exposes copy status.
- Detail copy writes exactly the image prompt body to clipboard.
- Detail copy exposes copy status to the user and screen reader.
- Repo cards do not expose body copy.
- Keyboard favorite on a card control does not open the detail modal.
- Card favorite toggle includes and excludes the item in the Favorite tab.
- Modal favorite toggle updates detail state and the Favorite tab.
- Favorite tab shows prompt, image prompt, and repo favorites in the official scenario.

## Screenshots
- mobile copy-action: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-mobile-copy-action.png (76140 bytes)
- mobile card-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-mobile-card-favorite.png (75545 bytes)
- mobile favorite-tab: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-mobile-favorite-tab.png (44761 bytes)
- mobile modal-copy: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-mobile-modal-copy.png (81880 bytes)
- mobile modal-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-mobile-modal-favorite.png (77790 bytes)
- desktop copy-action: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-desktop-copy-action.png (70764 bytes)
- desktop card-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-desktop-card-favorite.png (69617 bytes)
- desktop favorite-tab: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-desktop-favorite-tab.png (47518 bytes)
- desktop modal-copy: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-desktop-modal-copy.png (81390 bytes)
- desktop modal-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-desktop-modal-favorite.png (74993 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-review-2-dev.stderr.log

## Binary Observable
Playwright clipboard, favorite tab, and screenshot assertions passed
