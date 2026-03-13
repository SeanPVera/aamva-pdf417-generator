export interface AAMVAStateDef {
  IIN: string;
  name: string;
  aamvaVersion: string;
  supported?: boolean;
}

export const AAMVA_STATES: Record<string, AAMVAStateDef> = {
  AL: { IIN: '636033', name: 'Alabama', aamvaVersion: '09' },
  AK: { IIN: '636059', name: 'Alaska', aamvaVersion: '09' },
  AZ: { IIN: '636026', name: 'Arizona', aamvaVersion: '10' },
  AR: { IIN: '636021', name: 'Arkansas', aamvaVersion: '09' },
  CA: { IIN: '636014', name: 'California', aamvaVersion: '10' },
  CO: { IIN: '636020', name: 'Colorado', aamvaVersion: '10' },
  CT: { IIN: '636006', name: 'Connecticut', aamvaVersion: '09' },
  DE: { IIN: '636011', name: 'Delaware', aamvaVersion: '09' },
  FL: { IIN: '636010', name: 'Florida', aamvaVersion: '10' },
  GA: { IIN: '636055', name: 'Georgia', aamvaVersion: '10' },
  HI: { IIN: '636047', name: 'Hawaii', aamvaVersion: '10' },
  ID: { IIN: '636050', name: 'Idaho', aamvaVersion: '09' },
  IL: { IIN: '636035', name: 'Illinois', aamvaVersion: '10' },
  IN: { IIN: '636037', name: 'Indiana', aamvaVersion: '09' },
  IA: { IIN: '636018', name: 'Iowa', aamvaVersion: '09' },
  KS: { IIN: '636022', name: 'Kansas', aamvaVersion: '09' },
  KY: { IIN: '636046', name: 'Kentucky', aamvaVersion: '09' },
  LA: { IIN: '636007', name: 'Louisiana', aamvaVersion: '09' },
  ME: { IIN: '636041', name: 'Maine', aamvaVersion: '09' },
  MD: { IIN: '636003', name: 'Maryland', aamvaVersion: '10' },
  MA: { IIN: '636002', name: 'Massachusetts', aamvaVersion: '09' },
  MI: { IIN: '636032', name: 'Michigan', aamvaVersion: '10' },
  MN: { IIN: '636038', name: 'Minnesota', aamvaVersion: '09' },
  MS: { IIN: '636051', name: 'Mississippi', aamvaVersion: '09' },
  MO: { IIN: '636030', name: 'Missouri', aamvaVersion: '09' },
  MT: { IIN: '636008', name: 'Montana', aamvaVersion: '09' },
  NE: { IIN: '636054', name: 'Nebraska', aamvaVersion: '10' },
  NV: { IIN: '636049', name: 'Nevada', aamvaVersion: '09' },
  NH: { IIN: '636039', name: 'New Hampshire', aamvaVersion: '09' },
  NJ: { IIN: '636036', name: 'New Jersey', aamvaVersion: '10' },
  NM: { IIN: '636009', name: 'New Mexico', aamvaVersion: '09' },
  NY: { IIN: '636001', name: 'New York', aamvaVersion: '10' },
  NC: { IIN: '636004', name: 'North Carolina', aamvaVersion: '10' },
  ND: { IIN: '636034', name: 'North Dakota', aamvaVersion: '09' },
  OH: { IIN: '636023', name: 'Ohio', aamvaVersion: '10' },
  OK: { IIN: '636058', name: 'Oklahoma', aamvaVersion: '09' },
  OR: { IIN: '636029', name: 'Oregon', aamvaVersion: '10' },
  PA: { IIN: '636025', name: 'Pennsylvania', aamvaVersion: '10' },
  RI: { IIN: '636052', name: 'Rhode Island', aamvaVersion: '09' },
  SC: { IIN: '636005', name: 'South Carolina', aamvaVersion: '10' },
  SD: { IIN: '636042', name: 'South Dakota', aamvaVersion: '09' },
  TN: { IIN: '636053', name: 'Tennessee', aamvaVersion: '09' },
  TX: { IIN: '636015', name: 'Texas', aamvaVersion: '10' },
  UT: { IIN: '636040', name: 'Utah', aamvaVersion: '09' },
  VT: { IIN: '636024', name: 'Vermont', aamvaVersion: '09' },
  VA: { IIN: '636000', name: 'Virginia', aamvaVersion: '10' },
  WA: { IIN: '636045', name: 'Washington', aamvaVersion: '10' },
  WV: { IIN: '636061', name: 'West Virginia', aamvaVersion: '09' },
  WI: { IIN: '636031', name: 'Wisconsin', aamvaVersion: '10' },
  WY: { IIN: '636060', name: 'Wyoming', aamvaVersion: '09' },
  DC: { IIN: '636043', name: 'District of Columbia', aamvaVersion: '10' },

  // US Territories (now enabled/supported)
  AS: { IIN: '604427', name: 'American Samoa', aamvaVersion: '09', supported: true },
  GU: { IIN: '636019', name: 'Guam', aamvaVersion: '09', supported: true },
  VI: { IIN: '636062', name: 'US Virgin Islands', aamvaVersion: '09', supported: true },
  PR: { IIN: '604431', name: 'Puerto Rico', aamvaVersion: '09', supported: true },
};

export function isJurisdictionSupported(stateCode: string): boolean {
  const stateDef = AAMVA_STATES[stateCode];
  if (!stateDef) return false;
  return stateDef.supported !== false;
}

export function getVersionForState(stateCode: string): string | null {
  const stateDef = AAMVA_STATES[stateCode];
  if (!stateDef) return null;
  return stateDef.aamvaVersion || '10';
}
