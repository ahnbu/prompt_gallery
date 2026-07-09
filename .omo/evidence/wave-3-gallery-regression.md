# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-3-gallery-regression.md
Output: .omo/evidence/wave-3-gallery-regression.md
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
- Cards render at most 10 compact visible tag chips and show hidden tag overflow.
- Prompt, image prompt, workflow, repo, favorite, and All tabs filter fixture data.

## Screenshots
- mobile all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-mobile-all.png (113521 bytes)
- mobile search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-mobile-search.png (42390 bytes)
- mobile tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-mobile-tags.png (40944 bytes)
- tablet all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-tablet-all.png (107757 bytes)
- tablet search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-tablet-search.png (44822 bytes)
- tablet tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-tablet-tags.png (43399 bytes)
- desktop all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-desktop-all.png (110335 bytes)
- desktop search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-desktop-search.png (43631 bytes)
- desktop tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-desktop-tags.png (42145 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-dev.stderr.log

## Notes
- Old BLOCK artifacts are superseded by later gate reviews; this evidence records the current gate run.

## Binary Observable
Playwright screenshots written and gallery search DOM assertions passed
