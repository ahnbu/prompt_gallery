# Wave 3 Workflow Repo Browser QA

Scenario: workflow-repo
Base URL: http://127.0.0.1:5173
Command: pnpm qa:browser -- --scenario workflow-repo --output .omo/evidence/wave-3-workflow-repo-red.md
Output: .omo/evidence/wave-3-workflow-repo-red.md
Exit code: 1
Local app started: yes
Result: FAIL

## Assertions
- Prompt fixture is available before workflow creation.
- Repo item is created through the visible item modal.
- Repo card and detail expose GitHub external links with target _blank.
- Workflow is created through the visible workflow modal.
- Workflow API validation errors are shown in the modal.
- Prompt, repo, memo, and external link steps persist after reload in positions 1..4.

## Failure
Workflow API validation error missing: locator.waitFor: Timeout 5000ms exceeded.
Call log:
[2m  - waiting for getByRole('alert').filter({ hasText: 'Link workflow steps require a valid URL.' }).first() to be visible[22m


## Dev Logs
stdout: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-workflow-repo-dev.stdout.log
stderr: D:\vibe-coding\prompt-gallery\.omo\evidence\wave-3-workflow-repo-dev.stderr.log

## Binary Observable
Scenario failed before all assertions completed.

