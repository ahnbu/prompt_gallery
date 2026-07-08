# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-2-core-ui-gate.md
Output: .omo/evidence/wave-2-core-ui-gate.md
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
- mobile all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-mobile-all.png (140429 bytes)
- mobile search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-mobile-search.png (67572 bytes)
- mobile tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-mobile-tags.png (65891 bytes)
- tablet all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-tablet-all.png (140304 bytes)
- tablet search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-tablet-search.png (61513 bytes)
- tablet tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-tablet-tags.png (61432 bytes)
- desktop all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-desktop-all.png (140075 bytes)
- desktop search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-desktop-search.png (60166 bytes)
- desktop tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-desktop-tags.png (59536 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-gate-dev.stderr.log

## Binary Observable
Playwright screenshots written and gallery search DOM assertions passed
