---
"aamva-pdf417-generator": minor
---

Add AAMVA version 11 (DL/ID Card Design Standard 2025) to the schema.

The 2025 CDS writes version `11` in the barcode header. Relative to version 10:

- **Added** optional document-type indicators `DDM` (CDL/CLP), `DDN` (non-domiciled), `DDO` (enhanced EDL/EID), and `DDP` (permit). Each is F1N: encode `1` or omit.
- **Removed** `DCL` (race/ethnicity). AKA names (`DBN`/`DBG`/`DBS`) and HAZMAT expiry (`DDC`) are also gone from the 2025 element set; they were never in this table.
- **`DAK` is specified as V9ANS** (variable, max 9) instead of F11ANS (fixed 11). The shared length table stays at 11 so a dashed ZIP+4 still validates in the form; the encoder continues to strip the dash. Per-jurisdiction space-fill to 11 is unchanged.

Scanning or importing a version-11 payload now loads the 2025 form instead of being rejected as unsupported.
