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
1. Edit the relevant live page(s) locally (`index.html`, `ai.html`, etc.)
2. Commit and push to GitHub
3. Deploy manually via Hostinger hPanel
4. Cloudflare Worker handles lead/newsletter submissions independently

## Coding Conventions
- Single-file architecture is intentional — do not split into separate CSS/JS files
- Mobile-responsive by default
- No npm, no node_modules, no build step
- Sparse comments — only where non-obvious

## What Claude Should NOT Do
- Do not suggest multi-file architecture
- Do not add npm dependencies or build tools
- Do not expose any API token (Monday.com, Worker, etc.) in client-side code
- Do not redesign the color scheme without explicit instruction
- Do not use placeholder copy — ask if real copy is needed
- Do not edit `lgd_website_v2.html` (stale draft)
