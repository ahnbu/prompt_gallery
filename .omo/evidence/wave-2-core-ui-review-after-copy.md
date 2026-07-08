# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-2-core-ui-review-after-copy.md
Output: .omo/evidence/wave-2-core-ui-review-after-copy.md
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
- mobile all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-mobile-all.png (146515 bytes)
- mobile search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-mobile-search.png (71806 bytes)
- mobile tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-mobile-tags.png (70219 bytes)
- tablet all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-tablet-all.png (146272 bytes)
- tablet search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-tablet-search.png (66410 bytes)
- tablet tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-tablet-tags.png (66028 bytes)
- desktop all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-desktop-all.png (143383 bytes)
- desktop search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-desktop-search.png (63238 bytes)
- desktop tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-desktop-tags.png (62714 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-2-core-ui-review-after-copy-dev.stderr.log

## Binary Observable
Playwright screenshots written and gallery search DOM assertions passed
