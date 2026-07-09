# Wave 3 Workflow Repo Browser QA

Scenario: workflow-repo
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario workflow-repo --output .omo/evidence/wave-3-workflow-repo-qa-review.md
Output: .omo/evidence/wave-3-workflow-repo-qa-review.md
Exit code: 0
Local app started: yes
Result: PASS

## Assertions
- Prompt fixture is available before workflow creation.
- Repo item is created through the visible item modal.
- Repo card and detail expose GitHub external links with target _blank.
- Workflow is created through the visible workflow modal.
- Workflow API validation errors are shown in the modal.
- Prompt, repo, memo, and external link steps persist after reload in positions 1..4.
- Task17 prompt, repo, and workflow fixtures are deleted through API cleanup.

## Screenshots
- desktop repo-card: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-workflow-repo-qa-review-desktop-repo-card.png (30508 bytes)
- desktop workflow-validation: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-workflow-repo-qa-review-desktop-workflow-validation.png (46306 bytes)
- desktop workflow-detail: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-workflow-repo-qa-review-desktop-workflow-detail.png (50185 bytes)
- mobile repo-card: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-workflow-repo-qa-review-mobile-repo-card.png (31020 bytes)
- mobile workflow-validation: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-workflow-repo-qa-review-mobile-workflow-validation.png (30481 bytes)
- mobile workflow-detail: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-workflow-repo-qa-review-mobile-workflow-detail.png (34391 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-workflow-repo-qa-review-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-workflow-repo-qa-review-dev.stderr.log

## Binary Observable
Playwright repo link, workflow validation, reload, ordered step DOM, API cleanup, and screenshot assertions passed.

