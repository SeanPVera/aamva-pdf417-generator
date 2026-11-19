---
"aamva-pdf417-generator": patch
---

Add observed encoding profiles for the published California v10, Oklahoma v01, and Texas v03 driver license specimens. Match the field order in both subfiles when recognizing an observed layout. Identify the whole-payload directory length error in the New Hampshire specimen. Retain the invalid West Virginia revision date as parser and encoder test evidence.

Add the Maryland v09 ID profile and an anonymized 299-byte reference from Maryland MVA testimony. Preserve jurisdiction-specific fields in five additional specimen layouts. Correct historical compliance and date field rules, and verify the final terminator in jurisdiction subfiles during strict parsing.

Add unmodified references for Hawaii v10, Minnesota v01 and Oregon v09, plus a Guam v05 fixture with two documented framing corrections. Add a historical New Jersey v04 layout with its missing final carriage return restored and the subfile length corrected. Preserve nine additional New Jersey interim printouts as validation failures, and test the original Iowa and Idaho specimens and their controlled layouts. Accept the full hair-color names permitted by Annex D in editions v04 through v11.
