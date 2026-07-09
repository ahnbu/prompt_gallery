# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-3-gallery-regression-review-2.md
Output: .omo/evidence/wave-3-gallery-regression-review-2.md
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
- mobile all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-mobile-all.png (113345 bytes)
- mobile search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-mobile-search.png (41965 bytes)
- mobile tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-mobile-tags.png (40765 bytes)
- tablet all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-tablet-all.png (107452 bytes)
- tablet search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-tablet-search.png (44498 bytes)
- tablet tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-tablet-tags.png (43119 bytes)
- desktop all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-desktop-all.png (109702 bytes)
- desktop search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-desktop-search.png (43234 bytes)
- desktop tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-desktop-tags.png (41898 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-2-dev.stderr.log

## Notes
- Old BLOCK artifacts are superseded by later gate reviews; this evidence records the current gate run.

## Binary Observable
Playwright screenshots written and gallery search DOM assertions passed
