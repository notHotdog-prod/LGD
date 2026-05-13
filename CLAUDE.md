# CLAUDE.md — Lets Grow Digital (LGD)

## Project Overview
Marketing website for Lets Grow Digital, an AI-powered digital marketing agency for small businesses.
- **Live URL:** letsgrowdigital.ai
- **GitHub repo:** bb313x/LGD
- **Owner:** Bryan Boutins
- **Business partner:** Kirk (sales, marketing, biz dev) — "Keep It Simple" principle applies to all copy and UX

## Tech Stack
- Single-file HTML/CSS/JS — no frameworks, no build tools
- **Live pages:** `index.html` (homepage), `ai.html`, `agency.html`, `about.html`, `privacy.html`, `terms.html`, `audit/index.html`
- **Stale draft (do NOT edit):** `lgd_website_v2.html` — v2 mockup left in repo for reference only
- **Deployment:** GitHub → Hostinger manual deploy via hPanel
- **API proxy:** Cloudflare Worker `kb-leads-proxy.bryan-boutin.workers.dev` for lead capture (POST /lead, POST /newsletter)
- **CRM:** Monday.com (workspace: bryanboutins-team)
- **Booking:** Cal.com floating button on index/ai/agency/about (`letsgrowletsgo` slug)
- **Primary phone (display + tel):** 732-466-1234

## Design System
- Purple (#6B35D9) → magenta (#D435A0) gradient
- **Default theme: light** (user can toggle to dark via pill switch; preference stored in `localStorage` key `lgd-theme`)
- Bold typography: DM Sans (body) + DM Serif Display (headlines)
- CSS variables for all colors and design tokens; `body.light-mode` overrides the dark palette
- Partner badges included in layout
- **Top banner:** fixed `📞 Call or Text: 732-466-1234` strip above every page's nav (z-index 1001)

## Lead Capture
- Sign Up form on `index.html` and `agency.html` POSTs JSON to the Cloudflare Worker `kb-leads-proxy` (`/lead`)
- Newsletter form in footer POSTs to `/newsletter`
- **API token is NEVER in client-side code** — always in Worker environment

## Deployment Workflow
1. Edit the relevant live page(s) locally (`index.html`, `deskmonkey.html`, etc.)
2. Commit and push to `main` on GitHub
3. **Hostinger auto-pulls from Git** — site updates within a minute or two of push. No manual hPanel upload.
4. Hard-refresh (Ctrl+Shift+R) to bust browser cache and confirm
5. Cloudflare Worker handles lead/newsletter submissions independently of deploy

## Coding Conventions
- Single-file architecture is intentional — do not split into separate CSS/JS files
- Mobile-responsive by default
- No npm, no node_modules, no build step
- Sparse comments — only where non-obvious

## Open Work Items
See `TODO.md` in this repo for pending items that are blocked on external dependencies (Trillet widget snippet, OG social cards, stats/testimonial review). Check it at the start of each session and update as items unblock or new ones appear.

## Pre-Push Routine
Before pushing changes that touch any of: HTML form code, `cloudflare-worker.js`, anything user-facing JS, or anything handling input — run `/security-review` first. Catches XSS, exposed secrets, auth issues, injection. Skipping is fine for trivial copy edits, but err on the side of running it.

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

## Marketing Copy — No Concessions
Never add the following to any LGD page without explicit Bryan confirmation: "30-day guarantee", "money-back", "month-to-month", "no contracts", "cancel anytime", "free trial", "no setup required". The actual deal is setup fee + 12-month commitment; the worst-case retainer refund is internal-only, not marketed. "No commitment" is OK only when scoped to the inquiry/discovery (not the deal itself).

## What Claude Should NOT Do
- Do not suggest multi-file architecture
- Do not add npm dependencies or build tools
- Do not expose any API token (Monday.com, Worker, etc.) in client-side code
- Do not redesign the color scheme without explicit instruction
- Do not use placeholder copy — ask if real copy is needed
- Do not edit `lgd_website_v2.html` (stale draft)
