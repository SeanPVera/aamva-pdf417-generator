global.window = global;
global.bwipjs = require('./lib/bwip-js.min.js');
require('./aamva.js');

const fields = window.getFieldsForVersion("01");
const dataObj = { state: "VA", version: "01" };
fields.forEach(f => { dataObj[f.code] = ""; });

// Fill V01 mandatory fields
dataObj.DAA = "DOE,JOHN,M";
dataObj.DAG = "123 MAIN ST";
dataObj.DAI = "RICHMOND";
dataObj.DAJ = "VA";
dataObj.DAK = "23220";
dataObj.DAQ = "T12345678";

// Current code expects MMDDYYYY
dataObj.DBA = "12312030";
dataObj.DBB = "01151990";
dataObj.DBC = "1";

try {
  const payload = window.generateAAMVAPayload("VA", "01", fields, dataObj);
  console.log("Generated Payload V01:");
  console.log(payload);

  // Check for date format in payload
  if (payload.includes("DBB01151990")) {
    console.log("CONFIRMED: V01 uses MMDDYYYY");
  } else {
    console.log("V01 uses something else");
  }

} catch (e) {
  console.error(e);
}
