/*
 * AAMVA Specification Handler
 * Provides:
 * - State metadata (official IINs from AAMVA)
 * - AAMVA version definitions (01-10) with correct mandatory/optional fields
 * - Auto-selection of AAMVA version by state
 * - Schema loader
 * - Field inspectors
 * - Version browser support
 * - Payload generator (AAMVA compliant)
 *
 * IIN data source: https://www.aamva.org/identity/issuer-identification-numbers-(iin)
 * Version history:
 *   01 = AAMVA DL/ID-2000
 *   02 = AAMVA CDS 1.0, 09-2003
 *   03 = AAMVA CDS 2.0, 03-2005
 *   04 = AAMVA CDS 1.0, 07-2009
 *   05 = AAMVA CDS 1.0, 07-2010
 *   06 = AAMVA CDS 1.0, 07-2011
 *   07 = AAMVA CDS 1.0, 06-2012
 *   08 = AAMVA CDS 1.0, 08-2013
 *   09 = AAMVA DL/ID-2016
 *   10 = AAMVA DL/ID-2020
 */

/* ========== STATE DEFINITIONS ========== */
// IINs sourced from official AAMVA Issuer Identification Numbers registry.
// aamvaVersion = the AAMVA CDS version currently used by each state for
// newly-issued credentials. Most states now issue on version 10 (2020 CDS).
// States known to still use version 09 (2016 CDS) are noted.

window.AAMVA_STATES = {
  AL: { IIN: "636033", aamvaVersion: "09" },
  AK: { IIN: "636059", aamvaVersion: "09" },
  AZ: { IIN: "636026", aamvaVersion: "10" },
  AR: { IIN: "636021", aamvaVersion: "09" },
  CA: { IIN: "636014", aamvaVersion: "10" },
  CO: { IIN: "636020", aamvaVersion: "10" },
  CT: { IIN: "636006", aamvaVersion: "09" },
  DE: { IIN: "636011", aamvaVersion: "09" },
  FL: { IIN: "636010", aamvaVersion: "10" },
  GA: { IIN: "636055", aamvaVersion: "10" },
  HI: { IIN: "636047", aamvaVersion: "10" },
  ID: { IIN: "636050", aamvaVersion: "09" },
  IL: { IIN: "636035", aamvaVersion: "10" },
  IN: { IIN: "636037", aamvaVersion: "09" },
  IA: { IIN: "636018", aamvaVersion: "09" },
  KS: { IIN: "636022", aamvaVersion: "09" },
  KY: { IIN: "636046", aamvaVersion: "09" },
  LA: { IIN: "636007", aamvaVersion: "09" },
  ME: { IIN: "636041", aamvaVersion: "09" },
  MD: { IIN: "636003", aamvaVersion: "10" },
  MA: { IIN: "636002", aamvaVersion: "09" },
  MI: { IIN: "636032", aamvaVersion: "10" },
  MN: { IIN: "636038", aamvaVersion: "09" },
  MS: { IIN: "636051", aamvaVersion: "09" },
  MO: { IIN: "636030", aamvaVersion: "09" },
  MT: { IIN: "636008", aamvaVersion: "09" },
  NE: { IIN: "636054", aamvaVersion: "10" },
  NV: { IIN: "636049", aamvaVersion: "09" },
  NH: { IIN: "636039", aamvaVersion: "09" },
  NJ: { IIN: "636036", aamvaVersion: "10" },
  NM: { IIN: "636009", aamvaVersion: "09" },
  NY: { IIN: "636001", aamvaVersion: "10" },
  NC: { IIN: "636004", aamvaVersion: "10" },
  ND: { IIN: "636034", aamvaVersion: "09" },
  OH: { IIN: "636023", aamvaVersion: "10" },
  OK: { IIN: "636058", aamvaVersion: "09" },
  OR: { IIN: "636029", aamvaVersion: "10" },
  PA: { IIN: "636025", aamvaVersion: "10" },
  RI: { IIN: "636052", aamvaVersion: "09" },
  SC: { IIN: "636005", aamvaVersion: "10" },
  SD: { IIN: "636042", aamvaVersion: "09" },
  TN: { IIN: "636053", aamvaVersion: "09" },
  TX: { IIN: "636015", aamvaVersion: "10" },
  UT: { IIN: "636040", aamvaVersion: "09" },
  VT: { IIN: "636024", aamvaVersion: "09" },
  VA: { IIN: "636000", aamvaVersion: "10" },
  WA: { IIN: "636045", aamvaVersion: "10" },
  WV: { IIN: "636061", aamvaVersion: "09" },
  WI: { IIN: "636031", aamvaVersion: "10" },
  WY: { IIN: "636060", aamvaVersion: "09" },
  DC: { IIN: "636043", aamvaVersion: "10" },

  // US Territories
  AS: { IIN: "604427", aamvaVersion: "09" },
  GU: { IIN: "636019", aamvaVersion: "09" },
  VI: { IIN: "636062", aamvaVersion: "09" },
  PR: { IIN: "604431", aamvaVersion: "09" }
};

/* ========== VERSION DEFINITIONS ========== */
// Field definitions based on AAMVA CDS specifications.
// Mandatory (required: true) vs Optional fields per the published standard.

window.AAMVA_VERSIONS = {

  "01": {
    name: "AAMVA DL/ID-2000 (Version 01)",
    fields: [
      { code: "DAA", label: "Full Name", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DAR", label: "Vehicle Class", type: "string" },
      { code: "DAS", label: "Restriction Codes", type: "string" },
      { code: "DAT", label: "Endorsement Codes", type: "string" },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date" },
      { code: "DAU", label: "Height", type: "string" },
      { code: "DAY", label: "Eye Color", type: "string" },
      { code: "DAW", label: "Weight", type: "string" }
    ]
  },

  "02": {
    name: "AAMVA CDS 2003 (Version 02)",
    fields: [
      { code: "DCT", label: "Customer Given Names", type: "string", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DAW", label: "Weight (pounds)", type: "string", required: true },
      { code: "DAX", label: "Weight (kilograms)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" }
    ]
  },

  "03": {
    name: "AAMVA DL/ID-2005 (Version 03)",
    fields: [
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string" },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" }
    ]
  },

  "04": {
    name: "AAMVA DL/ID-2009 (Version 04)",
    fields: [
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" }
    ]
  },

  "05": {
    name: "AAMVA DL/ID-2010 (Version 05)",
    fields: [
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" }
    ]
  },

  "06": {
    name: "AAMVA DL/ID-2011 (Version 06)",
    fields: [
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" }
    ]
  },

  "07": {
    name: "AAMVA DL/ID-2012 (Version 07)",
    fields: [
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" }
    ]
  },

  "08": {
    name: "AAMVA DL/ID-2013 (Version 08)",
    fields: [
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" },
      { code: "DDK", label: "Organ Donor Indicator", type: "string" },
      { code: "DDL", label: "Veteran Indicator", type: "string" }
    ]
  },

  "09": {
    name: "AAMVA DL/ID-2016 (Version 09)",
    fields: [
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" },
      { code: "DDK", label: "Organ Donor Indicator", type: "string" },
      { code: "DDL", label: "Veteran Indicator", type: "string" }
    ]
  },

  "10": {
    name: "AAMVA DL/ID-2020 (Version 10)",
    fields: [
      { code: "DCA", label: "Vehicle Class", type: "string", required: true },
      { code: "DCB", label: "Restriction Codes", type: "string", required: true },
      { code: "DCD", label: "Endorsement Codes", type: "string", required: true },
      { code: "DBA", label: "Expiration Date", type: "date", required: true },
      { code: "DCS", label: "Customer Family Name", type: "string", required: true },
      { code: "DAC", label: "Customer First Name", type: "string", required: true },
      { code: "DAD", label: "Customer Middle Name", type: "string", required: true },
      { code: "DBD", label: "Document Issue Date", type: "date", required: true },
      { code: "DBB", label: "Date of Birth", type: "date", required: true },
      { code: "DBC", label: "Sex", type: "char", required: true },
      { code: "DAY", label: "Eye Color", type: "string", required: true },
      { code: "DAU", label: "Height", type: "string", required: true },
      { code: "DAG", label: "Address Street", type: "string", required: true },
      { code: "DAI", label: "City", type: "string", required: true },
      { code: "DAJ", label: "Jurisdiction Code", type: "string", required: true },
      { code: "DAK", label: "Postal Code", type: "zip", required: true },
      { code: "DAQ", label: "Customer ID Number", type: "string", required: true },
      { code: "DCF", label: "Document Discriminator", type: "string", required: true },
      { code: "DCG", label: "Country Identification", type: "string", required: true },
      { code: "DDE", label: "Family Name Truncation", type: "string", required: true },
      { code: "DDF", label: "First Name Truncation", type: "string", required: true },
      { code: "DDG", label: "Middle Name Truncation", type: "string", required: true },
      { code: "DCU", label: "Name Suffix", type: "string" },
      { code: "DAW", label: "Weight (pounds)", type: "string" },
      { code: "DAZ", label: "Hair Color", type: "string" },
      { code: "DCL", label: "Race/Ethnicity", type: "string" },
      { code: "DDA", label: "Compliance Type", type: "string" },
      { code: "DDB", label: "Card Revision Date", type: "date" },
      { code: "DDK", label: "Organ Donor Indicator", type: "string" },
      { code: "DDL", label: "Veteran Indicator", type: "string" }
    ]
  }
};

/* ========== UTILITIES ========== */

// Required for "unknown field" validation
window.AAMVA_UNKNOWN_FIELD_POLICY = "reject";

// Get the default AAMVA version for a state
window.getVersionForState = function(stateCode) {
  const stateDef = window.AAMVA_STATES[stateCode];
  if (!stateDef) return null;
  return stateDef.aamvaVersion || "10";
};

// Get field definitions by version
window.getFieldsForVersion = function(v) {
  return window.AAMVA_VERSIONS[v]?.fields || [];
};

// Get mandatory fields for a specific state and version
window.getMandatoryFields = function(stateCode, version) {
  const versionDef = window.AAMVA_VERSIONS[version];
  if (!versionDef) return [];
  return versionDef.fields.filter(f => f.required);
};

// Inspector helper
window.describeVersion = function(v) {
  const info = window.AAMVA_VERSIONS[v];
  if (!info) return "Unknown version";

  return (
    `Version: ${info.name}\n` +
    `Fields:\n` +
    info.fields.map(f => `${f.code} — ${f.label}${f.required ? " (mandatory)" : ""}`).join("\n")
  );
};

// Validate field, type, required-ness
window.validateFieldValue = function(field, value) {
  if (field.required && !value) return false;
  if (!value) return true;

  switch (field.type) {
    case "date":
      return /^\d{8}$/.test(value); // MMDDCCYY or CCYYMMDD
    case "zip":
      return /^\d{5}(-\d{4})?$/.test(value);
    case "char":
      return /^[A-Z0-9]$/.test(value);
    case "string":
    default:
      return true;
  }
};

// Build minimal payload object for encoding
window.buildPayloadObject = function(stateCode, version, fields) {
  const obj = {
    state: stateCode,
    version: version
  };

  fields.forEach(f => {
    const el = document.getElementById(f.code);
    if (el) obj[f.code] = el.value || "";
  });

  return obj;
};

// Generate AAMVA compliant payload string
window.generateAAMVAPayload = function(stateCode, version, fields, dataObj) {
  // VALIDATION: Check mandatory fields
  const mandatoryFields = window.getMandatoryFields(stateCode, version);
  const missing = [];
  mandatoryFields.forEach(f => {
    if (!dataObj[f.code]) {
      missing.push(`${f.label} (${f.code})`);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing mandatory fields for ${stateCode} (v${version}): ${missing.join(", ")}`);
  }

  // Sanitize: strip control characters from all field values before encoding
  for (const field of fields) {
    if (dataObj[field.code]) {
      dataObj[field.code] = dataObj[field.code].replace(/[\x00-\x1f\x7f]/g, "");
    }
  }

  const stateDef = window.AAMVA_STATES[stateCode];
  const iin = stateDef.IIN;
  const jurisVersion = "00"; // Jurisdiction-specific version (00 default)

  // Header
  const compliance = "@";
  const dataElementSeparator = "\n";
  const recordSeparator = "\x1e";
  const segmentTerminator = "\r";
  const fileType = "ANSI ";

  // Header Part 1
  let header = compliance + dataElementSeparator + recordSeparator + segmentTerminator + fileType + iin + version + jurisVersion;

  // Subfiles
  // We only support "DL" (Driver License)
  const subfileType = "DL";

  // Build Subfile Data first to calculate length
  let subfileData = subfileType;

  // Fields
  for (const field of fields) {
    const val = dataObj[field.code];
    if (val !== undefined && val !== "") {
      subfileData += field.code + val + dataElementSeparator;
    }
  }

  subfileData += segmentTerminator;

  // Calculate offsets
  const numEntries = "01"; // We only have DL

  // Header fixed part:
  // @(1) + \n(1) + \x1e(1) + \r(1) + ANSI (5) + IIN(6) + Ver(2) + JVer(2) + NumEntries(2) = 21 bytes.
  // Subfile Directory Entry: Type(2) + Offset(4) + Length(4) = 10 bytes.

  const headerLength = 21 + (1 * 10);
  const offset = headerLength;

  const length = subfileData.length;

  const offsetStr = offset.toString().padStart(4, '0');
  const lengthStr = length.toString().padStart(4, '0');

  const subfileDir = subfileType + offsetStr + lengthStr;

  return header + numEntries + subfileDir + subfileData;
};
