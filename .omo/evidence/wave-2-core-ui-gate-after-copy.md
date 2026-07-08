# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-2-core-ui-gate-after-copy.md
Output: .omo/evidence/wave-2-core-ui-gate-after-copy.md
Exit code: 0
Local app started: yes
Result: PASS

## GREEN Evidence
## Assertions
- API fixture data created through /api/tags, /api/items, and /api/workflows.
- Compact tabs visible by accessible role/name.
- All default view shows prompt, image prompt, workflow, and repo sections.
- Search switches All view from sectioned lists to unified results.
- AND tag filtering includes only cards with every selected tag.
- Type badges render for prompt, image prompt, workflow, and repo cards.
- Prompt cards are latest-first by API updated timestamp.
- Cards render at most 10 visible tag chips and show hidden tag overflow.
- Prompt, image prompt, workflow, repo, favorite, and All tabs filter fixture data.

## Screenshots
- mobile all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-mobile-all.png (158638 bytes)
- mobile search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-mobile-search.png (72218 bytes)
- mobile tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-mobile-tags.png (70877 bytes)
- tablet all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-tablet-all.png (152176 bytes)
- tablet search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-tablet-search.png (61090 bytes)
- tablet tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-tablet-tags.png (60742 bytes)
- desktop all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-desktop-all.png (145765 bytes)
- desktop search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-desktop-search.png (55789 bytes)
- desktop tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-desktop-tags.png (55130 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-after-copy-dev.stderr.log

## Binary Observable
Playwright screenshots written and gallery search DOM assertions passed
