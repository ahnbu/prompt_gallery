# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-2-core-ui.md
Output: .omo/evidence/wave-2-core-ui.md
Exit code: 0
Local app started: yes
Result: PASS

## RED Evidence
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-2-core-ui-red.md
Output: .omo/evidence/wave-2-core-ui-red.md
Exit code: 1
Observed failure: Type badge is missing for Task11 Prompt task11-1783519554611-00cee9

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
- mobile all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-mobile-all.png (148251 bytes)
- mobile search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-mobile-search.png (71071 bytes)
- mobile tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-mobile-tags.png (69563 bytes)
- tablet all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-tablet-all.png (142335 bytes)
- tablet search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-tablet-search.png (57562 bytes)
- tablet tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-tablet-tags.png (56642 bytes)
- desktop all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-desktop-all.png (136635 bytes)
- desktop search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-desktop-search.png (53908 bytes)
- desktop tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-desktop-tags.png (52811 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-dev.stderr.log

## Binary Observable
Playwright screenshots written and gallery search DOM assertions passed
