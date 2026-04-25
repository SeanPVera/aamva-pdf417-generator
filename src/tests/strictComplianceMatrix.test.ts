import { describe, expect, test } from "vitest";
import { validateAAMVAPayloadStructure } from "../core/decoder";
import {
  generateAAMVAPayload,
  generateStateCardRevisionDate,
  generateStateDiscriminator,
  generateStateLicenseNumber
} from "../core/generator";
import { AAMVA_FIELD_OPTIONS, getFieldsForStateAndVersion } from "../core/schema";
import { AAMVA_STATES, isJurisdictionSupported } from "../core/states";

function buildRequiredData(stateCode: string, version: string): Record<string, string> {
  const fields = getFieldsForStateAndVersion(stateCode, version);
  const data: Record<string, string> = {};

  for (const field of fields) {
    if (!field.required) continue;
    if (data[field.code]) continue;

    const options = field.options || AAMVA_FIELD_OPTIONS[field.code] || [];
    if (options.length > 0) {
      data[field.code] = options[0].value;
      continue;
    }

    switch (field.code) {
      case "DAJ":
        data[field.code] = stateCode;
        break;
      case "DAQ":
        data[field.code] = generateStateLicenseNumber(stateCode);
        break;
      case "DCF":
        data[field.code] = generateStateDiscriminator(stateCode);
        break;
      case "DBB":
        data[field.code] = field.dateFormat === "YYYYMMDD" ? "19900101" : "01011990";
        break;
      case "DBD":
        data[field.code] = field.dateFormat === "YYYYMMDD" ? "20200101" : "01012020";
        break;
      case "DBA":
        data[field.code] = field.dateFormat === "YYYYMMDD" ? "20300101" : "01012030";
        break;
      case "DDB":
        data[field.code] = generateStateCardRevisionDate(stateCode, data.DBD) ?? "01012021";
        break;
      case "DAK":
        data[field.code] = "90001";
        break;
      case "DCG":
        data[field.code] = "USA";
        break;
      case "DAY":
        data[field.code] = "BRO";
        break;
      case "DAZ":
        data[field.code] = "BLK";
        break;
      case "DDE":
      case "DDF":
      case "DDG":
        data[field.code] = "N";
        break;
      case "DDA":
      case "DDK":
      case "DDL":
        data[field.code] = "0";
        break;
      default:
        data[field.code] = "X";
    }
  }

  return data;
}

describe("strict compliance matrix (supported jurisdictions)", () => {
  test("all supported jurisdictions generate structurally valid strict payloads on profile version", () => {
    for (const [stateCode, stateDef] of Object.entries(AAMVA_STATES)) {
      if (!isJurisdictionSupported(stateCode)) continue;
      const version = stateDef.aamvaVersion;
      const fields = getFieldsForStateAndVersion(stateCode, version);
      const data = buildRequiredData(stateCode, version);

      const payload = generateAAMVAPayload(stateCode, version, fields, data, {
        strictMode: true
      });

      const strictStructure = validateAAMVAPayloadStructure(payload, true);
      expect(strictStructure.ok, `strict structure failed for ${stateCode} v${version}`).toBe(true);
    }
  });
});
