---
"aamva-pdf417-generator": patch
---

Accept CDS 2026 signature-coverage (`SCV`) declarations that leave `SIG` and `SCV` out of both lists, as the standard's own D.13 example does; both are treated as signed. Declaring either one unsigned is now rejected.
