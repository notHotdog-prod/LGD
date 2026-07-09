---
name: deploy
description: Deployment steps for the LGD site — push to main, Hostinger auto-pull, cache-busting refresh. Use when pushing changes live, deploying, or verifying a push went live.
---

## Deployment Workflow
1. Edit the relevant live page(s) locally (`index.html`, `deskmonkey.html`, etc.)
2. Commit and push to `main` on GitHub
3. **Hostinger auto-pulls from Git** — site updates within a minute or two of push. No manual hPanel upload.
4. Hard-refresh (Ctrl+Shift+R) to bust browser cache and confirm
5. Cloudflare Worker handles lead/newsletter submissions independently of deploy
