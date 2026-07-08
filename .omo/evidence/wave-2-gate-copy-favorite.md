# Wave 2 Copy Favorite

Scenario: copy-favorite
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario copy-favorite --output .omo/evidence/wave-2-gate-copy-favorite.md
Output: .omo/evidence/wave-2-gate-copy-favorite.md
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
- mobile copy-action: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-mobile-copy-action.png (75513 bytes)
- mobile card-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-mobile-card-favorite.png (74908 bytes)
- mobile favorite-tab: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-mobile-favorite-tab.png (43758 bytes)
- mobile modal-copy: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-mobile-modal-copy.png (80775 bytes)
- mobile modal-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-mobile-modal-favorite.png (77296 bytes)
- desktop copy-action: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-desktop-copy-action.png (69387 bytes)
- desktop card-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-desktop-card-favorite.png (68256 bytes)
- desktop favorite-tab: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-desktop-favorite-tab.png (40962 bytes)
- desktop modal-copy: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-desktop-modal-copy.png (72185 bytes)
- desktop modal-favorite: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-desktop-modal-favorite.png (74078 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-copy-favorite-dev.stderr.log

## Binary Observable
Playwright clipboard, favorite tab, and screenshot assertions passed
