---
"aamva-pdf417-generator": patch
---

Add observed encoding profiles for the published California v10, Oklahoma v01, and Texas v03 driver license specimens. Match the field order in both subfiles when recognizing an observed layout. Identify the whole-payload directory length error in the New Hampshire specimen. Retain the invalid West Virginia revision date as parser and encoder test evidence.

Add the Maryland v09 ID profile and an anonymized 299-byte reference from Maryland MVA testimony. Preserve jurisdiction-specific fields in five additional specimen layouts. Correct historical compliance and date field rules, and verify the final terminator in jurisdiction subfiles during strict parsing.
