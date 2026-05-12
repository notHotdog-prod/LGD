# LGD — Open Items

Pending work that needs an external dependency before it can ship. Maintained here so it doesn't get lost between Claude sessions.

## 1. Trillet web widget integration
**Status:** Blocked on Trillet
**Owner:** Bryan to ping Ori at Trillet
**Context:** Trillet's portal (app.trillet.ai) does not appear to expose a self-serve JavaScript/iframe widget. The "Share Demo" button creates a hosted demo page on trillet.ai but not an embed. The closest equivalent on-site today is the custom `dm-widget-*` floating launcher on `deskmonkey.html`, which is visual-only.

**What to ask Ori:**
> Do you have a JavaScript/iframe widget or SDK for embedding the Lets Grow Digital agent on letsgrowdigital.ai/deskmonkey.html? I want to replace the floating Try-Live button with the real Trillet voice/text widget.

**When the snippet arrives:** drop it into `deskmonkey.html` just before `</body>`, after the Cal.com snippet. Optionally also add to `index.html` and `ai.html` for site-wide presence.

## 2. OG / Twitter social cards
**Status:** Blocked on design (Canva)
**Owner:** Bryan to produce two 1200×630 PNGs from spec
**Context:** OG image meta tags currently point at `deskmonkey-logo-T.png` as a stopgap. Proper branded cards needed.

**Spec (full version is in Claude chat history of 2026-05-11):**
- `lgd-og.png` — LGD brand card for `index/agency/about/privacy/terms`
- `deskmonkey-og.png` — deskMonkey product card for `deskmonkey.html` and `ai.html`
- Both 1200×630, gradient #6B35D9 → #D435A0, DM Serif Display headlines, DM Sans body, 60px safe area

**When PNGs arrive:** drop both at the repo root, then update `og:image` and `twitter:image` meta tags across the 7 main pages and validate with the [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) and [Twitter Card Validator](https://cards-dev.twitter.com/validator).

## 3. Embellishment audit — stats and testimonials
**Status:** Awaiting Bryan's confirmation after he checks with Kirk
**Owner:** Bryan + Kirk
**Context:** Pages still carry marketing copy that may not match reality:
- Hero / metrics: "500+ Businesses Grown", "94% Client Retention Rate", "3.8× Avg ROAS Delivered", "24h Avg. Response Time"
- Testimonials: "Marcus R., CEO, Legal Services Firm" and "Sophia A., Founder, eCommerce Brand"

These appear on `index.html`, `agency.html`, and `ai.html`. Bryan flagged the discomfort but is checking with Kirk (more client-facing) before deciding what to keep, tighten, or anonymize.

## 4. Sentry error monitoring (installed — verify after deploy)
**Status:** Wired in, awaiting verification
**Project:** JavaScript project on Sentry, region `us.sentry.io`
**DSN:** `https://f3eece8ec557e6d8bf348c28d8bc5a24@o4511377116168192.ingest.us.sentry.io/4511377133076480` (public by design — embedded in all 8 page `<head>`s via the Loader Script)

**To verify after this commit lands and Hostinger pulls:**
1. Open https://letsgrowdigital.ai/ in any browser
2. F12 → Console tab
3. Run: `myUndefinedFunction();`
4. Within ~30 seconds, the test error should appear in your Sentry dashboard

**Then:** real visitor errors flow in automatically. Future sessions can ask Sentry MCP "any new errors in the last X hours?" once the Sentry MCP is connected.

**Trial note:** Sentry is on a 14-day paid-tier trial that auto-downgrades to the free Developer tier when it ends. Don't click "Upgrade Now" unless you actually want to pay.

## 5. Sentry adblock tunneling (low priority but high payoff)
**Status:** Not started
**Why it matters:** Most users with any adblocker (uBlock Origin, Privacy Badger, Brave Shields) block `*.sentry.io` and `*.sentry-cdn.com` by default. That's an estimated 20-40% of real visitors. Their errors silently never reach the Sentry dashboard.

**Fix:** Set up a same-domain subdomain that proxies to Sentry. e.g. `monitor.letsgrowdigital.ai` → Cloudflare Worker → Sentry ingest endpoint. Adblockers can't reasonably block a first-party subdomain. Sentry has docs for this under "Tunneling".

**Effort:** ~20 min per site (one Worker per site, or one shared Worker with site-specific routes). Bryan to ask when ready; not blocking anything today.

## 6. Multi-site Sentry rollout (in progress)
**Status:** LGD frontend done; awaiting local repo paths for the others

**DSNs collected (from Bryan, 2026-05-12):**
- `letsgrowdigital-frontend` → `https://f3eece8ec557e6d8bf348c28d8bc5a24@o4511377116168192.ingest.us.sentry.io/4511377133076480` ✅ wired
- `letsgrowclients-frontend` → `https://bac64c1ce2382e76faaf57bfb19ab0a6@o4511377116168192.ingest.us.sentry.io/4511377214996480`
- `letsgrowpatients-frontend` → `https://81dce303019608110d281584a35b324b@o4511377116168192.ingest.us.sentry.io/4511377223319552`
- `insurance-frontend` (daven-insurance) → `https://39ea15b9cd2850965201332fb5f054d5@o4511377116168192.ingest.us.sentry.io/4511377282826240`
- `turfboss-frontend` → `https://c6143fffbc6425880c86056e2abe3269@o4511377116168192.ingest.us.sentry.io/4511377233018880`
- `turfboss-worker` → `https://b2b61569f6de8cb17e2108e5d4420e21@o4511377116168192.ingest.us.sentry.io/4511377236688896`

**To complete:** Bryan provides local repo paths for LGC, LGP, Daven, Turfboss, plus confirms whether each site uses its own Cloudflare Worker or shares one. Future Claude session inserts the Loader Script tag into each site's HTML `<head>` and wraps Worker handlers with `Sentry.withSentry`.

**Per-project alert:** each of the 6 projects above needs a "Send notification to bryan.boutin@gmail.com" alert rule (Sentry → Alerts → Create rule → "Issue Alert" template → email action). One per project; Sentry does not propagate alerts cross-project.

## 7. LGC/LGP/Daven UI parity with LGD
**Status:** Not started — parity prompt drafted in chat history of 2026-05-12

**Context:** LGC, LGP, and Daven are stylistically/functionally behind LGD: no top phone banner, no light/dark toggle, no deskMonkey nav link, form payloads don't match the LGD shape, no .htaccess cache headers, no SMS-consent TCPA language on forms collecting phones. Sentry is wired in but they're missing the polish layer.

**Approach:** Use the "parity prompt" drafted in chat to brief a focused session. Apply each item to all three sites in one pass. Push site-by-site so rollback is granular.

## 8. Monday board: add Phone + Lead Source columns
**Status:** Blocked on Bryan
**Why:** kb-leads-proxy now receives phone and lead-source data from LGC/LGP/Daven but drops them on the floor because Monday doesn't have columns to receive them.

**To unblock:**
1. In Monday, add two columns to the board: "Phone" (Phone or Text type) and "Lead Source" (Status with options: "Lets Grow Digital", "Lets Grow Clients", "Lets Grow Patients", "Daven Insurance")
2. Hit https://kb-leads-proxy.bryan-boutin.workers.dev/columns in a browser; it returns column IDs as JSON
3. Paste JSON to Claude; Claude updates the worker's columnValues block and you redeploy

## 9. Shared CSS+JS for chrome (multi-site propagation)
**Status:** Not started — strategic improvement
**Context:** Bryan asked for a way to push updates to multiple sites simultaneously. Vanilla HTML doesn't support partials without a build tool. Pragmatic path: host shared CSS and JS at a single URL (Cloudflare R2 or a separate GitHub repo served via jsDelivr), have all sites reference it.

**What goes in shared CSS:** typography tokens, color variables, button styles, top-banner styles, theme-toggle styles.

**What goes in shared JS:** Sentry init wrapper, theme toggle logic, top banner injection, localStorage handling.

**What stays per-site:** content HTML, page-specific styles, forms (since fields differ).

**Setup:** ~2 hr focused session. Version-pin URL (`v1.css`, `v2.css`) to avoid breaking changes. Eliminates the need to propagate chrome edits across repos by hand.
