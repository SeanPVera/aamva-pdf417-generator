---
"aamva-pdf417-generator": patch
---

Four reported UI problems: unreadable text boxes, help popovers that never closed, decorations camped in the corner, and a required field whose values were never explained.

**Contrast**

`applyStateThemeToDocument` sets `data-state-theme` on `<html>` for every jurisdiction, and every palette in `stateThemes.ts` is built from light tints — `surface` is literally `#ffffff` and `input` a near-white mix. Those rules were not scoped away from `html.dark`, so dark mode painted white panels and near-white text boxes underneath the near-white text `html.dark` had already chosen. A form field measured **1.03:1**; the "Payload Fields" heading, the sidebar, and the preview column were the same. The light surfaces are now `:not(.dark)`, and dark mode mixes the jurisdiction hue *into* the dark surface instead of replacing it, which keeps the state's identity at 19:1 in the field the user is actually typing in.

Two things fell out of the same rule. `border-color: … !important` on `.dmv-main input` had been repainting the red and amber validation edges in the jurisdiction's own color, so an invalid field looked like a valid one; form fields now keep their own border and take only the themed fill. And the `text-gray-400 dark:text-gray-500` pairing used in fourteen places is below AA in *both* themes — it is now `text-gray-500 dark:text-gray-400`, which clears it in both. Field labels and the character counter moved to `gray-600`/`gray-300`: the floated label renders at about 10.5px, where the old value was only just over the 4.5:1 floor.

An empty `<select>` also rendered its own text transparent, so the control was a blank box with no hint it held a list. The placeholder is now muted rather than invisible.

**Field help popovers**

The `?` popover closed only on the help button's own `blur`. Clicking a `<button>` does not move focus in Safari or Firefox, so the blur never arrived and the box stayed open — one per field, stacking over the form until the page was reloaded. Dismissal now runs off the events that actually happen: a pointer press outside, `Escape` (which returns focus to the button), a scroll that carries the popover away from its field, or the popover's own close button. Opening one closes any other.

**Desk mascots**

Gus the clerk and the take-a-number ticket are the only decorations that sit over the page for a whole session rather than firing in response to something and leaving — and both were pinned to the same corner, so Gus's speech bubble covered the ticket. They are now a single opt-in under Playful extras → **Desk mascots**, off by default, and share one stacked column when enabled. The rest of the whimsy is unchanged.

**Sex coding**

`DBC` carries a code, not a word, and renders as a free-text box on every version except 01 — with nothing on screen saying what to type. It now has help text: `1 = male`, `2 = female`, `9 = not specified` for version 04 and later, `M` / `F` for version 01.

Guarded by a stylesheet test that rejects an unscoped light `--state-*` surface, a Playwright spec that measures painted contrast in dark mode across three very different palettes, and component tests for each popover dismissal path. Both fail against the previous code.
