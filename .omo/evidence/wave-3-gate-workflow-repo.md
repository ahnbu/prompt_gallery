# Wave 3 Workflow Repo Browser QA

Scenario: workflow-repo
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario workflow-repo --output .omo/evidence/wave-3-gate-workflow-repo.md
Output: .omo/evidence/wave-3-gate-workflow-repo.md
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
- desktop repo-card: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gate-workflow-repo-desktop-repo-card.png (30380 bytes)
- desktop workflow-validation: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gate-workflow-repo-desktop-workflow-validation.png (46021 bytes)
- desktop workflow-detail: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gate-workflow-repo-desktop-workflow-detail.png (50286 bytes)
- mobile repo-card: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gate-workflow-repo-mobile-repo-card.png (31161 bytes)
- mobile workflow-validation: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gate-workflow-repo-mobile-workflow-validation.png (30446 bytes)
- mobile workflow-detail: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gate-workflow-repo-mobile-workflow-detail.png (34854 bytes)

## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gate-workflow-repo-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-gate-workflow-repo-dev.stderr.log

## Binary Observable
Playwright repo link, workflow validation, reload, ordered step DOM, API cleanup, and screenshot assertions passed.

