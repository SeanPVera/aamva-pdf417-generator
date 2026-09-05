/* eslint-disable no-undef -- the bodies of page.evaluate() run in the browser,
   not in node, so `document` and `window` are legitimately global there. */

/**
 * Measures the five UI properties the kiosk redesign was built to fix, so a
 * claim about any of them can be checked instead of argued about.
 *
 * Every before/after number in the redesign commits came out of this script.
 * It is deliberately NOT a test: it prints measurements and exits 0, because
 * the right threshold for "how much chrome is too much" is a judgement call.
 * The parts that ARE pass/fail — contrast floors, the 44px target floor — say
 * so in the output.
 *
 *   node scripts/ui-audit.mjs --url http://localhost:4173
 *   node scripts/ui-audit.mjs --url http://localhost:4173 --baseline http://localhost:3001
 *   node scripts/ui-audit.mjs --url http://localhost:4173 --shots /tmp/shots
 *
 * To compare against another revision, run it in a worktree on its own port:
 *
 *   git worktree add /tmp/baseline origin/main
 *   ln -s "$PWD/node_modules" /tmp/baseline/node_modules
 *   (cd /tmp/baseline && npx vite --port 3001 &)
 *   node scripts/ui-audit.mjs --url http://localhost:4173 --baseline http://localhost:3001
 *
 * If Playwright cannot find a browser, point it at one:
 *   PW_CHROMIUM_PATH=/path/to/chromium node scripts/ui-audit.mjs ...
 */

import { chromium } from "playwright";

const WCAG_TEXT_AA = 4.5; // normal-size text
const WCAG_NON_TEXT = 3.0; // UI component boundaries (1.4.11)
const TOUCH_FLOOR = 44; // px, the smallest a control may be
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1440, height: 950 };

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

// --- colour -----------------------------------------------------------------

/**
 * Parses both `rgb(1, 2, 3)` and `color(srgb 0.1 0.2 0.3)`. The second form is
 * what `color-mix()` computes to, and a parser that only grabs integers reads
 * "0.148392" as [0, 148392, ...] — which silently produced contrast ratios in
 * the millions rather than a failure anyone would notice.
 */
function parseColor(value) {
  const srgb = /color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(value || "");
  if (srgb) return [1, 2, 3].map((i) => Math.round(parseFloat(srgb[i]) * 255));
  const nums = (value || "").match(/[\d.]+/g);
  return nums ? nums.slice(0, 3).map(Number) : [0, 0, 0];
}

function luminance([r, g, b]) {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)];
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Math.round(ratio * 100) / 100;
}

// --- page setup -------------------------------------------------------------

/** The welcome tour opens over the page on first load and hides everything behind it. */
async function dismissTour(page) {
  for (const label of ["Skip tour", "Skip", "Got it", "Finish", "Close"]) {
    const button = page.getByRole("button", { name: label, exact: false }).first();
    if ((await button.count()) && (await button.isVisible().catch(() => false))) {
      await button.click().catch(() => {});
      break;
    }
  }
  await page.waitForTimeout(600);
}

async function open(browser, url, viewport, extra = {}) {
  const page = await browser.newPage({ viewport, ...extra });
  await page.goto(url, { waitUntil: "networkidle" });
  // The barcode canvas and the lazy preview chunk both land after networkidle.
  await page.waitForTimeout(2200);
  await dismissTour(page);
  return page;
}

// --- the measurements -------------------------------------------------------

/**
 * How much of a phone screen is chrome before the first field.
 *
 * Measured to the first input whose id is an AAMVA field code, NOT to the first
 * input in the panel — the filter search box is also an input, and measuring to
 * it flattered the number by about 200px.
 */
async function mobileChrome(page) {
  return page.evaluate(() => {
    const isFieldCode = (el) => /^[A-Z]{2}[A-Z0-9]$/.test(el.id);
    const field = [...document.querySelectorAll("input, select, textarea")].find(isFieldCode);
    const header = document.querySelector("header");
    return {
      firstFieldTopPx: field
        ? Math.round(field.getBoundingClientRect().top + window.scrollY)
        : null,
      headerHeightPx: header ? Math.round(header.getBoundingClientRect().height) : null
    };
  });
}

/**
 * Counts elements painting red text, and says where they are.
 *
 * A form nobody has touched should be almost entirely free of red: an unfilled
 * required field is work remaining, not a mistake. Red that survives here
 * should be a genuinely destructive control or a required marker.
 */
async function redCensus(page) {
  return page.evaluate(() => {
    const scope = ".dmv-main *, aside *, header *, .dmv-preview *";
    const isRed = (el) => {
      const m = getComputedStyle(el).color.match(/\d+/g);
      if (!m) return false;
      const [r, g, b] = m.map(Number);
      // Deliberately narrow: ambers and oranges must NOT match, or the census
      // counts the advisory styling it exists to distinguish red from.
      return r > 140 && r > g * 1.6 && r > b * 1.6;
    };
    const red = [...document.querySelectorAll(scope)].filter(isRed);
    const byContainer = {};
    for (const el of red) {
      const where = el.closest(".dmv-preview")
        ? "preview"
        : el.closest("header")
          ? "header"
          : el.closest("aside")
            ? "sidebar"
            : "form";
      byContainer[where] = (byContainer[where] || 0) + 1;
    }
    const texts = {};
    for (const el of red) {
      if (el.children.length || !(el.textContent || "").trim()) continue;
      const t = el.textContent.trim().slice(0, 40);
      texts[t] = (texts[t] || 0) + 1;
    }
    return {
      total: red.length,
      byContainer,
      texts: Object.entries(texts).sort((a, b) => b[1] - a[1])
    };
  });
}

/** Every visible control smaller than the touch floor, worst first. */
async function touchTargets(page) {
  const all = await page.evaluate((floor) => {
    const sel = "header button, .dmv-main button, aside button, .dmv-preview button, nav button";
    return [...document.querySelectorAll(sel)]
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          label: (el.textContent || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 28),
          h: Math.round(r.height),
          w: Math.round(r.width)
        };
      })
      .filter((x) => x.h > 0 && x.w > 0)
      .sort((a, b) => a.h - b.h)
      .map((x) => ({ ...x, under: x.h < floor }));
  }, TOUCH_FLOOR);
  return { total: all.length, under: all.filter((x) => x.under), smallest: all.slice(0, 3) };
}

/**
 * A form control's boundary has to clear 3:1 against BOTH the colour inside it
 * and the colour it sits on (WCAG 1.4.11). The jurisdiction theme paints the
 * fill with `!important` and every palette is a light tint, so this is the
 * check that catches a border which looks fine on white and vanishes on a
 * themed surface.
 */
async function controlContrast(browser, url, dark) {
  const page = await open(browser, url, DESKTOP, { colorScheme: dark ? "dark" : "light" });
  const raw = await page.evaluate(() => {
    const isFieldCode = (el) => /^[A-Z]{2}[A-Z0-9]$/.test(el.id);
    const field = [...document.querySelectorAll("input, select")].find(isFieldCode);
    const panel = field?.closest(".dmv-main");
    if (!field || !panel) return null;
    const cs = getComputedStyle(field);
    return {
      border: cs.borderTopColor,
      fill: cs.backgroundColor,
      text: cs.color,
      panel: getComputedStyle(panel).backgroundColor,
      heightPx: Math.round(field.getBoundingClientRect().height)
    };
  });
  await page.close();
  if (!raw) return null;
  const [border, fill, text, panel] = [raw.border, raw.fill, raw.text, raw.panel].map(parseColor);
  return {
    heightPx: raw.heightPx,
    borderVsFill: contrast(border, fill),
    borderVsPanel: contrast(border, panel),
    textVsFill: contrast(text, fill)
  };
}

/**
 * Header control legibility. This exists because the header used to be painted
 * with a gradient running from the jurisdiction's primary colour to its ACCENT
 * — a light hue — while printing white on top of the whole width. The controls
 * on the accent end measured 2.0:1.
 */
async function headerContrast(page) {
  const rows = await page.evaluate(() => {
    const out = [];
    for (const btn of document.querySelectorAll("header button")) {
      const label = (btn.textContent || "").trim();
      if (!label) continue;
      let el = btn;
      let bg = "rgba(0, 0, 0, 0)";
      while (el) {
        const c = getComputedStyle(el).backgroundColor;
        if (c && !/rgba\(0, 0, 0, 0\)|transparent/.test(c)) {
          bg = c;
          break;
        }
        el = el.parentElement;
      }
      let gradient = "none";
      for (let e = btn; e; e = e.parentElement) {
        const image = getComputedStyle(e).backgroundImage;
        if (image && image !== "none") {
          gradient = image.slice(0, 60);
          break;
        }
      }
      out.push({ label: label.slice(0, 20), color: getComputedStyle(btn).color, bg, gradient });
    }
    return out;
  });
  return rows.map((r) => ({
    label: r.label,
    ratio: contrast(parseColor(r.color), parseColor(r.bg)),
    // A gradient behind text is the shape of the original bug: the computed
    // background colour is only one end of it, so the ratio can look fine while
    // the other end fails. Flagged rather than measured.
    onGradient: r.gradient !== "none" && !r.gradient.startsWith("radial")
  }));
}

// --- run --------------------------------------------------------------------

async function audit(browser, url, label, shotDir) {
  const phone = await open(browser, url, PHONE, { isMobile: true, hasTouch: true });
  const chrome = await mobileChrome(phone);
  if (shotDir) await phone.screenshot({ path: `${shotDir}/${label}-mobile.png` });
  await phone.close();

  const desk = await open(browser, url, DESKTOP);
  const [red, targets, header] = [await redCensus(desk), await touchTargets(desk), await headerContrast(desk)];
  if (shotDir) await desk.screenshot({ path: `${shotDir}/${label}-desktop.png` });
  await desk.close();

  const light = await controlContrast(browser, url, false);
  const dark = await controlContrast(browser, url, true);

  return {
    label,
    mobile: {
      ...chrome,
      pctOfViewport: chrome.firstFieldTopPx
        ? Math.round((chrome.firstFieldTopPx / PHONE.height) * 100)
        : null
    },
    redOnUntouchedForm: red,
    touchTargets: targets,
    controlContrast: { light, dark },
    headerControls: {
      count: header.length,
      onGradient: header.filter((h) => h.onGradient).map((h) => h.label),
      belowAA: header.filter((h) => h.ratio < WCAG_TEXT_AA)
    }
  };
}

function report(a) {
  const verdicts = [];
  const push = (ok, text) => verdicts.push(`${ok ? "PASS" : "FAIL"}  ${text}`);

  push(a.touchTargets.under.length === 0, `touch targets >= ${TOUCH_FLOOR}px (${a.touchTargets.under.length} of ${a.touchTargets.total} under)`);
  for (const [theme, c] of Object.entries(a.controlContrast)) {
    if (!c) continue;
    push(c.borderVsFill >= WCAG_NON_TEXT, `${theme}: control border vs fill ${c.borderVsFill}:1 (needs ${WCAG_NON_TEXT})`);
    push(c.borderVsPanel >= WCAG_NON_TEXT, `${theme}: control border vs panel ${c.borderVsPanel}:1 (needs ${WCAG_NON_TEXT})`);
    push(c.textVsFill >= WCAG_TEXT_AA, `${theme}: field text vs fill ${c.textVsFill}:1 (needs ${WCAG_TEXT_AA})`);
  }
  push(a.headerControls.onGradient.length === 0, `no header control sits on a gradient (${a.headerControls.onGradient.join(", ") || "none"})`);
  push(a.headerControls.belowAA.length === 0, `header controls clear AA (${a.headerControls.belowAA.map((h) => `${h.label} ${h.ratio}:1`).join(", ") || "all clear"})`);

  console.log(`\n=== ${a.label} ===`);
  console.log(verdicts.join("\n"));
  console.log(
    `\nmobile chrome        first field at ${a.mobile.firstFieldTopPx}px (${a.mobile.pctOfViewport}% of a ${PHONE.height}px screen), header ${a.mobile.headerHeightPx}px`
  );
  console.log(
    `red on empty form    ${a.redOnUntouchedForm.total} elements ${JSON.stringify(a.redOnUntouchedForm.byContainer)}`
  );
  if (a.redOnUntouchedForm.texts.length) {
    console.log(`                     ${a.redOnUntouchedForm.texts.slice(0, 5).map(([t, n]) => `${n}x "${t}"`).join(", ")}`);
  }
  if (a.touchTargets.under.length) {
    console.log(`under ${TOUCH_FLOOR}px            ${a.touchTargets.under.map((t) => `${t.label} (${t.h}px)`).join(", ")}`);
  }
}

const url = arg("url", "http://localhost:4173");
const baseline = arg("baseline", null);
const shots = arg("shots", null);

const browser = await chromium.launch(
  process.env["PW_CHROMIUM_PATH"] ? { executablePath: process.env["PW_CHROMIUM_PATH"] } : {}
);
try {
  if (baseline) report(await audit(browser, baseline, "baseline", shots));
  report(await audit(browser, url, "current", shots));
} finally {
  await browser.close();
}
