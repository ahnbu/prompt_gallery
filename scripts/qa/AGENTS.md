# QA SCRIPTS KNOWLEDGE BASE

## OVERVIEW

Node/Playwright verification scripts for API smoke, browser scenarios, fixture creation,
deployment checks, scope checks, and cleanup checks.

## WHERE TO LOOK

| Task | Location | Notes |
| --- | --- | --- |
| API smoke | `api-smoke*.mjs` | Exercises Worker API surface. |
| Browser smoke | `browser-smoke*.mjs` | General Playwright flow. |
| Gallery behavior | `browser-gallery-*.mjs` | Search, tabs, tag filtering, section/card assertions. |
| Modal CRUD | `browser-modal-*.mjs` | Add/edit/detail modal behavior and fixtures. |
| Copy/favorite | `browser-copy-favorite*.mjs` | Clipboard, card favorite, modal favorite scenarios. |
| Image preview | `browser-image-preview*.mjs` | Thumbnail/proxy behavior and preview fixtures. |
| Workflow/repo | `browser-workflow-repo.mjs` | Workflow detail and repo-related scenario. |
| Deployment | `deploy-check.mjs` | Wrangler auth, D1/R2 identity, and build output checks. |
| Scope gates | `verify-*.mjs` | Plan/scope/cleanup verification. |

## CONVENTIONS

- Scripts are `.mjs`; do not introduce `.sh` wrappers.
- Keep scenario assertions user-facing and specific; failure messages should name the broken behavior.
- Reuse support files such as `browser-smoke-support.mjs` and fixture helpers instead of duplicating setup.
- Browser QA assumes the app surface, not source-only inspection.
- Deployment verification is a check script, not the deploy command.

## ANTI-PATTERNS

- Do not make Playwright rely on public R2 URLs; image preview assertions should use Worker proxy paths.
- Do not weaken assertions to hide UI regressions.
- Do not create shared-state scripts that leave fixtures ambiguous for later runs.
- Do not add interactive prompts to QA scripts; they must run unattended.

## COMMANDS

```bash
pnpm qa:api
pnpm qa:browser
pnpm qa:browser -- --scenario full-regression
pnpm qa:browser -- --scenario gallery-search
pnpm qa:browser -- --scenario modal-crud
pnpm qa:browser -- --scenario copy-favorite
pnpm qa:browser -- --scenario image-preview
pnpm qa:browser -- --scenario workflow-repo
pnpm qa:browser -- --scenario tag-management
pnpm qa:fixtures
pnpm deploy:check
```
