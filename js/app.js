/*
 * APP.JS — DELUXE AAMVA PDF417 GENERATOR
 * Wires the UI, AAMVA schemas, encoder, inspector, and tools.
 */

// Helper to safely get globals
const AAMVA_STATES = window.AAMVA_STATES;
const AAMVA_VERSIONS = window.AAMVA_VERSIONS;
const AAMVA_UNKNOWN_FIELD_POLICY = window.AAMVA_UNKNOWN_FIELD_POLICY;
const getFieldsForVersion = window.getFieldsForVersion;
const describeVersion = window.describeVersion;
const validateFieldValue = window.validateFieldValue;
const buildPayloadObject = window.buildPayloadObject;
const generateAAMVAPayload = window.generateAAMVAPayload;

/* ============================================================
   GLOBALS
   ============================================================ */

let currentState = null;
let currentVersion = null;
let currentFields = [];

let historyStack = [];
let historyIndex = -1;
let isRestoringSnapshot = false;
let snapshotTimer = null;

// Last generated matrix (cached for sizer/export)
let lastMatrix = null;
let lastPayloadText = null;

// Barcode sizer state
const SIZE_PRESETS = {
  standard: { widthMM: 76, heightMM: 25 },
  compact:  { widthMM: 64, heightMM: 20 },
  large:    { widthMM: 89, heightMM: 32 }
};


/* ============================================================
   INITIALIZATION
   ============================================================ */

window.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("App initialization started.");

    // Diagnostic checks
    const missing = [];
    if (!window.AAMVA_STATES) missing.push("AAMVA_STATES (aamva.js)");
    if (!window.PDF417) missing.push("PDF417 (lib/pdf417.js)");
    if (!window.jspdf) missing.push("jspdf (lib/jspdf.umd.min.js)");

    if (missing.length > 0) {
      throw new Error("Missing dependencies: " + missing.join(", "));
    }

    populateStateList();
    populateVersionList();
    hookEvents();
    hookSizerEvents();
    hookKeyboardShortcuts();
    renderInspectorBrowser();
    restoreFromLocalStorage();
    updateSizerInfo();

    console.log("App initialization complete.");
  } catch (err) {
    console.error("Initialization Error:", err);
    showError("Startup Error: " + err.message);
  }
});


/* ============================================================
   UI POPULATION
   ============================================================ */

function populateStateList() {
  const sel = document.getElementById("stateSelect");
  sel.innerHTML = "";

  Object.keys(window.AAMVA_STATES)
    .sort()
    .forEach(code => {
      const meta = window.AAMVA_STATES[code];
      const opt = document.createElement("option");

      if (meta === null) {
        opt.value = "";
        opt.textContent = `${code} (unsupported)`;
        opt.disabled = true;
      } else {
        opt.value = code;
        opt.textContent = `${code} (v${meta.aamvaVersion})`;
      }

      sel.appendChild(opt);
    });
}

function populateVersionList() {
  const sel = document.getElementById("versionSelect");
  sel.innerHTML = "";

  Object.keys(window.AAMVA_VERSIONS).forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = `${v} — ${window.AAMVA_VERSIONS[v].name}`;
    sel.appendChild(opt);
  });
}


/* ============================================================
   FIELD RENDERING
   ============================================================ */

const FIELD_HINTS = {
  date: "Format: MMDDYYYY",
  zip:  "Format: 12345 or 12345-6789",
  char: "Single character (1=M, 2=F, 9=X)"
};

function renderFields() {
  const wrap = document.getElementById("fields");
  wrap.innerHTML = "";

  if (!currentVersion) return;

  currentFields = window.getFieldsForVersion(currentVersion);

  currentFields.forEach(field => {
    const div = document.createElement("div");
    if (field.required) div.classList.add("field-required");

    const label = document.createElement("label");
    label.textContent = `${field.code} — ${field.label}`;
    div.appendChild(label);

    const input = document.createElement("input");
    input.type = "text";
    input.id = field.code;
    input.placeholder = field.label;
    div.appendChild(input);

    // Add type hints for non-string fields
    const hint = FIELD_HINTS[field.type];
    if (hint) {
      const hintEl = document.createElement("div");
      hintEl.className = "field-hint";
      hintEl.textContent = hint;
      div.appendChild(hintEl);
    }

    wrap.appendChild(div);
  });
}


/* ============================================================
   EVENT HANDLERS
   ============================================================ */

function hookEvents() {
  document.getElementById("stateSelect").addEventListener("change", e => {
    currentState = e.target.value;

    // Auto-select the AAMVA version for this state
    const stateVersion = window.getVersionForState(currentState);
    if (stateVersion && window.AAMVA_VERSIONS[stateVersion]) {
      document.getElementById("versionSelect").value = stateVersion;
      currentVersion = stateVersion;
      renderFields();
    }

    liveUpdate();
    saveToLocalStorage();
  });

  document.getElementById("versionSelect").addEventListener("change", e => {
    currentVersion = e.target.value;
    renderFields();
    liveUpdate();
    saveToLocalStorage();
  });

  const fieldsContainer = document.getElementById("fields");
  if (fieldsContainer) {
    fieldsContainer.addEventListener("input", () => {
      liveUpdate();
      debounceSave();
    });
  }

  document.getElementById("jsonFileInput").addEventListener("change", handleJSONImport);

  document.getElementById("undoBtn").addEventListener("click", undo);
  document.getElementById("redoBtn").addEventListener("click", redo);

  document.getElementById("themeSelect").addEventListener("change", e => {
    document.documentElement.dataset.theme = e.target.value;
    try { localStorage.setItem("aamva_theme", e.target.value); } catch {}
  });

  document.getElementById("exportPngBtn").addEventListener("click", exportPNG);
  document.getElementById("exportPdfBtn").addEventListener("click", exportPDF);
  document.getElementById("exportSvgBtn").addEventListener("click", exportSVG);
}

function hookKeyboardShortcuts() {
  document.addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
      e.preventDefault();
      undo();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  });
}


/* ============================================================
   BARCODE SIZER
   ============================================================ */

function getSizerValues() {
  return {
    widthMM:       parseFloat(document.getElementById("barcodeWidthMM").value) || 76,
    heightMM:      parseFloat(document.getElementById("barcodeHeightMM").value) || 25,
    moduleWidthMil: parseFloat(document.getElementById("moduleWidthMil").value) || 15,
    dpi:           parseInt(document.getElementById("exportDPI").value, 10) || 300,
    quietZone:     parseInt(document.getElementById("quietZone").value, 10) || 2
  };
}

function hookSizerEvents() {
  const presetSel = document.getElementById("sizePreset");
  const widthInput = document.getElementById("barcodeWidthMM");
  const heightInput = document.getElementById("barcodeHeightMM");
  const moduleInput = document.getElementById("moduleWidthMil");
  const dpiInput = document.getElementById("exportDPI");
  const quietInput = document.getElementById("quietZone");
  const quietLabel = document.getElementById("quietZoneLabel");

  presetSel.addEventListener("change", () => {
    const preset = SIZE_PRESETS[presetSel.value];
    if (preset) {
      widthInput.value = preset.widthMM;
      heightInput.value = preset.heightMM;
    }
    updateSizerInfo();
    reRenderBarcode();
  });

  // When user manually edits dimensions, switch to custom preset
  const switchToCustom = () => {
    presetSel.value = "custom";
    updateSizerInfo();
    reRenderBarcode();
  };

  widthInput.addEventListener("input", switchToCustom);
  heightInput.addEventListener("input", switchToCustom);
  moduleInput.addEventListener("input", () => { updateSizerInfo(); reRenderBarcode(); });
  dpiInput.addEventListener("input", () => { updateSizerInfo(); reRenderBarcode(); });

  quietInput.addEventListener("input", () => {
    quietLabel.textContent = quietInput.value;
    updateSizerInfo();
    reRenderBarcode();
  });
}

function updateSizerInfo() {
  const info = document.getElementById("sizerInfo");
  if (!info) return;

  const s = getSizerValues();

  // Convert mm to inches
  const widthIn = (s.widthMM / 25.4).toFixed(2);
  const heightIn = (s.heightMM / 25.4).toFixed(2);

  // Module width: mil to mm
  const moduleWidthMM = (s.moduleWidthMil * 0.0254).toFixed(3);

  // Export pixel dimensions
  const exportWidthPx = Math.round((s.widthMM / 25.4) * s.dpi);
  const exportHeightPx = Math.round((s.heightMM / 25.4) * s.dpi);

  // How many modules fit in the width
  const modulesAcross = Math.floor(s.widthMM / (s.moduleWidthMil * 0.0254));

  info.innerHTML =
    `Physical: ${s.widthMM} x ${s.heightMM} mm (${widthIn}" x ${heightIn}")\n` +
    `Module: ${s.moduleWidthMil} mil (${moduleWidthMM} mm)\n` +
    `Export: ${exportWidthPx} x ${exportHeightPx} px @ ${s.dpi} DPI\n` +
    `Capacity: ~${modulesAcross} modules across\n` +
    `Quiet zone: ${s.quietZone} modules each side`;
}

function reRenderBarcode() {
  if (lastPayloadText) {
    renderBarcode(lastPayloadText);
  }
}


/* ============================================================
   LIVE UPDATE
   ============================================================ */

function liveUpdate() {
  if (!currentState || !currentVersion) return;

  hideError();

  try {
    const payloadObj = window.buildPayloadObject(currentState, currentVersion, currentFields);

    if (!validateUnknownFields(payloadObj)) return;
    if (!validateFields(payloadObj)) return;

    const aamvaData = generateAAMVAPayload(currentState, currentVersion, currentFields, payloadObj);

    renderBarcode(aamvaData);
    renderDecoded(payloadObj);
    renderInspector(payloadObj, aamvaData);
    snapshotHistory(payloadObj);
  } catch (err) {
    showError("Update Error: " + err.message);
  }
}


/* ============================================================
   VALIDATION
   ============================================================ */

// Strip control characters (except space) from field values
function sanitizeFieldValue(value) {
  // Remove ASCII control chars 0x00-0x1F (except space 0x20) and 0x7F
  return value.replace(/[\x00-\x1f\x7f]/g, "");
}

function validateUnknownFields(obj) {
  if (window.AAMVA_UNKNOWN_FIELD_POLICY !== "reject") return true;
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
    const raw = obj[field.code] || "";
    const val = sanitizeFieldValue(raw);

    // If sanitization changed the value, update the input
    if (val !== raw) {
      const el = document.getElementById(field.code);
      if (el) el.value = val;
      obj[field.code] = val;
    }

    if (!window.validateFieldValue(field, val)) {
      showError(`Invalid value for ${field.code} (${field.label})`);
      return false;
    }
  }
  return true;
}


/* ============================================================
   BARCODE RENDERING
   ============================================================ */

function renderBarcode(text) {
  lastPayloadText = text;

  const canvas = document.getElementById("barcodeCanvas");
  const ctx = canvas.getContext("2d");
  const dimLabel = document.getElementById("barcodeDimensions");

  const matrix = window.PDF417.generate(text, { errorCorrectionLevel: 5 });
  lastMatrix = matrix;

  const s = getSizerValues();
  const qz = s.quietZone;

  // Calculate scale based on physical dimensions and DPI
  // Module width in pixels at export DPI
  const moduleWidthPx = (s.moduleWidthMil / 1000) * s.dpi;

  // Total barcode modules wide (including quiet zones)
  const totalModulesWide = matrix[0].length + (qz * 2);
  const totalModulesHigh = matrix.length + (qz * 2);

  // For screen preview, use a scale that fits nicely
  const px = Math.ceil(window.devicePixelRatio || 1);
  const screenScale = Math.max(1, Math.round(moduleWidthPx * px / 2));

  const totalWidth = totalModulesWide * screenScale;
  const totalHeight = totalModulesHigh * screenScale;

  canvas.width = totalWidth;
  canvas.height = totalHeight;

  // White background (includes quiet zone)
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // Draw barcode with quiet zone offset
  ctx.fillStyle = "black";
  const offsetX = qz * screenScale;
  const offsetY = qz * screenScale;

  matrix.forEach((row, y) => {
    row.forEach((bit, x) => {
      if (bit === 1) {
        ctx.fillRect(offsetX + x * screenScale, offsetY + y * screenScale, screenScale, screenScale);
      }
    });
  });

  // Update dimension label
  if (dimLabel) {
    const exportW = Math.round((s.widthMM / 25.4) * s.dpi);
    const exportH = Math.round((s.heightMM / 25.4) * s.dpi);
    dimLabel.textContent = `${matrix[0].length} x ${matrix.length} modules | Export: ${exportW} x ${exportH} px @ ${s.dpi} DPI`;
  }
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
  const rawBytes = window.PDF417.raw(textToEncode);
  document.getElementById("rawCodewords").value = rawBytes.join(",");
}

function renderInspectorBrowser() {
  const sel = document.getElementById("versionBrowser");
  sel.innerHTML = "";

  Object.keys(window.AAMVA_VERSIONS).forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = `${v} — ${window.AAMVA_VERSIONS[v].name}`;
    sel.appendChild(opt);
  });

  sel.addEventListener("change", () => {
    document.getElementById("versionFields").value =
      window.describeVersion(sel.value);
  });

  // Show initial version description
  if (sel.value) {
    document.getElementById("versionFields").value =
      window.describeVersion(sel.value);
  }
}


/* ============================================================
   EXPORTS
   ============================================================ */

function buildExportCanvas() {
  if (!lastMatrix || !lastPayloadText) return null;

  const s = getSizerValues();
  const qz = s.quietZone;

  // Target pixel dimensions from physical size + DPI
  const exportWidthPx = Math.round((s.widthMM / 25.4) * s.dpi);
  const exportHeightPx = Math.round((s.heightMM / 25.4) * s.dpi);

  const canvas = document.createElement("canvas");
  canvas.width = exportWidthPx;
  canvas.height = exportHeightPx;
  const ctx = canvas.getContext("2d");

  // White background
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, exportWidthPx, exportHeightPx);

  // Calculate module size to fit the barcode within the export area
  const totalModulesWide = lastMatrix[0].length + (qz * 2);
  const totalModulesHigh = lastMatrix.length + (qz * 2);

  const moduleW = exportWidthPx / totalModulesWide;
  const moduleH = exportHeightPx / totalModulesHigh;

  ctx.fillStyle = "black";
  const offsetX = qz * moduleW;
  const offsetY = qz * moduleH;

  lastMatrix.forEach((row, y) => {
    row.forEach((bit, x) => {
      if (bit === 1) {
        ctx.fillRect(
          Math.round(offsetX + x * moduleW),
          Math.round(offsetY + y * moduleH),
          Math.ceil(moduleW),
          Math.ceil(moduleH)
        );
      }
    });
  });

  return canvas;
}

function exportPNG() {
  if (!currentState || !currentVersion) return;

  const exportCanvas = buildExportCanvas();
  if (!exportCanvas) return;

  const a = document.createElement("a");
  a.href = exportCanvas.toDataURL("image/png");
  a.download = `barcode_${currentState}_${currentVersion}.png`;
  a.click();
}

function exportPDF() {
  if (!currentState || !currentVersion) return;

  const exportCanvas = buildExportCanvas();
  if (!exportCanvas) return;

  const s = getSizerValues();
  const img = exportCanvas.toDataURL("image/png");

  // Convert mm to points (1mm = 2.835pt)
  const wPt = s.widthMM * 2.835;
  const hPt = s.heightMM * 2.835;

  const doc = new window.jspdf.jsPDF({
    unit: "pt",
    hotfixes: ["px_scaling"]
  });

  // Center the barcode with some margin
  doc.addImage(img, "PNG", 20, 20, wPt, hPt);
  doc.save(`barcode_${currentState}_${currentVersion}.pdf`);
}

function exportSVG() {
  if (!currentState || !currentVersion) return;

  try {
    const payloadObj = window.buildPayloadObject(currentState, currentVersion, currentFields);
    const aamvaData = generateAAMVAPayload(currentState, currentVersion, currentFields, payloadObj);
    const { svg } = window.PDF417.generateSVG(aamvaData, { errorCorrectionLevel: 5, scale: 3 });

    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcode_${currentState}_${currentVersion}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showError("SVG Export Error: " + err.message);
  }
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

    if (!window.AAMVA_STATES[json.state]) {
      showError("Invalid state");
      return;
    }

    if (!window.AAMVA_VERSIONS[json.version]) {
      showError("Invalid version");
      return;
    }

    // Set version first so currentFields is correct for unknown field validation
    document.getElementById("stateSelect").value = json.state;
    document.getElementById("versionSelect").value = json.version;

    currentState = json.state;
    currentVersion = json.version;

    renderFields();

    if (!validateUnknownFields(json)) return;

    currentFields.forEach(f => {
      const el = document.getElementById(f.code);
      if (el) el.value = json[f.code] || "";
    });

    liveUpdate();
    saveToLocalStorage();

  } catch (err) {
    showError("Invalid JSON");
  }
}


/* ============================================================
   UNDO / REDO
   ============================================================ */

function snapshotHistory(obj) {
  if (isRestoringSnapshot) return;
  clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => {
    const snap = JSON.stringify(obj);
    // Avoid duplicate consecutive snapshots
    if (historyStack[historyIndex] === snap) return;
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(snap);
    historyIndex = historyStack.length - 1;
  }, 500);
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
  isRestoringSnapshot = true;
  try {
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
  } finally {
    isRestoringSnapshot = false;
  }
}


/* ============================================================
   LOCAL STORAGE PERSISTENCE
   ============================================================ */

const LS_KEY = "aamva_form_data";
let saveTimer = null;

function debounceSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToLocalStorage, 1000);
}

function saveToLocalStorage() {
  try {
    const data = {
      state: currentState,
      version: currentVersion,
      fields: {}
    };
    currentFields.forEach(f => {
      const el = document.getElementById(f.code);
      if (el) data.fields[f.code] = el.value;
    });
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch {}
}

function restoreFromLocalStorage() {
  try {
    // Restore theme
    const savedTheme = localStorage.getItem("aamva_theme");
    if (savedTheme) {
      document.documentElement.dataset.theme = savedTheme;
      document.getElementById("themeSelect").value = savedTheme;
    }

    // Restore form data
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      // No saved data — initialize from dropdown defaults
      const stateSelect = document.getElementById("stateSelect");
      const versionSelect = document.getElementById("versionSelect");
      if (stateSelect.value) {
        currentState = stateSelect.value;
        // Auto-select version for the default state
        const stateVersion = window.getVersionForState(currentState);
        if (stateVersion && window.AAMVA_VERSIONS[stateVersion]) {
          versionSelect.value = stateVersion;
          currentVersion = stateVersion;
        }
      }
      if (currentVersion) {
        renderFields();
      }
      return;
    }

    const data = JSON.parse(raw);

    if (data.state && window.AAMVA_STATES[data.state]) {
      document.getElementById("stateSelect").value = data.state;
      currentState = data.state;
    }

    if (data.version && window.AAMVA_VERSIONS[data.version]) {
      document.getElementById("versionSelect").value = data.version;
      currentVersion = data.version;
    }

    renderFields();

    if (data.fields) {
      currentFields.forEach(f => {
        const el = document.getElementById(f.code);
        if (el && data.fields[f.code] !== undefined) {
          el.value = data.fields[f.code];
        }
      });
    }

    liveUpdate();
  } catch {
    // If restore fails, initialize from defaults
    const stateSelect = document.getElementById("stateSelect");
    const versionSelect = document.getElementById("versionSelect");
    if (stateSelect.value) {
      currentState = stateSelect.value;
      const stateVersion = window.getVersionForState(currentState);
      if (stateVersion && window.AAMVA_VERSIONS[stateVersion]) {
        versionSelect.value = stateVersion;
        currentVersion = stateVersion;
      }
    }
    if (currentVersion) {
      renderFields();
    }
  }
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
