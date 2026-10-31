import type { AAMVAField } from "./schema";
import type { JurisdictionEncodingProfile, JurisdictionSubfileProfile } from "./jurisdictionRules";
import data from "./conformance/observed-profiles.json";
import { readDirectory, readPayloadHeader } from "./decoder";

export interface ObservedEncodingProfile {
  id: string;
  state: string;
  iin: string;
  version: string;
  subfileTypes: Array<"DL" | "ID">;
  notes: string[];
  // Full source URLs and hashes live in observed-profile-provenance.json.
  // The browser needs the wire rules and short qualifications only.
  encoding: Omit<JurisdictionEncodingProfile, "source" | "jurisdictionSubfile"> & {
    jurisdictionSubfile?: Pick<JurisdictionSubfileProfile, "type" | "elements">;
  };
  extraFields: AAMVAField[];
  optionalFields: string[];
  excludedFields: string[];
  retainDrivingFieldsOnId?: boolean;
  emitEmptyFields: string[];
  preservePostalHyphen?: boolean;
  allowValues?: Record<string, string[]>;
}

/** Explicit observed variants never replace the jurisdiction's default layout. */
export const OBSERVED_ENCODING_PROFILES = data as unknown as ObservedEncodingProfile[];

export function getObservedEncodingProfile(
  id: string | undefined,
  state: string,
  version: string,
  subfileType: "DL" | "ID"
): ObservedEncodingProfile | undefined {
  if (!id) return undefined;
  const profile = OBSERVED_ENCODING_PROFILES.find((candidate) => candidate.id === id);
  if (
    !profile ||
    profile.state !== state ||
    profile.version !== version ||
    !profile.subfileTypes.includes(subfileType)
  )
    throw new Error(
      "Observed encoding profile does not match jurisdiction, version, and document type"
    );
  return profile;
}

export function applyObservedFields(
  fields: AAMVAField[],
  profile: ObservedEncodingProfile
): AAMVAField[] {
  const extras = new Map(profile.extraFields.map((field) => [field.code, field]));
  const result = fields
    .filter((field) => !profile.excludedFields.includes(field.code))
    .map((field) => {
      const replacement = extras.get(field.code);
      extras.delete(field.code);
      return replacement ?? field;
    });
  return [...result, ...extras.values()].map((field) => ({
    ...field,
    ...(profile.optionalFields.includes(field.code) ? { required: false } : {}),
    ...(profile.allowValues?.[field.code]
      ? { allowedSentinels: profile.allowValues[field.code] }
      : {})
  }));
}

/** Conservative layout recognition from byte framing, without using identity values. */
export function identifyObservedEncodingProfile(payload: string): string | undefined {
  const header = readPayloadHeader(payload);
  const version = header.version;
  const revision = header.jurisdictionVersion;
  const { entries, error } = readDirectory(payload, false);
  if (error || !entries.length) return undefined;
  const primary = entries.find((entry) => entry.type === "DL" || entry.type === "ID");
  if (!primary) return undefined;
  const type = primary.type;
  const elements = payload
    .slice(primary.start + 2, primary.end)
    .replace(/\r$/, "")
    .split("\n")
    .filter(Boolean);
  if (elements.some((element) => !/^[A-Z]{2}[A-Z0-9]/.test(element))) return undefined;
  const codes = elements.map((element) => element.slice(0, 3));
  const matches = OBSERVED_ENCODING_PROFILES.filter((profile) => {
    if (
      profile.version !== version ||
      profile.encoding.jurisdictionVersion !== revision ||
      !profile.subfileTypes.includes(type as "DL" | "ID")
    )
      return false;
    // Issuer identity is checked against the profile's retained source header.
    if (profile.iin !== payload.slice(header.start + 9, header.start + 15)) return false;
    const order = profile.encoding.elementOrder ?? [];
    if (codes.some((code) => !order.includes(code))) return false;
    if (codes.join(",") !== order.filter((code) => codes.includes(code)).join(",")) return false;
    for (const element of elements) {
      const width = profile.encoding.fieldWidths?.[element.slice(0, 3)];
      if (width !== undefined && element.length - 3 !== width) return false;
    }
    return true;
  });
  return matches.length === 1 ? matches[0]!.id : undefined;
}

/** A retained source selects a layout only while the active document tuple agrees. */
export function activeObservedEncodingProfile(
  payload: string | null,
  state: string,
  version: string,
  type: "DL" | "ID"
): string | undefined {
  if (!payload) return undefined;
  const id = identifyObservedEncodingProfile(payload);
  const profile = OBSERVED_ENCODING_PROFILES.find((candidate) => candidate.id === id);
  return profile?.state === state &&
    profile.version === version &&
    profile.subfileTypes.includes(type)
    ? id
    : undefined;
}
