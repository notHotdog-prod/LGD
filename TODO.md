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
