# Prompt Gallery Storage/Deployment Research Notepad

## Bootstrap
- Tier: HEAVY
- Justification: storage/deployment decision spans external services, future portability, image preview handling, and non-developer operations.
- Skills:
  - omo:ulw-research: explicit user invocation for exhaustive research and cited synthesis.
  - agent-reach: user requested web research; official docs and web sources must be checked.
  - compare-table: final output requires comparison table.

## Core Question
What storage/deployment architecture should a personal Prompt Gallery use for prompts, image prompts, workflows, GitHub repos, tags, auto-classification keywords, favorites, and image previews?

## Axes
- Local/static data model: static app plus local JSON/images and browser security limits.
- GitHub-backed data: static app plus JSON/images in a repository, edit workflow, raw asset reliability.
- Cloudflare: Pages, D1, R2, Images pricing and constraints.
- BaaS: Supabase/Firebase fit for personal CRUD and image storage.
- Local desktop app: Electron/Tauri security bypass, operations, portability.
- Image preview: R2/static assets/GitHub/Google Drive stability.

## Success Criteria
- All seven requested options are compared against all required criteria.
- Cloudflare Pages, D1, R2, and Images claims use official docs.
- Google Drive image preview stability is assessed separately from backup use.
- Final recommendation explains why excluded options are excluded.
- Final answer follows the requested seven-section structure.

## Manual QA / Evidence
- Research deliverable surface: final Korean synthesis with source links.
- Evidence: web source list, claim ledger, and this notepad.
