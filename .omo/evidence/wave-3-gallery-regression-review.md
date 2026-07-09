# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-3-gallery-regression-review.md
Output: .omo/evidence/wave-3-gallery-regression-review.md
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
- mobile all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-mobile-all.png (113006 bytes)
- mobile search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-mobile-search.png (42077 bytes)
- mobile tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-mobile-tags.png (40784 bytes)
- tablet all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-tablet-all.png (107072 bytes)
- tablet search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-tablet-search.png (44549 bytes)
- tablet tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-tablet-tags.png (43151 bytes)
- desktop all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-desktop-all.png (109600 bytes)
- desktop search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-desktop-search.png (42959 bytes)
- desktop tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-desktop-tags.png (41879 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gallery-regression-review-dev.stderr.log

## Notes
- Old BLOCK artifacts are superseded by later gate reviews; this evidence records the current gate run.

## Binary Observable
Playwright screenshots written and gallery search DOM assertions passed
