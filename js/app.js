/*
 * APP.JS — DELUXE AAMVA PDF417 GENERATOR
 * Wires the UI, AAMVA schemas, encoder, inspector, and tools.
 */

import {
  AAMVA_STATES,
  AAMVA_VERSIONS,
  AAMVA_UNKNOWN_FIELD_POLICY,
  getFieldsForVersion,
  describeVersion,
  validateFieldValue,
  buildPayloadObject,
  generateAAMVAPayload
} from "../aamva.js";

import { PDF417 } from "../lib/pdf417.js";
window.PDF417 = PDF417;


/* ============================================================
   GLOBALS
   ============================================================ */

let currentState = null;
let currentVersion = null;
let currentFields = [];

let historyStack = [];
let historyIndex = -1;


/* ============================================================
   INITIALIZATION
   ============================================================ */

window.addEventListener("DOMContentLoaded", () => {
  populateStateList();
  populateVersionList();
  hookEvents();
  renderInspectorBrowser();
});


/* ============================================================
   UI POPULATION
   ============================================================ */

function populateStateList() {
  const sel = document.getElementById("stateSelect");
  sel.innerHTML = "";

  Object.keys(AAMVA_STATES)
    .sort()
    .forEach(code => {
      const meta = AAMVA_STATES[code];
      const opt = document.createElement("option");

      if (meta === null) {
        opt.value = "";
        opt.textContent = `${code} (unsupported)`;
        opt.disabled = true;
      } else {
        opt.value = code;
        opt.textContent = code;
      }

      sel.appendChild(opt);
    });
}

function populateVersionList() {
  const sel = document.getElementById("versionSelect");
  sel.innerHTML = "";

  Object.keys(AAMVA_VERSIONS).forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = `${v} — ${AAMVA_VERSIONS[v].name}`;
    sel.appendChild(opt);
  });
}


/* ============================================================
   FIELD RENDERING
   ============================================================ */

function renderFields() {
  const wrap = document.getElementById("fields");
  wrap.innerHTML = "";

  if (!currentVersion) return;

  currentFields = getFieldsForVersion(currentVersion);

  currentFields.forEach(field => {
    const div = document.createElement("div");

    const label = document.createElement("label");
    label.textContent = `${field.code} — ${field.label}`;
    div.appendChild(label);

    const input = document.createElement("input");
    input.id = field.code;
    input.placeholder = field.label;
    div.appendChild(input);

    wrap.appendChild(div);
  });
}


/* ============================================================
   EVENT HANDLERS
   ============================================================ */

function hookEvents() {
  document.getElementById("stateSelect").addEventListener("change", e => {
    currentState = e.target.value;
    liveUpdate();
  });

  document.getElementById("versionSelect").addEventListener("change", e => {
    currentVersion = e.target.value;
    renderFields();
    liveUpdate();
  });

  const fieldsContainer = document.getElementById("fields");
  if (fieldsContainer) {
    fieldsContainer.addEventListener("input", () => {
      liveUpdate();
    });
  }

  document.getElementById("jsonFileInput").addEventListener("change", handleJSONImport);

  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);

  document.getElementById("themeSelect").addEventListener("change", e => {
    document.documentElement.dataset.theme = e.target.value;
  });

  document.getElementById("exportPngBtn").addEventListener("click", exportPNG);
  document.getElementById("exportPdfBtn").addEventListener("click", exportPDF);
  document.getElementById("exportSvgBtn").addEventListener("click", exportSVG);
}


/* ============================================================
   LIVE UPDATE
   ============================================================ */

function liveUpdate() {
  if (!currentState || !currentVersion) return;

  hideError();

  const payloadObj = buildPayloadObject(currentState, currentVersion, currentFields);

  if (!validateUnknownFields(payloadObj)) return;
  if (!validateFields(payloadObj)) return;

  const aamvaData = generateAAMVAPayload(currentState, currentVersion, currentFields, payloadObj);

  renderBarcode(aamvaData);
  renderDecoded(payloadObj);
  renderInspector(payloadObj, aamvaData);
  snapshotHistory(payloadObj);
}


/* ============================================================
   VALIDATION
   ============================================================ */

function validateUnknownFields(obj) {
  if (AAMVA_UNKNOWN_FIELD_POLICY !== "reject") return true;
  if (!obj) return true;

  const allowed = new Set(["state", "version", ...currentFields.map(f => f.code)]);

  for (const k of Object.keys(obj)) {
    if (!allowed.has(k)) {
      showError(`Unknown field: ${k}`);
      return false;
    }
  }
  return true;
}

function validateFields(obj) {
  for (const field of currentFields) {
    const val = obj[field.code] || "";
    if (!validateFieldValue(field, val)) {
      showError(`Invalid value for ${field.code}`);
      return false;
    }
  }
  return true;
}


/* ============================================================
   BARCODE RENDERING
   ============================================================ */

function renderBarcode(text) {
  const canvas = document.getElementById("barcodeCanvas");
  const ctx = canvas.getContext("2d");

  const matrix = window.PDF417.generate(text, { errorCorrectionLevel: 5 });

  const px = Math.ceil(window.devicePixelRatio || 1);
  const scale = 3 * px;

  canvas.width = matrix[0].length * scale;
  canvas.height = matrix.length * scale;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";
  matrix.forEach((row, y) => {
    row.forEach((bit, x) => {
      if (bit === 1) {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    });
  });
}


/* ============================================================
   DECODER
   ============================================================ */

function renderDecoded(obj) {
  const out = document.getElementById("decodedOutput");
  out.value = JSON.stringify(obj, null, 2);
}


/* ============================================================
   INSPECTOR PANES
   ============================================================ */

function renderInspector(obj, rawText) {
  document.getElementById("payloadInspector").value =
    JSON.stringify(obj, null, 2);

  const textToEncode = rawText || JSON.stringify(obj);
  const raw = window.PDF417.generate(textToEncode, { errorCorrectionLevel: 5 });
  document.getElementById("rawCodewords").value = raw.join(",");
}

function renderInspectorBrowser() {
  const sel = document.getElementById("versionBrowser");
  sel.innerHTML = "";

  Object.keys(AAMVA_VERSIONS).forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = `${v} — ${AAMVA_VERSIONS[v].name}`;
    sel.appendChild(opt);
  });

  sel.addEventListener("change", () => {
    document.getElementById("versionFields").value =
      describeVersion(sel.value);
  });
}


/* ============================================================
   EXPORTS
   ============================================================ */

function exportPNG() {
  const c = document.getElementById("barcodeCanvas");
  const a = document.createElement("a");
  a.href = c.toDataURL("image/png");
  a.download = "barcode.png";
  a.click();
}

function exportPDF() {
  const c = document.getElementById("barcodeCanvas");
  const img = c.toDataURL("image/png");

  const doc = new window.jspdf.jsPDF({
    unit: "pt",
    hotfixes: ["px_scaling"]
  });

  const w = 500;
  const h = (c.height / c.width) * w;

  doc.addImage(img, "PNG", 20, 20, w, h);
  doc.save("barcode.pdf");
}

function exportSVG() {
  alert("SVG exporter requires SVG support in encoder. Pending update.");
}


/* ============================================================
   JSON IMPORT
   ============================================================ */

async function handleJSONImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.name.endsWith(".json")) {
    showError("File is not JSON");
    return;
  }

  try {
    const text = await file.text();
    const json = JSON.parse(text);

    if (!validateUnknownFields(json)) return;

    if (!AAMVA_STATES[json.state]) {
      showError("Invalid state");
      return;
    }

    if (!AAMVA_VERSIONS[json.version]) {
      showError("Invalid version");
      return;
    }

    document.getElementById("stateSelect").value = json.state;
    document.getElementById("versionSelect").value = json.version;

    currentState = json.state;
    currentVersion = json.version;

    renderFields();

    currentFields.forEach(f => {
      const el = document.getElementById(f.code);
      el.value = json[f.code] || "";
    });

    liveUpdate();

  } catch (err) {
    showError("Invalid JSON");
  }
}


/* ============================================================
   UNDO / REDO
   ============================================================ */

function snapshotHistory(obj) {
  const snap = JSON.stringify(obj);
  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(snap);
  historyIndex = historyStack.length - 1;
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex--;
  restoreSnapshot(historyStack[historyIndex]);
}

function redo() {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex++;
  restoreSnapshot(historyStack[historyIndex]);
}

function restoreSnapshot(snap) {
  const json = JSON.parse(snap);

  currentState = json.state;
  currentVersion = json.version;

  document.getElementById("stateSelect").value = currentState;
  document.getElementById("versionSelect").value = currentVersion;

  renderFields();

  currentFields.forEach(f => {
    const el = document.getElementById(f.code);
    if(el) el.value = json[f.code] || "";
  });

  liveUpdate();
}


/* ============================================================
   ERROR MESSAGE UI
   ============================================================ */

function showError(msg) {
  const box = document.getElementById("errorBox");
  box.style.display = "block";
  box.textContent = msg;
}

function hideError() {
  const box = document.getElementById("errorBox");
  box.style.display = "none";
}

