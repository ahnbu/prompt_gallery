---
slug: prompt-gallery-auto-manual-tags
status: drafting
intent: clear
pending-action: write .omo/plans/prompt-gallery-auto-manual-tags.md
approach: Add explicit manual/auto tag semantics through a D1 migration, repository recalculation logic, API response shape updates, tag-management create/bulk-apply UX, item edit source visibility, and browser/API QA.
---

# Draft: prompt-gallery-auto-manual-tags

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
| C1 | D1 can distinguish manual and automatic item-tag assignments | active | migrations/0001_initial.sql:30 |
| C2 | Worker tag repository can recompute automatic assignments in bulk when keywords change | active | src/worker/tag-repository.ts:161 |
| C3 | Item create/update preserves manual tags while automatic tags are rule-derived | active | src/worker/item-repository.ts:111 |
| C4 | UI lets the user create tags, edit auto keywords, and see manual/auto source clearly | active | src/client/TagManagementModal.tsx:173 |
| C5 | QA proves empty-DB first tag creation, bulk auto apply/remove, manual preservation, and regression safety | active | scripts/qa/browser-tag-management.mjs:132 |

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
| Existing item_tags migration source | Backfill existing links as `manual` | Existing schema has no source metadata, so this is the least destructive interpretation and preserves user-visible tags | yes, with a one-off data correction |
| Automatic tag meaning | Automatic assignment only; no automatic tag catalog creation | User clarified automatic tags are rule-based bulk assignment, not creating new tag names from free text | yes |
| Auto keyword update behavior | Recompute that tag's `auto` links across all items after keyword changes | User clarified adding/removing auto rules causes bulk assignment/removal | yes |
| Manual vs auto conflict | Manual wins and is never removed by auto recomputation | Prevents rules from deleting deliberate user choices | yes |
| Item-level auto dismissal | Do not implement dismissed/suppressed auto tags | User clarified deletion is bulk rule deletion, not per-item exception | yes |

## Findings (cited - path:lines)
- SPEC requires user-added and app-added tags together, plus tag management for rename/delete/merge/automatic criteria: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:30`.
- SPEC says automatic tags do not need a pre-save confirmation step and should be fixable afterward in list/detail: `_docs/specs/20260708_01_prompt-gallery_요구사항_SPEC.md:76`.
- Research architecture already separates tag catalog and item-tag relationship tables: `_docs/20260708_02_prompt-gallery_저장-배포-리서치.md:58`.
- Current initial schema has `item_tags(item_id, tag_id, created_at)` with no assignment source, so manual/auto source cannot be represented today: `migrations/0001_initial.sql:30`.
- Current `TagRepository.addAutomaticTags()` scans `tag_keywords` and inserts `item_tags`, but it has no source metadata and no bulk remove/recompute behavior: `src/worker/tag-repository.ts:161`.
- Current `setItemTagsByNames()` deletes all item_tags for an item and recreates them by name, so it cannot preserve auto tags separately from manual tags: `src/worker/tag-repository.ts:142`.
- Current tag management UI edits existing tags and keywords but empty production DB shows only "관리할 태그가 없습니다"; first tag creation UI is missing: `src/client/TagManagementModal.tsx:173`.
- Existing browser tag-management QA seeds tags through API before opening the UI, so it does not cover empty-DB first tag creation: `scripts/qa/browser-tag-management.mjs:132`.

## Decisions (with rationale)
- Add a second D1 migration that changes `item_tags` semantics to source-aware links. Preferred shape: `source TEXT NOT NULL CHECK (source IN ('manual','auto'))` included in the primary key or represented with a compatible uniqueness strategy so one item/tag can carry both sources when needed. The plan must decide exact SQL after checking D1 migration limitations, but the behavioral contract is fixed.
- Treat tag catalog creation as explicit UI/API action only. Automatic tags are automatic assignment from existing tag keyword rules.
- On tag keyword create/update/delete, recalculate only that tag's `auto` assignments across all items: remove existing `source='auto'` rows for the tag, match all current items against the new keyword set, then insert new `source='auto'` rows.
- Preserve `source='manual'` rows during all auto recalculation. If the same item/tag is both manual and auto, UI may display one chip but edit/export/API must preserve source semantics.
- Item edit should update manual tags only. It must not delete automatic tags unless the tag's automatic keyword rule no longer matches during recomputation.
- Tag delete and merge must handle both sources. Delete removes all links by cascade. Merge moves manual and auto links while preserving source semantics and then recomputes target auto links if keywords change.

## Scope IN
- D1 migration for source-aware `item_tags` and any required indexes/backfill.
- Worker type/API/repository updates for manual vs automatic tag source.
- Bulk automatic tag recomputation when tag keywords change.
- Tag management UI for first tag creation and keyword edit with bulk apply/remove semantics.
- Item modal UI/API adjustments so manual tags are edited explicitly and automatic tags are visible without becoming accidental manual tags.
- Export/backup response shape updates if tag source is included in exported item/tag data.
- API and browser QA proving empty-DB first tag creation, auto bulk apply, auto bulk remove, manual preservation, merge/delete behavior, and existing tag filter regression.

## Scope OUT (Must NOT have)
- Do not implement automatic tag catalog creation from arbitrary item input text.
- Do not implement per-item automatic tag dismissal/suppression.
- Do not add app-level auth, sharing, collaboration, or public gallery changes.
- Do not change unrelated image preview, workflow, repo, or export behavior except where tag source data requires compatibility.
- Do not seed production data as a substitute for first-tag creation UI.

## Open questions
None blocking. The user clarified automatic tags mean automatic assignment, and automatic keyword changes are bulk apply/remove.

## Approval gate
status: awaiting-approval
pending-action: write .omo/plans/prompt-gallery-auto-manual-tags.md
approach: Write the plan with waves for schema migration, repository/API semantics, UI changes, QA updates, and final verification. No product code will be changed by the planner.
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
