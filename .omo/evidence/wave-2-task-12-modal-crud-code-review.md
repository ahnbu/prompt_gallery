# Wave 2 Task 12 Modal CRUD Code Review

codeQualityStatus: BLOCK
recommendation: REQUEST_CHANGES
reportPath: .omo/evidence/wave-2-task-12-modal-crud-code-review.md

## Skill Perspective Check

- `omo:remove-ai-slops`: ran by reading `C:/Users/ahnbu/.codex/plugins/cache/sisyphuslabs/omo/4.16.0/skills/remove-ai-slops/SKILL.md`.
- `omo:programming`: ran by reading `C:/Users/ahnbu/.codex/plugins/cache/sisyphuslabs/omo/4.16.0/skills/programming/SKILL.md`, `references/typescript/README.md`, and `references/code-smells.md`.
- Result: no deletion-only tests, tautological deletion tests, copy/favorite Task 13 scope expansion, upload/R2 expansion, `any`, `@ts-ignore`, or oversized reviewed source files found. The QA does overstate explicit-save coverage because it does not include a negative unsaved-change assertion.

## Findings

### CRITICAL / P0

- None.

### HIGH / P1

1. `src/client/ItemModalForm.tsx:19` exposes the type selector in edit mode, but `src/client/item-mutations.ts:13` explicitly omits `type` from PATCH and `src/client/ItemModal.tsx:61` sends only `parsed.payload` during update. A user can change a prompt to repo/image in the modal, satisfy the form fields for the selected draft type, click save, and see a successful refresh while the backend item type remains unchanged. This is a silent data/UX mismatch in the edit flow. Fix by making type immutable in edit mode unless type conversion is intentionally implemented through the API and covered by QA.

2. `src/client/ItemModal.tsx:91` renders a visual modal with `<dialog open aria-modal="true">`, but there is no `showModal()`, inert/background focus isolation, initial focus handling, Escape/cancel handler, or focus return path. Because `open` alone creates a non-modal dialog, keyboard focus can remain on or move through controls behind the overlay while the UI claims `aria-modal=true`. This violates the requested modal focus/close accessibility check. Fix with a real modal dialog lifecycle or an explicit focus trap/inert implementation, including Escape/cancel and focus restoration.

### MEDIUM / P2

- None.

### LOW / P3

1. `scripts/qa/browser-modal-crud.mjs:96` to `scripts/qa/browser-modal-crud.mjs:104` only fills edit fields and clicks save, while `scripts/qa/browser-modal-crud.mjs:188` reports that changes happen "only on explicit save." The scenario does not make an unsaved edit, close/cancel, and verify the card/API is unchanged. It would not catch a future auto-save-on-change regression.

## Criteria Audit

- Task 12 scope: add/detail/edit/delete CRUD implemented with explicit save entry points; no auto-save API calls found on field `onChange`.
- Task 11 regression: reviewed `.omo/evidence/wave-2-core-ui-review-after-modal.md`; gallery-search PASS evidence exists after modal changes.
- Task 13 boundary: no clipboard/copy body implementation and no favorite toggle mutation found. Existing favorite display is read-only.
- Delete confirmation: cancel and confirm paths exist and are covered by modal CRUD evidence.
- Body-only fallback title: API fallback is exercised by QA and reflected after refresh.
- All/current tab defaults: All/favorite/workflow default to no type; prompt/image/repo tabs default to their item type. This is reasonable for add flow.
- Image field: only `imageKey` metadata text is present; no file input, upload, or R2 integration found.
- QA evidence: RED and GREEN modal CRUD artifacts include command, output path, exit code, dev logs, and screenshots. Evidence is auditable, but it misses the explicit-save negative case and the accessibility/type-edit edge cases above.

## Verification

- `pnpm typecheck`: PASS.
- `pnpm lint`: PASS.
- `pnpm test`: PASS, 26 tests.
- `git diff --check`: no whitespace errors; line-ending warnings only.
- Browser QA was not rerun during this read-only review because it writes evidence files and mutates fixture data. Existing evidence and screenshots were inspected instead.

## Blockers

- Prevent or correctly implement item type changes in edit mode.
- Make the modal a real focus-managed modal with an accessible close/cancel flow.
