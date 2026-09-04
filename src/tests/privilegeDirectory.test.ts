import { describe, expect, test } from "vitest";
import { getPrivilegeDirectory, regularClassFor, seededFields } from "../core/privilegeDirectory";

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
    expect(seededFields("MI", "DL").DCA).toBe("O");
  });
});

describe("seededFields", () => {
  test("fills truncation, country, class, and NONE privileges", () => {
    expect(seededFields("CA", "DL")).toMatchObject({
      DDE: "N",
      DDF: "N",
      DDG: "N",
      DCG: "USA",
      DCA: "C",
      DCB: "NONE",
      DCD: "NONE"
    });
    expect(seededFields("NY", "DL").DCA).toBe("D");
    expect(seededFields("FL", "ID").DCA).toBe("NONE");
  });
});
