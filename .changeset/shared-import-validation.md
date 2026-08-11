---
"aamva-pdf417-generator": patch
---

Apply the unsupported-version import guard to drag-and-drop as well as the file picker.

The header's file picker and the drag-and-drop overlay each carried their own copy of the JSON parse and shape checks. When the unsupported-version guard was added to the picker, the drop handler kept accepting a file naming a version this build has no field table for — switching the store to a schema with no fields and leaving the user looking at an empty form.

Both paths now share `parseImportedPayload` in `src/core/`, so a rule added to one applies to the other.
