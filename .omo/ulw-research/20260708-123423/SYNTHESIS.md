# ULW-Research Synthesis: Prompt Gallery Storage/Deployment

## Executive Summary
- Recommended first architecture: Cloudflare Pages + D1 + R2, with static Pages for UI, Pages Functions for authenticated CRUD APIs, D1 for metadata, and R2 for image previews.
- Do not use Cloudflare Images initially; it adds image-pipeline pricing and complexity that is unnecessary for compressed personal previews.
- Do not use Google Drive as the preview source. It can be backup/archive storage, but Drive API thumbnail links are short-lived and not meant for direct webapp image rendering.

## Source Themes
- Cloudflare is the best deployment fit because Pages, D1, and R2 are first-party integrated through Pages Functions bindings.
- GitHub repo storage is strong for backup/source history, not as a live CRUD data store.
- Supabase is the best non-Cloudflare BaaS fallback if Cloudflare D1/R2 implementation becomes too slow.
- Local app is valid only if local file CRUD outweighs mobile/other-PC access.
