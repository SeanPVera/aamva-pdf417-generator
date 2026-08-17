---
"aamva-pdf417-generator": patch
---

Drop `upgrade-insecure-requests` from the Content-Security-Policy, which made the app render a blank page in Safari on any plain-HTTP origin.

The directive rewrites `http://` subresource requests to `https://`. The spec exempts potentially-trustworthy origins, and Chromium and Firefox honour that for `http://localhost` — WebKit does not. Served over HTTP it therefore asks for `https://<host>/assets/index-*.js`, the server has no TLS to answer with, every asset fails, and React never mounts.

That is not only a test problem. `npm run dev:mobile` exists to bind `0.0.0.0` so a phone on the LAN can load the app over `http://<laptop-ip>:3000`, and `docs/IPHONE.md` is about running it on an iPhone. On iOS Safari — the only engine iOS has — that combination has been a blank screen.

It also protected nothing here. Every subresource is same-origin and relative, and the app makes no network requests at all by design, so on an `https://` origin they are already `https://`. There is no request for the directive to upgrade.

This is what has been hanging the `Playwright (webkit)` and `Playwright (mobile-safari)` CI jobs: with the app failing to mount, all 27 tests wait out their 30-second timeout, and with `retries: 2` and one worker the suite cannot finish inside the 20-minute job budget, so both jobs were killed by the timeout rather than reporting. Every E2E run on `main` had ended `cancelled` since 11 August.
