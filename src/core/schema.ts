export interface FieldOption {
  value: string;
  label: string;
}

export interface AAMVAField {
  code: string;
  label: string;
  type: 'string' | 'char' | 'zip' | 'date';
  required?: boolean;
  dateFormat?: string;
  options?: FieldOption[];
}

export interface AAMVAVersionDef {
  name: string;
  fields: AAMVAField[];
}

export const AAMVA_FIELD_OPTIONS: Record<string, FieldOption[]> = {
  DBC: [
    { value: '1', label: '1 — Male' },
    { value: '2', label: '2 — Female' },
    { value: '9', label: '9 — Not Specified' },
  ],
  DAY: [
    { value: 'BLK', label: 'BLK — Black' },
    { value: 'BLU', label: 'BLU — Blue' },
    { value: 'BRO', label: 'BRO — Brown' },
    { value: 'GRY', label: 'GRY — Gray' },
    { value: 'GRN', label: 'GRN — Green' },
    { value: 'HAZ', label: 'HAZ — Hazel' },
    { value: 'MAR', label: 'MAR — Maroon' },
    { value: 'PNK', label: 'PNK — Pink' },
    { value: 'DIC', label: 'DIC — Dichromatic' },
    { value: 'UNK', label: 'UNK — Unknown' },
  ],
  DAZ: [
    { value: 'BAL', label: 'BAL — Bald' },
    { value: 'BLK', label: 'BLK — Black' },
    { value: 'BLN', label: 'BLN — Blond' },
    { value: 'BRO', label: 'BRO — Brown' },
    { value: 'GRY', label: 'GRY — Gray' },
    { value: 'RED', label: 'RED — Red/Auburn' },
    { value: 'SDY', label: 'SDY — Sandy' },
    { value: 'WHI', label: 'WHI — White' },
    { value: 'UNK', label: 'UNK — Unknown' },
  ],
  DCG: [
    { value: 'USA', label: 'USA — United States' },
    { value: 'CAN', label: 'CAN — Canada' },
    { value: 'MEX', label: 'MEX — Mexico' },
  ],
  DDE: [
    { value: 'T', label: 'T — Truncated' },
    { value: 'N', label: 'N — Not Truncated' },
    { value: 'U', label: 'U — Unknown' },
  ],
  DDF: [
    { value: 'T', label: 'T — Truncated' },
    { value: 'N', label: 'N — Not Truncated' },
    { value: 'U', label: 'U — Unknown' },
  ],
  DDG: [
    { value: 'T', label: 'T — Truncated' },
    { value: 'N', label: 'N — Not Truncated' },
    { value: 'U', label: 'U — Unknown' },
  ],
  DDA: [
    { value: 'F', label: 'F — Fully Compliant' },
    { value: 'N', label: 'N — Non-Compliant' },
  ],
  DDK: [
    { value: '1', label: '1 — Donor' },
    { value: '0', label: '0 — Not a Donor' },
  ],
  DDL: [
    { value: '1', label: '1 — Veteran' },
    { value: '0', label: '0 — Not a Veteran' },
  ],
  DCL: [
    { value: 'AI', label: 'AI — Alaskan/American Indian' },
    { value: 'AP', label: 'AP — Asian/Pacific Islander' },
    { value: 'BK', label: 'BK — Black' },
    { value: 'H', label: 'H — Hispanic Origin' },
    { value: 'O', label: 'O — Non-Hispanic' },
    { value: 'U', label: 'U — Unknown' },
    { value: 'W', label: 'W — White' },
  ],
};

export const AAMVA_FIELD_LIMITS: Record<string, number> = {
  DCS: 40, DAC: 40, DAD: 40, DAA: 125, DCT: 80, DCU: 5,
  DAG: 35, DAH: 35, DAI: 20, DAJ: 2, DAK: 11, DAQ: 25,
  DCA: 6, DCB: 12, DCD: 5, DBA: 8, DBB: 8, DBC: 1,
  DBD: 8, DAU: 6, DAY: 3, DAZ: 3, DAW: 3, DAX: 3,
  DCF: 25, DCG: 3, DCL: 2, DDE: 1, DDF: 1, DDG: 1,
  DDA: 1, DDB: 8, DDK: 1, DDL: 1, DAR: 4, DAS: 10, DAT: 5,
};

export const AAMVA_STATE_EXCLUDED_FIELDS: Record<string, string[]> = {
  NY: ['DAW', 'DAX', 'DAZ', 'DCL'],
  CT: ['DAW', 'DAX', 'DCL'],
  VT: ['DAW', 'DAX', 'DCL'],
  ME: ['DAW', 'DAX', 'DCL'],
  NH: ['DAW', 'DAX', 'DCL'],
  AL: ['DAX', 'DCL'], AK: ['DAX', 'DCL'], AZ: ['DAX', 'DCL'],
  AR: ['DAX', 'DCL'], CA: ['DAX', 'DCL'], CO: ['DAX', 'DCL'],
  DE: ['DAX', 'DCL'], FL: ['DAX', 'DCL'], GA: ['DAX', 'DCL'],
  HI: ['DAX', 'DCL'], ID: ['DAX', 'DCL'], IL: ['DAX', 'DCL'],
  IN: ['DAX', 'DCL'], IA: ['DAX', 'DCL'], KS: ['DAX', 'DCL'],
  KY: ['DAX', 'DCL'], LA: ['DAX', 'DCL'], MD: ['DAX', 'DCL'],
  MA: ['DAX', 'DCL'], MI: ['DAX', 'DCL'], MN: ['DAX', 'DCL'],
  MS: ['DAX', 'DCL'], MO: ['DAX', 'DCL'], MT: ['DAX', 'DCL'],
  NE: ['DAX', 'DCL'], NV: ['DAX', 'DCL'], NJ: ['DAX', 'DCL'],
  NM: ['DAX', 'DCL'], NC: ['DAX', 'DCL'], ND: ['DAX', 'DCL'],
  OH: ['DAX', 'DCL'], OK: ['DAX', 'DCL'], OR: ['DAX', 'DCL'],
  PA: ['DAX', 'DCL'], RI: ['DAX', 'DCL'], SC: ['DAX', 'DCL'],
  SD: ['DAX', 'DCL'], TN: ['DAX', 'DCL'], TX: ['DAX', 'DCL'],
  UT: ['DAX', 'DCL'], VA: ['DAX', 'DCL'], WA: ['DAX', 'DCL'],
  WV: ['DAX', 'DCL'], WI: ['DAX', 'DCL'], WY: ['DAX', 'DCL'],
  DC: ['DAX', 'DCL'],
};

export const AAMVA_VERSIONS: Record<string, AAMVAVersionDef> = {
  '01': {
    name: 'AAMVA DL/ID-2000 (Version 01)',
    fields: [
      { code: 'DAA', label: 'Full Name', type: 'string', required: true },
      { code: 'DAG', label: 'Address Street', type: 'string', required: true },
      { code: 'DAH', label: 'Address Line 2', type: 'string' },
      { code: 'DAI', label: 'City', type: 'string', required: true },
      { code: 'DAJ', label: 'Jurisdiction Code', type: 'string', required: true },
      { code: 'DAK', label: 'Postal Code', type: 'zip', required: true },
      { code: 'DAQ', label: 'Customer ID Number', type: 'string', required: true },
      { code: 'DAR', label: 'Vehicle Class', type: 'string' },
      { code: 'DAS', label: 'Restriction Codes', type: 'string' },
      { code: 'DAT', label: 'Endorsement Codes', type: 'string' },
      { code: 'DBA', label: 'Expiration Date', type: 'date', required: true, dateFormat: 'YYYYMMDD' },
      { code: 'DBB', label: 'Date of Birth', type: 'date', required: true, dateFormat: 'YYYYMMDD' },
      { code: 'DBC', label: 'Sex', type: 'char', required: true, options: [{ value: 'M', label: 'M — Male' }, { value: 'F', label: 'F — Female' }] },
      { code: 'DBD', label: 'Document Issue Date', type: 'date', dateFormat: 'YYYYMMDD' },
      { code: 'DAU', label: 'Height', type: 'string' },
      { code: 'DAY', label: 'Eye Color', type: 'string' },
      { code: 'DAW', label: 'Weight', type: 'string' },
    ],
  },
  '02': {
    name: 'AAMVA CDS 2003 (Version 02)',
    fields: [
      { code: 'DCT', label: 'Customer Given Names', type: 'string', required: true },
      { code: 'DCS', label: 'Customer Family Name', type: 'string', required: true },
      { code: 'DCU', label: 'Name Suffix', type: 'string' },
      { code: 'DAG', label: 'Address Street', type: 'string', required: true },
      { code: 'DAH', label: 'Address Line 2', type: 'string' },
      { code: 'DAI', label: 'City', type: 'string', required: true },
      { code: 'DAJ', label: 'Jurisdiction Code', type: 'string', required: true },
      { code: 'DAK', label: 'Postal Code', type: 'zip', required: true },
      { code: 'DAQ', label: 'Customer ID Number', type: 'string', required: true },
      { code: 'DCA', label: 'Vehicle Class', type: 'string', required: true },
      { code: 'DCB', label: 'Restriction Codes', type: 'string', required: true },
      { code: 'DCD', label: 'Endorsement Codes', type: 'string', required: true },
      { code: 'DBA', label: 'Expiration Date', type: 'date', required: true },
      { code: 'DBB', label: 'Date of Birth', type: 'date', required: true },
      { code: 'DBC', label: 'Sex', type: 'char', required: true },
      { code: 'DBD', label: 'Document Issue Date', type: 'date', required: true },
      { code: 'DAU', label: 'Height', type: 'string', required: true },
      { code: 'DAY', label: 'Eye Color', type: 'string', required: true },
      { code: 'DCF', label: 'Document Discriminator', type: 'string', required: true },
      { code: 'DCG', label: 'Country Identification', type: 'string', required: true },
      { code: 'DAW', label: 'Weight (pounds)', type: 'string', required: true },
      { code: 'DAX', label: 'Weight (kilograms)', type: 'string' },
      { code: 'DAZ', label: 'Hair Color', type: 'string' },
      { code: 'DCL', label: 'Race/Ethnicity', type: 'string' },
    ],
  },
  '03': {
    name: 'AAMVA DL/ID-2005 (Version 03)',
    fields: [
      { code: 'DCS', label: 'Customer Family Name', type: 'string', required: true },
      { code: 'DAC', label: 'Customer First Name', type: 'string', required: true },
      { code: 'DAD', label: 'Customer Middle Name', type: 'string' },
      { code: 'DCU', label: 'Name Suffix', type: 'string' },
      { code: 'DAG', label: 'Address Street', type: 'string', required: true },
      { code: 'DAH', label: 'Address Line 2', type: 'string' },
      { code: 'DAI', label: 'City', type: 'string', required: true },
      { code: 'DAJ', label: 'Jurisdiction Code', type: 'string', required: true },
      { code: 'DAK', label: 'Postal Code', type: 'zip', required: true },
      { code: 'DAQ', label: 'Customer ID Number', type: 'string', required: true },
      { code: 'DCA', label: 'Vehicle Class', type: 'string', required: true },
      { code: 'DCB', label: 'Restriction Codes', type: 'string', required: true },
      { code: 'DCD', label: 'Endorsement Codes', type: 'string', required: true },
      { code: 'DBA', label: 'Expiration Date', type: 'date', required: true },
      { code: 'DBB', label: 'Date of Birth', type: 'date', required: true },
      { code: 'DBC', label: 'Sex', type: 'char', required: true },
      { code: 'DBD', label: 'Document Issue Date', type: 'date', required: true },
      { code: 'DAU', label: 'Height', type: 'string', required: true },
      { code: 'DAY', label: 'Eye Color', type: 'string', required: true },
      { code: 'DCF', label: 'Document Discriminator', type: 'string', required: true },
      { code: 'DCG', label: 'Country Identification', type: 'string', required: true },
      { code: 'DAW', label: 'Weight (pounds)', type: 'string' },
      { code: 'DAZ', label: 'Hair Color', type: 'string' },
      { code: 'DCL', label: 'Race/Ethnicity', type: 'string' },
    ],
  },
  '04': {
    name: 'AAMVA DL/ID-2009 (Version 04)',
    fields: [
      { code: 'DCA', label: 'Vehicle Class', type: 'string', required: true },
      { code: 'DCB', label: 'Restriction Codes', type: 'string', required: true },
      { code: 'DCD', label: 'Endorsement Codes', type: 'string', required: true },
      { code: 'DBA', label: 'Expiration Date', type: 'date', required: true },
      { code: 'DCS', label: 'Customer Family Name', type: "string", required: true },
      { code: 'DAC', label: 'Customer First Name', type: 'string', required: true },
      { code: 'DAD', label: 'Customer Middle Name', type: 'string' },
      { code: 'DBD', label: 'Document Issue Date', type: 'date', required: true },
      { code: 'DBB', label: 'Date of Birth', type: 'date', required: true },
      { code: 'DBC', label: 'Sex', type: 'char', required: true },
      { code: 'DAY', label: 'Eye Color', type: 'string', required: true },
      { code: 'DAU', label: 'Height', type: 'string', required: true },
      { code: 'DAG', label: 'Address Street', type: 'string', required: true },
      { code: 'DAH', label: 'Address Line 2', type: 'string' },
      { code: 'DAI', label: 'City', type: 'string', required: true },
      { code: 'DAJ', label: 'Jurisdiction Code', type: 'string', required: true },
      { code: 'DAK', label: 'Postal Code', type: 'zip', required: true },
      { code: 'DAQ', label: 'Customer ID Number', type: 'string', required: true },
      { code: 'DCF', label: 'Document Discriminator', type: 'string', required: true },
      { code: 'DCG', label: 'Country Identification', type: 'string', required: true },
      { code: 'DDE', label: 'Family Name Truncation', type: 'string', required: true },
      { code: 'DDF', label: 'First Name Truncation', type: 'string', required: true },
      { code: 'DDG', label: 'Middle Name Truncation', type: 'string', required: true },
      { code: 'DCU', label: 'Name Suffix', type: 'string' },
      { code: 'DAW', label: 'Weight (pounds)', type: 'string' },
      { code: 'DAZ', label: 'Hair Color', type: 'string' },
      { code: 'DCL', label: 'Race/Ethnicity', type: 'string' },
      { code: 'DDA', label: 'Compliance Type', type: 'string' },
      { code: 'DDB', label: 'Card Revision Date', type: 'date' },
    ],
  },
  '08': {
    name: 'AAMVA DL/ID-2013 (Version 08)',
    fields: [
      { code: 'DCA', label: 'Vehicle Class', type: 'string', required: true },
      { code: 'DCB', label: 'Restriction Codes', type: 'string', required: true },
      { code: 'DCD', label: 'Endorsement Codes', type: 'string', required: true },
      { code: 'DBA', label: 'Expiration Date', type: 'date', required: true },
      { code: 'DCS', label: 'Customer Family Name', type: 'string', required: true },
      { code: 'DAC', label: 'Customer First Name', type: 'string', required: true },
      { code: 'DAD', label: 'Customer Middle Name', type: 'string' },
      { code: 'DBD', label: 'Document Issue Date', type: 'date', required: true },
      { code: 'DBB', label: 'Date of Birth', type: 'date', required: true },
      { code: 'DBC', label: 'Sex', type: 'char', required: true },
      { code: 'DAY', label: 'Eye Color', type: 'string', required: true },
      { code: 'DAU', label: 'Height', type: 'string', required: true },
      { code: 'DAG', label: 'Address Street', type: 'string', required: true },
      { code: 'DAH', label: 'Address Line 2', type: 'string' },
      { code: 'DAI', label: 'City', type: 'string', required: true },
      { code: 'DAJ', label: 'Jurisdiction Code', type: 'string', required: true },
      { code: 'DAK', label: 'Postal Code', type: 'zip', required: true },
      { code: 'DAQ', label: 'Customer ID Number', type: 'string', required: true },
      { code: 'DCF', label: 'Document Discriminator', type: 'string', required: true },
      { code: 'DCG', label: 'Country Identification', type: 'string', required: true },
      { code: 'DDE', label: 'Family Name Truncation', type: 'string', required: true },
      { code: 'DDF', label: 'First Name Truncation', type: 'string', required: true },
      { code: 'DDG', label: 'Middle Name Truncation', type: 'string', required: true },
      { code: 'DCU', label: 'Name Suffix', type: 'string' },
      { code: 'DAW', label: 'Weight (pounds)', type: 'string' },
      { code: 'DAZ', label: 'Hair Color', type: 'string' },
      { code: 'DCL', label: 'Race/Ethnicity', type: 'string' },
      { code: 'DDA', label: 'Compliance Type', type: 'string' },
      { code: 'DDB', label: 'Card Revision Date', type: 'date' },
      { code: 'DDK', label: 'Organ Donor Indicator', type: 'string' },
      { code: 'DDL', label: 'Veteran Indicator', type: 'string' },
    ],
  },
  '09': {
    name: 'AAMVA DL/ID-2016 (Version 09)',
    fields: [
      { code: 'DCA', label: 'Vehicle Class', type: 'string', required: true },
      { code: 'DCB', label: 'Restriction Codes', type: 'string', required: true },
      { code: 'DCD', label: 'Endorsement Codes', type: 'string', required: true },
      { code: 'DBA', label: 'Expiration Date', type: 'date', required: true },
      { code: 'DCS', label: 'Customer Family Name', type: 'string', required: true },
      { code: 'DAC', label: 'Customer First Name', type: 'string', required: true },
      { code: 'DAD', label: 'Customer Middle Name', type: 'string' },
      { code: 'DBD', label: 'Document Issue Date', type: 'date', required: true },
      { code: 'DBB', label: 'Date of Birth', type: 'date', required: true },
      { code: 'DBC', label: 'Sex', type: 'char', required: true },
      { code: 'DAY', label: 'Eye Color', type: 'string', required: true },
      { code: 'DAU', label: 'Height', type: 'string', required: true },
      { code: 'DAG', label: 'Address Street', type: 'string', required: true },
      { code: 'DAH', label: 'Address Line 2', type: 'string' },
      { code: 'DAI', label: 'City', type: 'string', required: true },
      { code: 'DAJ', label: 'Jurisdiction Code', type: 'string', required: true },
      { code: 'DAK', label: 'Postal Code', type: 'zip', required: true },
      { code: 'DAQ', label: 'Customer ID Number', type: 'string', required: true },
      { code: 'DCF', label: 'Document Discriminator', type: 'string', required: true },
      { code: 'DCG', label: 'Country Identification', type: 'string', required: true },
      { code: 'DDE', label: 'Family Name Truncation', type: 'string', required: true },
      { code: 'DDF', label: 'First Name Truncation', type: 'string', required: true },
      { code: 'DDG', label: 'Middle Name Truncation', type: 'string', required: true },
      { code: 'DCU', label: 'Name Suffix', type: 'string' },
      { code: 'DAW', label: 'Weight (pounds)', type: 'string' },
      { code: 'DAZ', label: 'Hair Color', type: 'string' },
      { code: 'DCL', label: 'Race/Ethnicity', type: 'string' },
      { code: 'DDA', label: 'Compliance Type', type: 'string' },
      { code: 'DDB', label: 'Card Revision Date', type: 'date' },
      { code: 'DDK', label: 'Organ Donor Indicator', type: 'string' },
      { code: 'DDL', label: 'Veteran Indicator', type: 'string' },
    ],
  },
  '10': {
    name: 'AAMVA DL/ID-2020 (Version 10)',
    fields: [
      { code: 'DCA', label: 'Vehicle Class', type: 'string', required: true },
      { code: 'DCB', label: 'Restriction Codes', type: 'string', required: true },
      { code: 'DCD', label: 'Endorsement Codes', type: 'string', required: true },
      { code: 'DBA', label: 'Expiration Date', type: 'date', required: true },
      { code: 'DCS', label: 'Customer Family Name', type: 'string', required: true },
      { code: 'DAC', label: 'Customer First Name', type: 'string', required: true },
      { code: 'DAD', label: 'Customer Middle Name', type: 'string' },
      { code: 'DBD', label: 'Document Issue Date', type: 'date', required: true },
      { code: 'DBB', label: 'Date of Birth', type: 'date', required: true },
      { code: 'DBC', label: 'Sex', type: 'char', required: true },
      { code: 'DAY', label: 'Eye Color', type: 'string', required: true },
      { code: 'DAU', label: 'Height', type: 'string', required: true },
      { code: 'DAG', label: 'Address Street', type: 'string', required: true },
      { code: 'DAH', label: 'Address Line 2', type: 'string' },
      { code: 'DAI', label: 'City', type: 'string', required: true },
      { code: 'DAJ', label: 'Jurisdiction Code', type: 'string', required: true },
      { code: 'DAK', label: 'Postal Code', type: 'zip', required: true },
      { code: 'DAQ', label: 'Customer ID Number', type: 'string', required: true },
      { code: 'DCF', label: 'Document Discriminator', type: 'string', required: true },
      { code: 'DCG', label: 'Country Identification', type: 'string', required: true },
      { code: 'DDE', label: 'Family Name Truncation', type: 'string', required: true },
      { code: 'DDF', label: 'First Name Truncation', type: 'string', required: true },
      { code: 'DDG', label: 'Middle Name Truncation', type: 'string', required: true },
      { code: 'DCU', label: 'Name Suffix', type: 'string' },
      { code: 'DAW', label: 'Weight (pounds)', type: 'string' },
      { code: 'DAZ', label: 'Hair Color', type: 'string' },
      { code: 'DCL', label: 'Race/Ethnicity', type: 'string' },
      { code: 'DDA', label: 'Compliance Type', type: 'string' },
      { code: 'DDB', label: 'Card Revision Date', type: 'date' },
      { code: 'DDK', label: 'Organ Donor Indicator', type: 'string' },
      { code: 'DDL', label: 'Veteran Indicator', type: 'string' },
    ],
  },
};

export function getFieldsForVersion(v: string): AAMVAField[] {
  return AAMVA_VERSIONS[v]?.fields || [];
}

export function getFieldsForStateAndVersion(stateCode: string, v: string): AAMVAField[] {
  const allFields = getFieldsForVersion(v);
  if (!stateCode || !AAMVA_STATE_EXCLUDED_FIELDS) return allFields;

  const excluded = AAMVA_STATE_EXCLUDED_FIELDS[stateCode];
  if (!excluded || excluded.length === 0) return allFields;

  const excludedSet = new Set(excluded);
  return allFields.filter((f) => f.required || !excludedSet.has(f.code));
}

export function getMandatoryFields(stateCode: string, version: string): AAMVAField[] {
  const versionDef = AAMVA_VERSIONS[version];
  if (!versionDef) return [];
  return versionDef.fields.filter((f) => f.required);
}

export function describeVersion(v: string): string {
  const info = AAMVA_VERSIONS[v];
  if (!info) return 'Unknown version';

  return (
    `Version: ${info.name}\n` +
    `Fields:\n` +
    info.fields.map((f) => `${f.code} — ${f.label}${f.required ? ' (mandatory)' : ''}`).join('\n')
  );
}
