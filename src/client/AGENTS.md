# CLIENT KNOWLEDGE BASE

## OVERVIEW

React workspace UI for browsing, filtering, editing, copying, and previewing gallery items.

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| App state and data refresh | `App.tsx` | Owns gallery fetch, modal state, tabs, tags, favorite refresh. |
| React bootstrap | `main.tsx` | Checks `#root` and renders `<App />`. |
| Gallery card rendering | `GalleryCard.tsx` | Card-level copy/favorite/open behavior. |
| Sectioned vs unified lists | `GalleryList.tsx` | Search/filter switches to unified results. |
| Item modal | `ItemModal*.tsx`, `item-modal-model.ts` | Prompt/image/repo create/edit/detail model. |
| Workflow modal | `WorkflowModal*.tsx`, `workflow-modal-model.ts` | Workflow fields and step editing. |
| Tag management | `TagManagement*.tsx`, `tag-management-model.ts` | Rename, merge, keyword/color management. |
| API parsing | `gallery-data.ts` | Runtime validation of Worker JSON payloads. |
| Styling | `styles.css`, `styles/*.css` | Tokenized CSS split by base/layout/cards/modal/actions. |
| Export | `export-data.ts` | Calls `/api/export` and downloads the result. |

## CONVENTIONS

- UI files use PascalCase for components and lower-kebab-ish model/mutation filenames.
- Keep business decisions in `*-model.ts`; keep network writes in `*-mutations.ts`.
- Preserve readonly data shapes and explicit parser checks in `gallery-data.ts`.
- Use Lucide icons for actions. Icon-only controls need accessible labels/titles.
- Korean labels are normal UI copy; ensure they fit on mobile.
- Section add buttons must set the matching default type.

## DESIGN RULES

- `DESIGN.md` controls visual direction: warm paper canvas, white cards, restrained blue action.
- First viewport stays the working app surface: search, filters, tabs, sections, cards.
- No hero sections, pricing-style cards, decorative landing bands, or marketing composition.
- Max content width is `1180px`; prompt, Workflow, and Repo cards use a square
  card grid capped at 4 columns on desktop wide viewports.
- Image prompt cards use natural-ratio masonry. Do not force compact gallery
  thumbnails to `aspect-ratio: 1 / 1`; long images should produce taller cards.
- Keep cards scan-friendly and avoid nested card shells.
- Raw colors should not be introduced outside the design tokens.

## ANTI-PATTERNS

- Do not add fake example cards that cannot be edited or deleted through the normal flow.
- Do not replace tab text with icon-only controls unless tooltip/accessibility support exists.
- Do not add decorative motion; motion must communicate interaction or state.
- Do not move saved-item semantics into DOM-only UI state.
