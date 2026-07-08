# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-2-gate-gallery-search-final.md
Output: .omo/evidence/wave-2-gate-gallery-search-final.md
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
- mobile all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-mobile-all.png (111692 bytes)
- mobile search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-mobile-search.png (42331 bytes)
- mobile tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-mobile-tags.png (40884 bytes)
- tablet all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-tablet-all.png (105433 bytes)
- tablet search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-tablet-search.png (44869 bytes)
- tablet tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-tablet-tags.png (43474 bytes)
- desktop all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-desktop-all.png (107450 bytes)
- desktop search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-desktop-search.png (43868 bytes)
- desktop tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-desktop-tags.png (42200 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-gate-gallery-search-final-dev.stderr.log

## Notes
- Old BLOCK artifacts are superseded by later gate reviews; this evidence records the current gate run.

## Binary Observable
Playwright screenshots written and gallery search DOM assertions passed
