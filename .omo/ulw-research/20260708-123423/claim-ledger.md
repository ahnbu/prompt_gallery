# Claim Ledger

| Claim | Risk | Domains | Counter-search | Primary? | Status |
|---|---|---|---|---|---|
| Cloudflare Pages static asset requests are free/unlimited when Functions are not invoked. | high | cloudflare.com | Checked Pages limits and pricing docs. | yes | verified |
| Cloudflare D1 Free includes 5M rows read/day, 100K rows written/day, 5 GB account storage, and 500 MB max per database; 10 GB max per database is Workers Paid. | high | cloudflare.com | Checked D1 pricing and limits docs. | yes | verified |
| Cloudflare R2 has no egress bandwidth charge and includes 10 GB-month storage, 1M Class A, 10M Class B free tier. | high | cloudflare.com | Checked R2 docs and product pricing page. | yes | verified |
| Cloudflare Images adds separate transformed/stored/delivered image pricing and is overkill for early personal previews. | high | cloudflare.com | Checked Images pricing and R2 example. | yes | verified |
| Google Drive thumbnailLink is short-lived and not intended for direct webapp use because of CORS; Drive is better as backup than preview CDN. | high | google.com | Checked Drive API files resource and search for Drive image hosting. | yes | verified |
| GitHub repo storage is portable but weak as primary image preview/CDN due to Pages/repo/file limits and raw unauthenticated rate limits. | high | github.com | Checked GitHub Pages limits, large files docs, Contents API, raw rate-limit changelog. | yes | verified |
| Firebase backup/export has more operational friction because Firestore export/import requires billing and Cloud Storage. | high | firebase.google.com, cloud.google.com | Checked Firestore export/import and pricing. | yes | verified |
