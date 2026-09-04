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
    expect(dir.restrictions.some((c) => c.value === "F")).toBe(true);
  });

  test("NY regular is D, with DJ as an extra", () => {
    const dir = getPrivilegeDirectory("NY");
    expect(dir.regularClass).toBe("D");
    expect(dir.classes.some((c) => c.value === "DJ")).toBe(true);
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
