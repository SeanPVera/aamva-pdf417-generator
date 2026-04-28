# AAMVA Conformance Corpus

This directory holds golden test vectors that pin the generator's output to
specific byte strings. A change to the generator that produces a different
encoding will fail the conformance test (`src/tests/conformance.test.ts`),
forcing an explicit decision: either the change is wrong, or the vector needs
to be regenerated and the diff reviewed against the AAMVA spec.

## Vector format

Each vector is a JSON file under `vectors/`:

```json
{
  "id": "ca-v10-dl-baseline",
  "state": "CA",
  "version": "10",
  "subfileType": "DL",
  "description": "Synthetic regression baseline (no PII).",
  "input": { "DCS": "DOE", "DAC": "JANE", "...": "..." },
  "expectedBytes": "@\n<RS>\rANSI 636014..."
}
```

- **`input`**: the record passed to `generateAAMVAPayload`.
- **`expectedBytes`**: the exact wire-format string the generator must produce.
  Bytes match character-for-character including separators (`\n`, `\x1e`,
  `\r`).

## Adding a new vector

### Synthetic (regression baseline)

Add an entry to `scripts/gen-vectors.mjs` and regenerate:

```bash
npx tsx scripts/gen-vectors.mjs
```

This captures the *current* implementation's output as the new baseline. Use
synthetic vectors to lock in behavior that's already correct and prevent
accidental regressions.

### Real-world (true conformance)

Real-world vectors are sourced from actual driver's licenses or AAMVA-published
test cards. **Never check in real PII.** When adding a real-world vector:

1. Decode the source barcode and inspect every field.
2. Replace PII (`DAA`, `DCS`, `DAC`, `DAD`, `DAG`, `DAI`, `DAQ`, `DCF`, `DBB`,
   `DBA`, `DBD`) with synthetic placeholders that **preserve byte length and
   character class** so the encoded output's byte layout is unchanged.
3. Hand-verify the resulting `expectedBytes` matches the decoded structure of
   the original (separators, padding, field ordering).
4. Document the source jurisdiction and capture date in `description`.

A failing real-world vector indicates the implementation diverges from what at
least one DMV actually issues — which is the highest-priority class of bug for
this project.

## Why this matters

Property-based and unit tests verify that the implementation is *internally
consistent*. Conformance vectors verify it matches *external reality*. Without
this corpus, "supports all 54 jurisdictions" is plausibility, not proof.
