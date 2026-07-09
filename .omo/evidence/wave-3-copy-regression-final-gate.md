# Wave 2 Copy Favorite

Scenario: copy-favorite
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario copy-favorite --output .omo/evidence/wave-3-copy-regression-final-gate.md
Output: .omo/evidence/wave-3-copy-regression-final-gate.md
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
- mobile copy-action: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-mobile-copy-action.png (153892 bytes)
- mobile card-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-mobile-card-favorite.png (154644 bytes)
- mobile favorite-tab: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-mobile-favorite-tab.png (71877 bytes)
- mobile modal-copy: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-mobile-modal-copy.png (159238 bytes)
- mobile modal-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-mobile-modal-favorite.png (153958 bytes)
- desktop copy-action: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-desktop-copy-action.png (138776 bytes)
- desktop card-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-desktop-card-favorite.png (137809 bytes)
- desktop favorite-tab: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-desktop-favorite-tab.png (74454 bytes)
- desktop modal-copy: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-desktop-modal-copy.png (147076 bytes)
- desktop modal-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-desktop-modal-favorite.png (145565 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-copy-regression-final-gate-dev.stderr.log

## Binary Observable
Playwright clipboard, favorite tab, and screenshot assertions passed
