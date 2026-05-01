import { describe, expect, test } from "vitest";
import {
  JURISDICTION_RULE_PACKS,
  getJurisdictionRulePack,
  getEffectiveDateRules,
  getDefaultDateRules
} from "../core/jurisdictionRules";
import { AAMVA_STATES } from "../core/states";
import {
  evaluateFieldValue,
  getValidationIssues,
  validateCrossFieldConsistency,
  AAMVA_STATE_RULES
} from "../core/validation";
import { getFieldsForStateAndVersion } from "../core/schema";

describe("jurisdiction rule packs", () => {
  test("every rule pack key is a known jurisdiction", () => {
    for (const code of Object.keys(JURISDICTION_RULE_PACKS)) {
      expect(AAMVA_STATES[code], `unknown jurisdiction in rule pack: ${code}`).toBeTruthy();
    }
  });

  test("every supported jurisdiction has a rule pack", () => {
    for (const code of Object.keys(AAMVA_STATES)) {
      expect(
        JURISDICTION_RULE_PACKS[code],
        `missing rule pack for jurisdiction: ${code}`
      ).toBeDefined();
    }
  });

  test("every rule pack has the full rule variety (description, constraints, dateRules, classMinimumAges)", () => {
    for (const [code, pack] of Object.entries(JURISDICTION_RULE_PACKS)) {
      expect(pack.state, `${code}.state mismatch`).toBe(code);
      expect(pack.description, `${code} missing description`).toBeTruthy();
      expect(
        Array.isArray(pack.constraints) && pack.constraints.length > 0,
        `${code} missing constraints`
      ).toBe(true);
      expect(pack.dateRules, `${code} missing dateRules`).toBeDefined();
      expect(pack.dateRules?.maxValidityYears, `${code} missing maxValidityYears`).toBeGreaterThan(
        0
      );
      expect(pack.dateRules?.minIssuanceAge, `${code} missing minIssuanceAge`).toBeGreaterThan(0);
      expect(
        pack.classMinimumAges && Object.keys(pack.classMinimumAges).length > 0,
        `${code} missing classMinimumAges`
      ).toBe(true);
    }
  });

  test("every constraint pattern accepts the value its DAQ generator produces", () => {
    // Sanity check: the auto-generators in `validation.ts` should produce
    // values that satisfy the rule pack's published format. If they don't,
    // either the generator or the pattern is wrong.
    for (const [code, pack] of Object.entries(JURISDICTION_RULE_PACKS)) {
      const daqConstraint = pack.constraints?.find((c) => c.field === "DAQ");
      const daqGen = AAMVA_STATE_RULES[code]?.generators?.DAQ;
      if (!daqConstraint?.pattern || !daqGen) continue;
      // Run a few times to catch generators with random branches.
      for (let i = 0; i < 25; i++) {
        const sample = daqGen();
        expect(
          daqConstraint.pattern.test(sample),
          `${code} generator produced "${sample}" which fails its own DAQ constraint`
        ).toBe(true);
      }
    }
  });

  test("date rules use sane bounds", () => {
    for (const [code, pack] of Object.entries(JURISDICTION_RULE_PACKS)) {
      if (pack.dateRules?.maxValidityYears !== undefined) {
        expect(
          pack.dateRules.maxValidityYears,
          `${code} maxValidityYears too small`
        ).toBeGreaterThan(0);
        expect(
          pack.dateRules.maxValidityYears,
          `${code} maxValidityYears too large`
        ).toBeLessThanOrEqual(60);
      }
      if (pack.dateRules?.minIssuanceAge !== undefined) {
        expect(
          pack.dateRules.minIssuanceAge,
          `${code} minIssuanceAge below 14`
        ).toBeGreaterThanOrEqual(14);
        expect(
          pack.dateRules.minIssuanceAge,
          `${code} minIssuanceAge above 21`
        ).toBeLessThanOrEqual(21);
      }
    }
  });

  test("getJurisdictionRulePack returns a default pack for unknown states", () => {
    const pack = getJurisdictionRulePack("ZZ");
    expect(pack.state).toBe("ZZ");
    expect(pack.dateRules?.maxValidityYears).toBe(getDefaultDateRules().maxValidityYears);
  });

  test("getEffectiveDateRules merges defaults with state overrides", () => {
    const ca = getEffectiveDateRules("CA");
    expect(ca.maxValidityYears).toBe(5);
    expect(ca.minIssuanceAge).toBe(16);

    const fallback = getEffectiveDateRules("ZZ");
    expect(fallback.maxValidityYears).toBe(getDefaultDateRules().maxValidityYears);
    expect(fallback.minIssuanceAge).toBe(getDefaultDateRules().minIssuanceAge);
  });
});

describe("evaluateFieldValue with rule pack constraints", () => {
  test("CA DAQ violation surfaces an error with severity 'error'", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const daq = fields.find((f) => f.code === "DAQ")!;
    const result = evaluateFieldValue(daq, "INVALID", "CA", false);
    expect(result.ok).toBe(false);
    expect(result.severity).toBe("error");
  });

  test("CA DAQ valid value yields ok=true", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const daq = fields.find((f) => f.code === "DAQ")!;
    const result = evaluateFieldValue(daq, "A1234567", "CA", false);
    expect(result.ok).toBe(true);
  });

  test("FL DAQ enforces 1 letter + 12 digits", () => {
    const fields = getFieldsForStateAndVersion("FL", "10");
    const daq = fields.find((f) => f.code === "DAQ")!;
    expect(evaluateFieldValue(daq, "X123456789012", "FL", false).ok).toBe(true);
    expect(evaluateFieldValue(daq, "X1234567", "FL", false).ok).toBe(false);
  });

  test("required-but-empty field surfaces a clear error message", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const dcs = fields.find((f) => f.code === "DCS")!;
    const result = evaluateFieldValue(dcs, "", "CA", false);
    expect(result.ok).toBe(false);
    expect(result.severity).toBe("error");
    expect(result.message).toMatch(/Required/i);
  });
});

describe("validateCrossFieldConsistency: validity period", () => {
  test("CA flags >5-year validity as a warning", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = validateCrossFieldConsistency(
      { DBB: "01011990", DBD: "01012024", DBA: "01012030" },
      fields,
      "CA"
    );
    const validityIssue = issues.find(
      (i) => i.code === "DBA" && i.severity === "warning" && /Validity period/i.test(i.message)
    );
    expect(validityIssue).toBeDefined();
  });

  test("CA accepts a 4-year validity span", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = validateCrossFieldConsistency(
      { DBB: "01011990", DBD: "01012024", DBA: "01012028" },
      fields,
      "CA"
    );
    const validityIssue = issues.find((i) => /Validity period/i.test(i.message));
    expect(validityIssue).toBeUndefined();
  });
});

describe("validateCrossFieldConsistency: class-minimum age", () => {
  test("CA Class A under 21 surfaces an error", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = validateCrossFieldConsistency(
      { DBB: "01012010", DBD: "01012027", DBA: "01012030", DCA: "A" },
      fields,
      "CA"
    );
    const classIssue = issues.find((i) => i.code === "DCA" && i.severity === "error");
    expect(classIssue).toBeDefined();
    expect(classIssue?.message).toMatch(/Class A/);
  });

  test("CA Class C at 17 is allowed", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = validateCrossFieldConsistency(
      { DBB: "01012010", DBD: "01012027", DBA: "01012030", DCA: "C" },
      fields,
      "CA"
    );
    const classIssue = issues.find((i) => i.code === "DCA");
    expect(classIssue).toBeUndefined();
  });

  test("multiple comma-separated classes are each validated", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = validateCrossFieldConsistency(
      { DBB: "01012010", DBD: "01012027", DBA: "01012030", DCA: "C,A" },
      fields,
      "CA"
    );
    const classIssues = issues.filter((i) => i.code === "DCA" && i.severity === "error");
    expect(classIssues.length).toBe(1); // only A fails
    expect(classIssues[0]?.message).toMatch(/Class A/);
  });
});

describe("validateCrossFieldConsistency: derived field consistency", () => {
  test("DAA family component must match DCS", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = validateCrossFieldConsistency(
      { DAA: "SMITH,JANE", DCS: "DOE", DBB: "01011990", DBD: "01012024", DBA: "01012028" },
      fields,
      "CA"
    );
    const mismatch = issues.find(
      (i) => i.code === "DAA" && i.severity === "warning" && /family/i.test(i.message)
    );
    expect(mismatch).toBeDefined();
  });

  test("DDG=T with empty DAD surfaces a warning", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = validateCrossFieldConsistency(
      {
        DDG: "T",
        DCS: "DOE",
        DAC: "JANE",
        DBB: "01011990",
        DBD: "01012024",
        DBA: "01012028"
      },
      fields,
      "CA"
    );
    const warn = issues.find((i) => i.code === "DDG" && i.severity === "warning");
    expect(warn).toBeDefined();
  });

  test("DDG=N with empty DAD is acceptable (no warning)", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = validateCrossFieldConsistency(
      {
        DDG: "N",
        DCS: "DOE",
        DAC: "JANE",
        DBB: "01011990",
        DBD: "01012024",
        DBA: "01012028"
      },
      fields,
      "CA"
    );
    const warn = issues.find((i) => i.code === "DDG");
    expect(warn).toBeUndefined();
  });
});

describe("getValidationIssues: severity tagging and aggregation", () => {
  test("issues carry a severity tier", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = getValidationIssues(fields, { DAJ: "CA", DAQ: "BAD" }, "CA", false);
    for (const issue of issues) {
      expect(issue.severity).toMatch(/^(error|warning)$/);
    }
  });

  test("required-empty fields report as errors", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = getValidationIssues(fields, { DAJ: "CA" }, "CA", false);
    const errors = issues.filter((i) => i.severity === "error");
    expect(errors.length).toBeGreaterThan(0);
  });

  test("CA over-long validity surfaces a warning, not an error", () => {
    const fields = getFieldsForStateAndVersion("CA", "10");
    const issues = getValidationIssues(
      fields,
      {
        DAJ: "CA",
        DCS: "DOE",
        DAC: "JANE",
        DBB: "01011990",
        DBD: "01012024",
        DBA: "01012030", // 6 yr span > CA 5 yr cap
        DBC: "1",
        DAU: "509",
        DAY: "BRO",
        DAQ: "A1234567",
        DAG: "1 MAIN ST",
        DAI: "ANYTOWN",
        DAK: "90001",
        DCF: "ABCDEFG12345",
        DCG: "USA",
        DDE: "N",
        DDF: "N",
        DDG: "N",
        DCA: "C",
        DCB: "NONE",
        DCD: "NONE"
      },
      "CA",
      false
    );
    const validity = issues.find(
      (i) => i.code === "DBA" && i.severity === "warning" && /Validity period/i.test(i.message)
    );
    expect(validity).toBeDefined();
    // No corresponding error for the same condition.
    const validityErr = issues.find(
      (i) => i.code === "DBA" && i.severity === "error" && /Validity period/i.test(i.message)
    );
    expect(validityErr).toBeUndefined();
  });
});
