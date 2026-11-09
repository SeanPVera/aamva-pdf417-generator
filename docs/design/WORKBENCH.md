# Technical Inspector

Design decision, November 2026 — Direction B selected for implementation.

The product is a **technical inspector** for moving between a structured AAMVA record and its machine-readable representation. The organizing idea is a dense ledger: command chrome, a context strip, a structure navigator, a tabular record pane, and a diagnostics/proof column. It borrows the clarity of engineering tools without resembling a government credential.

## Layout

1. **Command bar (dark):** product mark, undo/redo, first-class `import` / `scan` / `compare` / `batch` / `versions`, overflow for appearance/samples/erase, primary export.
2. **Context strip:** monospace meta cells — IIN/jurisdiction, version, subfile, strict mode, directory byte length, data class (`SAMPLE · synthetic`). Editable issuer/version/type/strict controls sit directly beneath.
3. **Structure nav:** vertical `@Section` list with completion / advisory / error status (empty ≠ error).
4. **Record ledger:** section title + badge; search/filters; field rows as code | label | value.
5. **Diagnostics:** proof placeholder/export, Validation / Payload / Fields / Bytes (existing inspector).
6. **Footer:** local processing + application validation ≠ standards certification.

## Visual

- **Typography:** Atkinson Hyperlegible Next (UI) and JetBrains Mono (codes, meta, commands). The Superdesign mockup used IBM Plex; production keeps the self-hosted offline pair for CSP and a11y (confusable character separation).
- **Color:** olive paper `#f3f1ea`, ink `#1a1c18`, accent `#0b6e4f`, chrome `#1a1c18`. Dark mode preserves hierarchy with a cooler olive surface.
- **Density:** compact mono command heights (28px) in chrome; 44px touch targets in the record/editor controls.
- **Motion:** brief feedback only; honor reduced motion. No credential imitation, seals, or card fronts.

## Non-negotiables

- Synthetic or authorized data only; fields stay in memory.
- Proof rendering remains application output — never claim standards certification.
- Encoder, observed profiles, print presets, and CSP offline policy are unchanged by this shell redesign.
