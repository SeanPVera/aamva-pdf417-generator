export interface QuickFillPreset {
  id: string;
  label: string;
  description: string;
  state: string;
  version: string;
  fields: Record<string, string>;
}

export const QUICK_FILL_PRESETS: QuickFillPreset[] = [
  {
    id: "ca-dl-adult",
    label: "CA DL — Adult",
    description: "California Driver's License, adult sample profile",
    state: "CA",
    version: "10",
    fields: {
      DCS: "DOE",
      DAC: "JOHN",
      DAD: "MICHAEL",
      DBB: "06151985",
      DBA: "06152030",
      DBD: "06152022",
      DBC: "1",
      DAU: "070 IN",
      DAY: "BRO",
      DAG: "1234 MAIN ST",
      DAI: "LOS ANGELES",
      DAJ: "CA",
      DAK: "900010000",
      DCG: "USA",
      DCF: "AB1234567890",
      DAQ: "D1234567",
      DCA: "C",
      DCB: "NONE",
      DCD: "NONE"
    }
  },
  {
    id: "tx-id-young",
    label: "TX ID — Young Adult",
    description: "Texas Identification Card, young adult sample",
    state: "TX",
    version: "10",
    fields: {
      DCS: "GARCIA",
      DAC: "MARIA",
      DAD: "ELENA",
      DBB: "03222003",
      DBA: "03222029",
      DBD: "03222024",
      DBC: "2",
      DAU: "065 IN",
      DAY: "HAZ",
      DAG: "456 OAK AVE",
      DAI: "AUSTIN",
      DAJ: "TX",
      DAK: "787010000",
      DCG: "USA",
      DCF: "TX9876543210",
      DAQ: "12345678",
      DCA: "NONE",
      DCB: "NONE",
      DCD: "NONE"
    }
  },
  {
    id: "ny-dl-adult",
    label: "NY DL — Adult",
    description: "New York Driver's License, sample adult profile",
    state: "NY",
    version: "10",
    fields: {
      DCS: "SMITH",
      DAC: "EMILY",
      DAD: "JANE",
      DBB: "11041990",
      DBA: "11042032",
      DBD: "11042024",
      DBC: "2",
      DAU: "066 IN",
      DAY: "BLU",
      DAG: "789 BROADWAY",
      DAI: "NEW YORK",
      DAJ: "NY",
      DAK: "100010000",
      DCG: "USA",
      DCF: "NY1122334455",
      DAQ: "123456789",
      DCA: "D",
      DCB: "NONE",
      DCD: "NONE"
    }
  },
  {
    id: "fl-dl-senior",
    label: "FL DL — Senior",
    description: "Florida Driver's License, senior sample profile",
    state: "FL",
    version: "10",
    fields: {
      DCS: "JOHNSON",
      DAC: "ROBERT",
      DAD: "LEE",
      DBB: "08121955",
      DBA: "08122029",
      DBD: "08122024",
      DBC: "1",
      DAU: "071 IN",
      DAY: "GRY",
      DAG: "321 PALM DR",
      DAI: "MIAMI",
      DAJ: "FL",
      DAK: "331010000",
      DCG: "USA",
      DCF: "FL5566778899",
      DAQ: "J123456789012",
      DCA: "E",
      DCB: "NONE",
      DCD: "NONE"
    }
  },
  {
    id: "wa-dl-cdl",
    label: "WA DL — Commercial",
    description: "Washington Driver's License, commercial endorsement sample",
    state: "WA",
    version: "10",
    fields: {
      DCS: "ANDERSON",
      DAC: "DAVID",
      DAD: "WAYNE",
      DBB: "01171978",
      DBA: "01172030",
      DBD: "01172025",
      DBC: "1",
      DAU: "073 IN",
      DAY: "GRN",
      DAG: "654 CEDAR LN",
      DAI: "SEATTLE",
      DAJ: "WA",
      DAK: "981010000",
      DCG: "USA",
      DCF: "WA9988776655",
      DAQ: "ANDERDW123L4",
      DCA: "A",
      DCB: "H",
      DCD: "T"
    }
  }
];
