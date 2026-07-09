# Prompt Gallery Design Layout QA

Command: node scripts/qa/browser-design-layout.mjs --output .omo/evidence/ui-3-prompt-gallery-design-application-red.md
Base URL: http://127.0.0.1:5173
Output: .omo/evidence/ui-3-prompt-gallery-design-application-red.md
Exit code: 1
Local app started: yes
Result: FAIL

## Assertions
- Light design tokens are active on the rendered app shell.
- Desktop prompt row renders no more than 4 non-image cards.
- Prompt, Workflow, and Repo cards are square.
- Image prompt cards use natural-ratio masonry: wide < square < tall.
- Mobile/tablet/desktop viewports have no horizontal overflow.

## Failure
Expected light color-scheme, got dark

## Dev Server Logs
- stdout: .omo/evidence/ui-3-prompt-gallery-design-application-red-dev.stdout.log
- stderr: .omo/evidence/ui-3-prompt-gallery-design-application-red-dev.stderr.log

