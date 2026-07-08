# Wave 1 RED Evidence Recovery

Recorded: 2026-07-08 KST

Verdict: recovered

Scope: recover missing Wave 1 RED evidence for items, tags, and workflows using existing verifiable logs only. No product/source/package files were edited. No commit was created. No plan checkboxes were updated.

## Summary

- items RED was recovered from Codex session raw `function_call_output`: `/api/items` tests failed with HTTP 404 before implementation.
- tags RED was recovered from Codex session raw `function_call_output`: `/api/tags` tests failed with HTTP 404 before implementation.
- workflows RED was recovered from Codex session raw `function_call_output`: `/api/workflows` tests failed with HTTP 404, and invalid repo URL validation failed because the response was 201 instead of 400.
- Live baseline replay was not needed. The current shared worktree is dirty, so destructive checkout/reset replay was not used.

## manualQa

```json
{
  "surfaceEvidence": [
    {
      "scenarioId": "red-items-worker-test",
      "criterionReference": "Wave 1 checkbox 6 RED for item API",
      "surface": "Codex session JSONL raw function_call_output",
      "exactInvocation": "pnpm test:worker -- --run src/worker/items.test.ts",
      "verdict": "PASS",
      "artifactRefs": ["art-items-red-transcript"]
    },
    {
      "scenarioId": "red-tags-worker-test",
      "criterionReference": "Wave 1 checkbox 7 RED for tag API",
      "surface": "Codex session JSONL raw function_call_output",
      "exactInvocation": "pnpm test:worker -- --run src/worker/tags.test.ts",
      "verdict": "PASS",
      "artifactRefs": ["art-tags-red-transcript"]
    },
    {
      "scenarioId": "red-workflows-worker-test",
      "criterionReference": "Wave 1 checkbox 9 RED for workflow/repo API",
      "surface": "Codex session JSONL raw function_call_output",
      "exactInvocation": "pnpm test:worker -- --run src/worker/workflows.test.ts",
      "verdict": "PASS",
      "artifactRefs": ["art-workflows-red-transcript"]
    }
  ],
  "adversarialCases": [
    {
      "scenarioId": "red-items-worker-test",
      "criterionReference": "Wave 1 checkbox 6 RED for item API",
      "adversarialClass": "secondary_claim_contamination",
      "expectedBehavior": "Use raw terminal output, not code-review or DoneClaim assertions.",
      "verdict": "PASS",
      "artifactRefs": ["art-items-red-transcript"]
    },
    {
      "scenarioId": "red-tags-worker-test",
      "criterionReference": "Wave 1 checkbox 7 RED for tag API",
      "adversarialClass": "test_filter_overcollection",
      "expectedBehavior": "Confirm the targeted tags.test.ts failure is present even if the Worker pool also collected other tests.",
      "verdict": "PASS",
      "artifactRefs": ["art-tags-red-transcript"]
    },
    {
      "scenarioId": "red-workflows-worker-test",
      "criterionReference": "Wave 1 checkbox 9 RED for workflow/repo API",
      "adversarialClass": "multi_failure_disambiguation",
      "expectedBehavior": "Confirm both workflow 404 failures and invalid repo URL 201-vs-400 failure are present in raw output.",
      "verdict": "PASS",
      "artifactRefs": ["art-workflows-red-transcript"]
    },
    {
      "scenarioId": "baseline-replay-safety",
      "criterionReference": "Allowed approach 2 safety",
      "adversarialClass": "dirty_worktree",
      "expectedBehavior": "Do not use unsafe checkout/reset in the shared dirty worktree.",
      "verdict": "PASS",
      "artifactRefs": ["art-recovery-report"]
    }
  ],
  "artifactRefs": [
    {
      "id": "art-items-red-transcript",
      "kind": "raw-session-transcript",
      "description": "Recovered item RED transcript from Codex session line 86; exit code 1; four items.test.ts failures with received 404.",
      "path": ".omo/evidence/wave-1-red-recovery/items-red-transcript.txt"
    },
    {
      "id": "art-tags-red-transcript",
      "kind": "raw-session-transcript",
      "description": "Recovered tag RED transcript from Codex session line 108; exit code 1; six tags.test.ts failures with received 404.",
      "path": ".omo/evidence/wave-1-red-recovery/tags-red-transcript.txt"
    },
    {
      "id": "art-workflows-red-transcript",
      "kind": "raw-session-transcript",
      "description": "Recovered workflow RED transcript from Codex session line 113; exit code 1; workflow 404 failures and invalid repo URL returned 201 instead of 400.",
      "path": ".omo/evidence/wave-1-red-recovery/workflows-red-transcript.txt"
    },
    {
      "id": "art-recovery-report",
      "kind": "recovery-report",
      "description": "This recovery report and manualQa matrix.",
      "path": ".omo/evidence/wave-1-red-evidence-recovery.md"
    }
  ]
}
```

## Exact Sources

- items source: `C:/Users/ahnbu/.codex/sessions/2026/07/08/rollout-2026-07-08T15-41-59-019f4076-2200-7aa2-8c03-58e65ab307b0.jsonl:86`
- tags source: `C:/Users/ahnbu/.codex/sessions/2026/07/08/rollout-2026-07-08T16-16-02-019f4095-58ed-7531-894c-bb37fc7b2b77.jsonl:108`
- workflows source: `C:/Users/ahnbu/.codex/sessions/2026/07/08/rollout-2026-07-08T16-16-30-019f4095-c8aa-7e82-999e-a30342096f7a.jsonl:113`

## Corrected RED Index

- items: recovered. `items-red-transcript.txt` records `Exit code: 1`, `src/worker/items.test.ts (4 tests | 4 failed)`, and failures such as `expected 404 to be 201` for `POST /api/items`.
- tags: recovered. `tags-red-transcript.txt` records `Exit code: 1`, `src/worker/tags.test.ts (6 tests | 6 failed)`, and failures such as `expected 404 to be 201` for tag creation paths.
- workflows: recovered. `workflows-red-transcript.txt` records `Exit code: 1`, `src/worker/workflows.test.ts (6 tests | 6 failed)`, `/api/workflows` failures such as `expected 404 to be 201`, and invalid repo URL failure `expected 201 to be 400`.

Checkbox 10 can proceed on RED evidence for items/tags/workflows.
