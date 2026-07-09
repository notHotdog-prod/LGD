---
name: sentry-monitoring
description: Sentry error monitoring setup and reference for LGD (frontend DSN, worker reporter, test commands, dashboard link). Use when debugging errors, checking Sentry, or working with error tracking/monitoring code.
---

## Error Monitoring (Sentry)
Two layers:

**Frontend (browser JS):** Sentry Loader Script in `<head>` of every page. Errors real visitors hit are captured automatically.
- Project: `letsgrowdigital-frontend-1`
- Public DSN: `https://f3eece8ec557e6d8bf348c28d8bc5a24@o4511377116168192.ingest.us.sentry.io/4511377133076480` (safe client-side)
- Test event: open Dev Tools console on any LGD page → run `myUndefinedFunction();`

**Worker (kb-leads-proxy):** Direct-fetch Sentry reporter inside `cloudflare-worker.js` — no `@sentry/cloudflare` SDK, no build step. Posts to envelope endpoint when caught errors hit (Monday network fail or Monday API rejection). Errors tagged with `site` (lgd/lgc/lgp/imb123) for cross-brand filtering.
- Project: `kb-leads-proxy-worker`
- Requires `SENTRY_DSN` secret in CF dashboard (Settings → Variables and Secrets). If unset, Worker still runs; errors just aren't reported.

Dashboard: https://bbgb-llc.sentry.io/
