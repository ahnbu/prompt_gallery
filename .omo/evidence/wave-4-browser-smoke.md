# Wave 2 Core UI - Gallery Search

Scenario: gallery-search
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-4-browser-smoke.md
Output: .omo/evidence/wave-4-browser-smoke.md
Exit code: 0
Local app started: yes
Result: PASS

## RED Evidence
Command: pnpm qa:browser -- --scenario gallery-search --output .omo/evidence/wave-4-browser-smoke-red.md
Output: .omo/evidence/wave-4-browser-smoke-red.md
Exit code: 1
Observed failure: fetch failed

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
- mobile all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-mobile-all.png (114666 bytes)
- mobile search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-mobile-search.png (43966 bytes)
- mobile tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-mobile-tags.png (42777 bytes)
- tablet all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-tablet-all.png (108717 bytes)
- tablet search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-tablet-search.png (46100 bytes)
- tablet tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-tablet-tags.png (44649 bytes)
- desktop all: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-desktop-all.png (110808 bytes)
- desktop search: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-desktop-search.png (44734 bytes)
- desktop tags: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-desktop-tags.png (43287 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-4-browser-smoke-dev.stderr.log

## Notes
- Old BLOCK artifacts are superseded by later gate reviews; this evidence records the current gate run.

## Binary Observable
Playwright screenshots written and gallery search DOM assertions passed
