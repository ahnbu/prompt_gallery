APPROVE

# Wave 3 Task 17 Code Review

- codeQualityStatus: WATCH
- recommendation: APPROVE
- reportPath: `.omo/evidence/wave-3-task-17-code-review.md`
- blockers: none
- review date: 2026-07-09 KST

## Scope Checked

Task 17 scope: repo item form/card/detail with GitHub open action; workflow list/detail/editor with ordered prompt, repo, memo, and external link steps; no local folder actions; no Wave 4 tag/export/deploy scope.

Reviewed Task17 files and directly coupled call sites:

- `src/client/WorkflowModal.tsx`
- `src/client/WorkflowModalFields.tsx`
- `src/client/workflow-modal-model.ts`
- `src/client/workflow-mutations.ts`
- `src/client/App.tsx`
- `src/client/GalleryList.tsx`
- `src/client/GalleryCard.tsx`
- `src/client/ItemModalDetail.tsx`
- `src/client/styles/modal.css`
- `scripts/qa/browser-smoke.mjs`
- `scripts/qa/browser-workflow-repo.mjs`
- `scripts/qa/browser-workflow-repo-evidence.mjs`
- relevant workflow API/parser files for contract checks

## Skill Perspective Check

Ran the required skill-perspective check before judging tests and maintainability.

- `omo:remove-ai-slops`: loaded. Applied its review pass for deletion-only tests, tautological tests, implementation-mirroring assertions, needless production parsing/normalization, broad defensive code, >250 pure LOC, and scope drift.
- `omo:programming`: loaded, including the TypeScript reference. Applied its checks for strict typing, no `any`, no `@ts-*` suppressions, no non-null assertions, behavior-shaped tests, no needless abstractions, and 250 pure LOC threshold.
- Result: no blocking violation of either perspective in Task17 scope. The browser test is behavior-oriented. One LOW coverage gap remains for edit/update interaction.

## Findings By Severity

### CRITICAL

None.

### HIGH

None.

### MEDIUM

None.

### LOW

1. Workflow edit/update path is implemented but not directly exercised by the Task17 browser scenario.
   - References: `src/client/WorkflowModal.tsx:73`, `src/client/WorkflowModal.tsx:83`, `src/client/WorkflowModal.tsx:86`, `src/client/WorkflowModal.tsx:155`; `scripts/qa/browser-workflow-repo.mjs:157`, `scripts/qa/browser-workflow-repo.mjs:183`.
   - The modal exposes detail -> edit -> save and selects create vs update correctly, and the API contract supports PATCH. The QA scenario creates a workflow, validates API error display, reloads, and verifies ordered persisted detail, but it does not click `수정` and persist an edited workflow. This is not a blocker for the stated acceptance criteria, but it is residual regression risk for "detail/edit behavior".

## Positive Checks

- Explicit Save boundary: form state is local until `save()` calls `createWorkflow` or `updateWorkflow` in `src/client/WorkflowModal.tsx:73-89`.
- Ordered step persistence positions: UI parse assigns positions from current array order in `src/client/workflow-modal-model.ts:68-92`; Worker reads persist in numeric order via existing repository path.
- Repo GitHub target: card and detail links use `href={item.githubUrl}` plus `target="_blank"` and `rel="noreferrer"` in `src/client/GalleryCard.tsx:121-128` and `src/client/ItemModalDetail.tsx:13-20`.
- Workflow detail/editor behavior: detail renders ordered steps with kind labels and resolved item titles in `src/client/WorkflowModalFields.tsx:22-28`; editor supports prompt, repo, memo, and link step inputs in `src/client/WorkflowModalFields.tsx:90-188`.
- No local folder behavior: scope search found only the existing `scripts/qa/verify-scope.mjs` forbidden-string check; no Task17 UI or QA local folder action was added.
- No Wave4 tag/export/deploy scope in Task17 implementation.
- No `as any`, explicit `: any`, `@ts-ignore`, `@ts-expect-error`, non-null assertion, or empty catch found in Task17 files.
- Pure LOC counts are under the 250 blocker threshold: `WorkflowModal.tsx` 195, `WorkflowModalFields.tsx` 190, `workflow-modal-model.ts` 136, `GalleryCard.tsx` 200, `browser-smoke.mjs` 222, `browser-workflow-repo.mjs` 237.

## Verification

Commands run during review:

- `pnpm typecheck` -> PASS.
- `pnpm lint` -> PASS.
- `git diff --check` -> PASS; only CRLF warnings from existing dirty worktree.
- `pnpm test:worker -- --run src/worker/workflows.test.ts` -> PASS; Vitest ran the worker suite, 7 files and 39 tests passed.
- `pnpm build` -> PASS.

Evidence inspected:

- `.omo/evidence/wave-3-workflow-repo.md` -> PASS with screenshot artifact paths and baseline RED.
- `.omo/evidence/wave-3-workflow-repo-red.md` -> expected failure captured before final pass.
- `.omo/evidence/wave-3-workflow-repo-qa-review.md` -> independent PASS evidence.
- `.omo/evidence/wave-3-cleanup-workflow-repo.md` -> PASS, no port 5173 listeners.
- Workflow repo desktop/mobile screenshots were opened and inspected; no blank modal or broken primary flow observed.

## Decision

Approve. The implementation satisfies Task17's repo GitHub action and workflow creation/detail/persistence scope, keeps Save as the mutation boundary, avoids local folder and Wave4 behavior, and passes the checked gates. The only noted issue is a non-blocking coverage gap around editing an already-created workflow.
