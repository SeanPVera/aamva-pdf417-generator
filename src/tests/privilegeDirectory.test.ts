import { describe, expect, test } from "vitest";
import { getPrivilegeDirectory, regularClassFor } from "../core/privilegeDirectory";
import { seededFields } from "../core/derivedFields";

describe("regularClassFor", () => {
  test("reads the automobile class off the jurisdiction age table", () => {
    expect(regularClassFor("CA")).toBe("C");
    expect(regularClassFor("TX")).toBe("C");
    expect(regularClassFor("NY")).toBe("D");
    expect(regularClassFor("FL")).toBe("E");
    expect(regularClassFor("AL")).toBe("D");
    expect(regularClassFor("WA")).toBe("D");
    expect(regularClassFor("CO")).toBe("R");
    expect(regularClassFor("HI")).toBe("3");
  });
});

describe("getPrivilegeDirectory", () => {
  test("CA includes M1/M2 and regular C", () => {
    const dir = getPrivilegeDirectory("CA");
    expect(dir.regularClass).toBe("C");
    expect(dir.classes.map((c) => c.value)).toEqual(
      expect.arrayContaining(["A", "B", "C", "M", "M1", "M2", "NONE"])
    );
  });

  test("restrictions are the AAMVA D20 barcode letters", () => {
    const dir = getPrivilegeDirectory("PA");
    const codes = dir.restrictions.map((c) => c.value);
    expect(codes).toEqual(expect.arrayContaining(["NONE", "B", "F", "G", "K", "T", "V", "Z"]));
    expect(dir.restrictions.find((c) => c.value === "G")?.title).toMatch(/daylight/i);
    expect(dir.restrictions.find((c) => c.value === "T")?.title).toMatch(/interlock/i);
    expect(dir.restrictions.find((c) => c.value === "F")?.title).toMatch(/mirror/i);
  });

  test("NY regular is D, with DJ from the age table", () => {
    const dir = getPrivilegeDirectory("NY");
    expect(dir.regularClass).toBe("D");
    expect(dir.classes.some((c) => c.value === "DJ")).toBe(true);
  });

  test("Michigan Operator encodes as O, not the word Operator", () => {
    expect(regularClassFor("MI")).toBe("O");
  });
});

describe("seededFields", () => {
  test("seeds the structural elements", () => {
    expect(seededFields("CA", "DL")).toEqual({
      DDE: "N",
      DDF: "N",
      DDG: "N",
      DCG: "USA"
    });
  });

  // A vehicle class, a restriction set and an endorsement set are claims about
  // a specific person's driving privileges. Seeding them told the barcode this
  // holder drives a class C car with nothing on their record, on a form nobody
  // had touched — and filled three mandatory fields so the missing-field check
  // stopped noticing they were unanswered.
  test("never seeds a driving privilege", () => {
    for (const [state, subfile] of [
      ["CA", "DL"],
      ["NY", "DL"],
      ["MI", "DL"],
      ["FL", "ID"]
    ] as const) {
      const seeds = seededFields(state, subfile);
      expect(seeds.DCA).toBeUndefined();
      expect(seeds.DCB).toBeUndefined();
      expect(seeds.DCD).toBeUndefined();
    }
  });
});
