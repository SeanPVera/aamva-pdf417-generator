# Running on iPhone without a Mac (or any computer)

The app is 100% client-side — no server, no backend, no API. That means it can
be served as plain static files from a free host, and an iPhone can install it
to the Home Screen and run it offline afterwards.

**Nothing in this guide requires a Mac, Xcode, a paid Apple Developer account,
or a computer on the same Wi-Fi network.** The build runs on GitHub's Linux
runners; your iPhone only ever opens a URL.

---

## Table of contents

- [Recommended: GitHub Pages + Add to Home Screen](#recommended-github-pages--add-to-home-screen)
- [Verifying it works offline](#verifying-it-works-offline)
- [Shipping updates to an installed phone](#shipping-updates-to-an-installed-phone)
- [What "installed" actually gets you](#what-installed-actually-gets-you)
- [Other zero-Mac hosting options](#other-zero-mac-hosting-options)
- [Camera scanning on iOS](#camera-scanning-on-ios)
- [Troubleshooting](#troubleshooting)
- [Why not a real `.ipa` / App Store build?](#why-not-a-real-ipa--app-store-build)

---

## Recommended: GitHub Pages + Add to Home Screen

### One-time setup (about two minutes, doable from the phone)

The repository ships `.github/workflows/pages.yml`, which builds `dist/` and
publishes it to GitHub Pages on every push to `main`. It only needs Pages
switched on once:

1. Open the repository on github.com — Safari on the iPhone is fine.
2. Go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Go to the **Actions** tab, pick **Deploy PWA to GitHub Pages**, and press
   **Run workflow** (or just push any commit to `main`).

When the run finishes, the deploy step prints the live URL. For this repo it is:

```
https://seanpvera.github.io/aamva-pdf417-generator/
```

> The site is public, the same as the repository. Nothing sensitive is
> published — the build output is only the app itself. The app never
> transmits form data anywhere, and PII fields are never written to disk.

### Install it on the iPhone

1. Open the Pages URL in **Safari**. Not Chrome, not Firefox — on iOS only
   Safari can add a real Home Screen web app, and its WebKit camera support is
   the most reliable.
2. Tap the **Share** button (the square with an arrow).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.

You now have an app icon that launches full-screen with no Safari chrome, no
address bar, and its own app switcher card.

The in-app **Install App** button in the header shows these same steps when it
detects iOS.

---

## Verifying it works offline

The service worker (`public/sw.js`) precaches the app shell and every emitted
JS/CSS chunk, including lazy ones, so a cold launch with no connection has
everything it needs.

To prove it:

1. Launch the Home Screen app once while online and let it fully load.
2. Put the phone in **Airplane Mode**.
3. Force-quit the app (swipe up from the app switcher) and relaunch it.

It should start normally and generate barcodes. Generation, validation,
decoding, and PNG/SVG/PDF export are all local computation — none of it needs
the network.

---

## Shipping updates to an installed phone

Push to `main`. The Pages workflow rebuilds and redeploys, and the next time
the Home Screen app is launched **with a connection** it picks up the new
build.

This works because the service worker serves navigations network-first: an
installed iOS web app has no reload button and no way to bypass its cache, so
a cache-first shell would pin the phone to an old build indefinitely. The
cached shell is still the offline fallback.

If a phone is ever stuck on a stale build, delete the Home Screen icon, then
reinstall from Safari.

---

## What "installed" actually gets you

| | Safari tab | Home Screen app |
| --- | --- | --- |
| Full-screen, no browser chrome | ✗ | ✓ |
| Own icon and app-switcher card | ✗ | ✓ |
| Works with no connection | ✓ after first visit | ✓ |
| Camera scanning | ✓ | ✓ (iOS 14.3+) |
| Survives Safari tab cleanup | ✗ | ✓ |

Storage note: iOS may evict a web app's caches after roughly **seven days of
no use**. If that happens the next *online* launch simply re-downloads the
shell. It does not lose form data, because form fields are never persisted in
the first place — only UI preferences are.

---

## Other zero-Mac hosting options

Any static host works; the build is just a folder of files. `vite.config.mts`
sets `base: './'`, so all asset paths are relative and the app runs from a
subdirectory or a domain root without reconfiguration.

| Host | How | Notes |
| --- | --- | --- |
| **GitHub Pages** | The included workflow | Free, no account beyond GitHub, HTTPS by default |
| **Cloudflare Pages** | Connect the repo, build `npm run build`, output `dist` | Free tier, custom domains |
| **Netlify** | Connect the repo, or drag `dist/` onto app.netlify.com | Drag-and-drop needs no CLI |
| **Vercel** | Import the repo, framework preset "Vite" | Free hobby tier |

HTTPS is not optional. iOS requires a secure context for both service workers
and `getUserMedia`, so a plain-HTTP host gets you neither offline support nor
the camera scanner. All four options above are HTTPS by default.

---

## Camera scanning on iOS

- The scanner needs HTTPS. On the Pages URL it works; over a local
  `http://192.168.x.x` dev server it does not.
- If Safari never asks for permission: **Settings → Safari → Camera → Allow**.
- Camera access from a Home Screen web app requires **iOS 14.3 or later**.
  Earlier versions silently fail in standalone mode but work in a Safari tab.
- If the live camera still won't start, the in-app **photo upload** scan path
  is a fallback and uses the same decoder.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Pages URL 404s | The workflow has not deployed yet, or Settings → Pages → Source is not set to **GitHub Actions**. Check the Actions tab. |
| Home Screen icon is a blurry screenshot | An old install from before PNG icons were added. Delete the icon and re-add it. |
| "Add to Home Screen" is missing from the Share sheet | You are not in Safari, or you are in a Private tab. Use a normal Safari tab. |
| Header hidden behind the Dynamic Island | An old cached build. Relaunch while online so the service worker picks up the current shell. |
| App opens to a blank screen offline | The first visit never completed. Reconnect, launch once, wait for it to fully render, then retry offline. |
| Stuck on an old version | Delete the Home Screen icon and reinstall from Safari. |

---

## Why not a real `.ipa` / App Store build?

Worth stating plainly, because "no Mac" and "native iOS app" pull in different
directions:

- **Compiling** an iOS app without owning a Mac is solvable — a hosted macOS
  CI runner (including GitHub Actions' `macos-latest`) can run Xcode for you.
- **Installing** one on a physical iPhone is the real constraint. Every `.ipa`
  must be code-signed against an Apple-issued certificate and a provisioning
  profile tied to an Apple Developer account. A free account signs apps that
  expire after 7 days and needs a computer to re-sign; TestFlight and the App
  Store need the $99/year paid account.
- That path also means adopting a native wrapper (Capacitor or similar), which
  adds a build toolchain, an App Store review surface, and a signing-secret
  pipeline — to ship the same client-side code this PWA already runs.

For an offline, fully client-side tool, the installed PWA reaches the same
place: an icon on the Home Screen, full-screen, working without a connection,
with zero Apple account involvement. The one thing it gives up is App Store
distribution.
