// Public API for the AAMVA core. Importers (UI, tests, future @aamva/core npm
// package) should depend ONLY on these named exports — internals like file
// layout or per-state generator helpers are subject to change.

// Schema
export type { AAMVAField, AAMVAVersionDef, FieldOption } from "./schema";
export {
  AAMVA_VERSIONS,
  AAMVA_FIELD_OPTIONS,
  AAMVA_FIELD_LIMITS,
  AAMVA_STATE_EXCLUDED_FIELDS,
  getFieldsForVersion,
  getFieldsForStateAndVersion,
  getMandatoryFields,
  describeVersion
} from "./schema";

// Jurisdictions
export type { AAMVAStateDef } from "./states";
export { AAMVA_STATES, isJurisdictionSupported, getVersionForState } from "./states";

// Generation
export type { GenerateOptions } from "./generator";
export {
  generateAAMVAPayload,
  generateDocumentDiscriminator,
  generateStateDiscriminator,
  generateStateLicenseNumber,
  generateStateCardRevisionDate
} from "./generator";

// Decoding & structural validation
export type { ValidationResult, DecodeResult } from "./decoder";
export {
  validateAAMVAPayloadStructure,
  decodePayload,
  decodeAAMVAFormat,
  decodeAAMVA,
  describeFields
} from "./decoder";

// Field & cross-field validation
export {
  AAMVA_STATE_RULES,
  validateFieldValue,
  evaluateFieldValue,
  validateCrossFieldConsistency,
  getValidationIssues,
  hasBlockingIssues,
  sanitizeFieldValue
} from "./validation";
export type { FieldEvaluation } from "./validation";

// Jurisdiction rule packs (per-state overrides on top of the AAMVA version
// defaults — required fields, regex constraints, date semantics, class ages).
export type {
  JurisdictionRulePack,
  JurisdictionConstraint,
  JurisdictionDateRules,
  Severity
} from "./jurisdictionRules";
export {
  JURISDICTION_RULE_PACKS,
  getJurisdictionRulePack,
  getEffectiveDateRules,
  getDefaultDateRules
} from "./jurisdictionRules";

// Theming (UI-adjacent but data-only — no DOM dependency)
export type { StateTheme } from "./stateThemes";
export {
  STATE_THEMES,
  DEFAULT_STATE_THEME,
  getStateTheme,
  applyStateThemeToDocument
} from "./stateThemes";
