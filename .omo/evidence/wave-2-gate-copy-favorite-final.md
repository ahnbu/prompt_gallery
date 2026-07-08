# Wave 2 Copy Favorite

Scenario: copy-favorite
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario copy-favorite --output .omo/evidence/wave-2-gate-copy-favorite-final.md
Output: .omo/evidence/wave-2-gate-copy-favorite-final.md
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
- mobile copy-action: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-mobile-copy-action.png (74774 bytes)
- mobile card-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-mobile-card-favorite.png (74174 bytes)
- mobile favorite-tab: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-mobile-favorite-tab.png (43297 bytes)
- mobile modal-copy: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-mobile-modal-copy.png (79831 bytes)
- mobile modal-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-mobile-modal-favorite.png (76353 bytes)
- desktop copy-action: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-desktop-copy-action.png (68762 bytes)
- desktop card-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-desktop-card-favorite.png (67707 bytes)
- desktop favorite-tab: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-desktop-favorite-tab.png (40782 bytes)
- desktop modal-copy: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-desktop-modal-copy.png (71302 bytes)
- desktop modal-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-desktop-modal-favorite.png (72969 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-final-dev.stderr.log

## Binary Observable
Playwright clipboard, favorite tab, and screenshot assertions passed
