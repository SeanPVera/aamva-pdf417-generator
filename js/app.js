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
const isJurisdictionSupported = window.isJurisdictionSupported;

/* ============================================================
   GLOBALS
   ============================================================ */

let currentState = null;
let currentVersion = null;
let currentFields = [];
let currentAllowedFieldSet = new Set(["state", "version"]);

let historyStack = [];
let historyIndex = -1;
let isRestoringSnapshot = false;
let snapshotTimer = null;

// Last payload text (cached for sizer/export)
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
    if (!window.bwipjs) missing.push("bwipjs (lib/bwip-js.min.js)");
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

      if (meta === null || (isJurisdictionSupported && !isJurisdictionSupported(code))) {
        opt.value = "";
        opt.textContent = `${code} (unsupported)`;
        opt.disabled = true;
      } else {
        opt.value = code;
        opt.textContent = `${code} — ${meta.name} (v${meta.aamvaVersion})`;
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

// Hints shown below non-dropdown, non-date fields. Date fields use the
// input placeholder (formatPlaceholder) to convey MMDDYYYY vs YYYYMMDD.
const FIELD_HINTS = {
  zip:  "Format: 12345 or 12345-6789",
  char: "Single character"
};

function renderFields(preserveValues) {
  const wrap = document.getElementById("fields");

  // Capture existing field values before clearing
  const savedValues = {};
  if (preserveValues && currentFields.length > 0) {
    currentFields.forEach(f => {
      const el = document.getElementById(f.code);
      if (el && el.value) savedValues[f.code] = el.value;
    });
  }

  wrap.innerHTML = "";

  if (!currentVersion) return;

  currentFields = window.getFieldsForVersion(currentVersion);
  currentAllowedFieldSet = new Set(["state", "version", ...currentFields.map(f => f.code)]);

  currentFields.forEach(field => {
    const div = document.createElement("div");
    if (field.required) div.classList.add("field-required");

    const label = document.createElement("label");
    label.setAttribute("for", field.code);
    label.textContent = `${field.code} — ${field.label}`;
    div.appendChild(label);

    // Prefer field-specific options if available (e.g. sex codes in V01)
    const options = field.options || (window.AAMVA_FIELD_OPTIONS && window.AAMVA_FIELD_OPTIONS[field.code]);
    const maxLen = window.AAMVA_FIELD_LIMITS && window.AAMVA_FIELD_LIMITS[field.code];

    if (options) {
      // Render as dropdown for constrained fields
      const select = document.createElement("select");
      select.id = field.code;
      select.setAttribute("aria-label", field.label);

      const emptyOpt = document.createElement("option");
      emptyOpt.value = "";
      emptyOpt.textContent = `Select ${field.label}...`;
      select.appendChild(emptyOpt);

      options.forEach(opt => {
        const optEl = document.createElement("option");
        optEl.value = opt.value;
        optEl.textContent = opt.label;
        select.appendChild(optEl);
      });

      div.appendChild(select);
    } else if (field.type === "date") {
      // Render date field with both text input and date picker
      const inputWrap = document.createElement("div");
      inputWrap.className = "date-field-wrap";

      const formatPlaceholder = field.dateFormat || "MMDDYYYY";

      const input = document.createElement("input");
      input.type = "text";
      input.id = field.code;
      input.placeholder = formatPlaceholder;
      input.setAttribute("aria-label", field.label);
      input.pattern = "\\d{8}";
      if (maxLen) input.maxLength = maxLen;
      inputWrap.appendChild(input);

      const picker = document.createElement("input");
      picker.type = "date";
      picker.className = "date-picker";
      picker.setAttribute("aria-label", `${field.label} date picker`);
      picker.addEventListener("change", () => {
        if (picker.value) {
          // Input is always YYYY-MM-DD from the date input
          const [y, m, d] = picker.value.split("-");

          if (field.dateFormat === "YYYYMMDD") {
            input.value = y + m + d;
          } else {
            // Default MMDDYYYY
            input.value = m + d + y;
          }

          input.dispatchEvent(new Event("input", { bubbles: true }));
        }
      });
      inputWrap.appendChild(picker);

      div.appendChild(inputWrap);
    } else {
      const input = document.createElement("input");
      input.type = "text";
      input.id = field.code;
      input.placeholder = field.label;
      input.setAttribute("aria-label", field.label);
      if (maxLen) input.maxLength = maxLen;
      div.appendChild(input);
    }

    // Add type hints for non-dropdown, non-date fields
    if (!options && field.type !== "date") {
      const hint = FIELD_HINTS[field.type];
      if (hint) {
        const hintEl = document.createElement("div");
        hintEl.className = "field-hint";
        hintEl.textContent = hint;
        div.appendChild(hintEl);
      }
    }

    // Show max length hint for free-text fields
    if (!options && maxLen && field.type !== "date") {
      const lenHint = document.createElement("div");
      lenHint.className = "field-hint";
      lenHint.textContent = `Max length: ${maxLen}`;
      div.appendChild(lenHint);
    }

    wrap.appendChild(div);
  });

  // Restore saved values for fields that still exist
  if (preserveValues) {
    for (const [code, val] of Object.entries(savedValues)) {
      const el = document.getElementById(code);
      if (el) el.value = val;
    }
  }
}


/* ============================================================
   AUTO-FILL DERIVABLE FIELDS
   ============================================================ */

function autoFillStateFields(stateCode) {
  const stateDef = window.AAMVA_STATES[stateCode];
  if (!stateDef) return;

  // Auto-fill jurisdiction code (DAJ) with state code
  const daj = document.getElementById("DAJ");
  if (daj && !daj.value) daj.value = stateCode;

  // Auto-fill country (DCG) with USA
  const dcg = document.getElementById("DCG");
  if (dcg && !dcg.value) dcg.value = "USA";

  // Auto-fill truncation indicators with "N" (Not Truncated) defaults
  ["DDE", "DDF", "DDG"].forEach(code => {
    const el = document.getElementById(code);
    if (el && !el.value) el.value = "N";
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
      renderFields(true);
      autoFillStateFields(currentState);
    }

    liveUpdate();
    saveToLocalStorage();
  });

  document.getElementById("versionSelect").addEventListener("change", e => {
    currentVersion = e.target.value;
    renderFields(true);
    liveUpdate();
    saveToLocalStorage();
  });

  document.getElementById("complianceMode").addEventListener("change", e => {
    liveUpdate();
    saveToLocalStorage();
  });

  const fieldsContainer = document.getElementById("fields");
  if (fieldsContainer) {
    fieldsContainer.addEventListener("input", () => {
      scheduleLiveUpdate();
      debounceSave();
    });
    fieldsContainer.addEventListener("change", () => {
      scheduleLiveUpdate();
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
  document.getElementById("exportJsonBtn").addEventListener("click", exportJSON);
  document.getElementById("clearFormBtn").addEventListener("click", clearForm);

  // Copy-to-clipboard buttons
  document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const el = document.getElementById(targetId);
      if (el && el.value) {
        navigator.clipboard.writeText(el.value).then(() => {
          const orig = btn.textContent;
          btn.textContent = "Copied!";
          setTimeout(() => { btn.textContent = orig; }, 1500);
        }).catch(() => {
          // Fallback: select text
          el.select();
          document.execCommand("copy");
        });
      }
    });
  });

  // Drag-and-drop JSON import on sidebar
  const sidebar = document.getElementById("sidebar");
  sidebar.addEventListener("dragover", e => {
    e.preventDefault();
    sidebar.classList.add("drag-over");
  });
  sidebar.addEventListener("dragleave", () => {
    sidebar.classList.remove("drag-over");
  });
  sidebar.addEventListener("drop", e => {
    e.preventDefault();
    sidebar.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) {
      // Reuse the file import handler
      const fakeEvent = { target: { files: [file] } };
      handleJSONImport(fakeEvent);
    }
  });
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

  info.textContent =
    `Physical: ${s.widthMM} x ${s.heightMM} mm (${widthIn}" x ${heightIn}")\n` +
    `Module: ${s.moduleWidthMil} mil (${moduleWidthMM} mm)\n` +
    `Export: ${exportWidthPx} x ${exportHeightPx} px @ ${s.dpi} DPI\n` +
    `Capacity: ~${modulesAcross} modules across\n` +
    `Quiet zone: ${s.quietZone} modules each side`;
}

let reRenderRaf = null;

function reRenderBarcode() {
  if (!lastPayloadText) return;
  if (reRenderRaf !== null) return;

  reRenderRaf = requestAnimationFrame(() => {
    reRenderRaf = null;
    renderBarcode(lastPayloadText);
  });
}


/* ============================================================
   LIVE UPDATE
   ============================================================ */

let liveUpdateRaf = null;

function scheduleLiveUpdate() {
  if (liveUpdateRaf !== null) return;
  liveUpdateRaf = requestAnimationFrame(() => {
    liveUpdateRaf = null;
    liveUpdate();
  });
}

function liveUpdate() {
  if (!currentState || !currentVersion) return;

  hideError();

  const isStrict = document.getElementById("complianceMode").checked;

  try {
    const payloadObj = window.buildPayloadObject(currentState, currentVersion, currentFields);

    if (!validateUnknownFields(payloadObj)) return;
    if (!validateFields(payloadObj)) return;

    const aamvaData = generateAAMVAPayload(currentState, currentVersion, currentFields, payloadObj, {
        autoGenerateDiscriminator: true,
        strictMode: isStrict
    });

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

  for (const k of Object.keys(obj)) {
    if (!currentAllowedFieldSet.has(k)) {
      showError(`Unknown field: ${k}`);
      return false;
    }
  }
  return true;
}

function validateFields(obj) {
  let firstError = null;
  const isStrict = document.getElementById("complianceMode").checked;

  for (const field of currentFields) {
    const raw = obj[field.code] || "";
    const val = sanitizeFieldValue(raw);

    // If sanitization changed the value, update the input
    if (val !== raw) {
      const el = document.getElementById(field.code);
      if (el) el.value = val;
      obj[field.code] = val;
    }

    const el = document.getElementById(field.code);
    const isValid = window.validateFieldValue(field, val, currentState, isStrict);

    // Apply visual indicators
    if (el) {
      el.classList.remove("field-valid", "field-invalid");
      if (val) {
        el.classList.add(isValid ? "field-valid" : "field-invalid");
      }
    }

    if (!isValid && !firstError) {
      const maxLen = window.AAMVA_FIELD_LIMITS && window.AAMVA_FIELD_LIMITS[field.code];
      if (maxLen && val.length > maxLen) {
        firstError = `${field.code} (${field.label}) exceeds max length of ${maxLen}`;
      } else {
        firstError = `Invalid value for ${field.code} (${field.label})`;
      }
    }
  }

  if (firstError) {
    showError(firstError);
    return false;
  }
  return true;
}


/* ============================================================
   BARCODE RENDERING
   ============================================================ */

function getPDF417Layout(s) {
  const moduleWidthMM = (s.moduleWidthMil * 0.0254);
  const targetModules = s.widthMM / moduleWidthMM;
  // Overhead: Start(17) + Left(17) + Right(17) + Stop(18) = 69 modules
  let columns = Math.floor((targetModules - 69) / 17);
  if (columns < 1) columns = 1;
  if (columns > 30) columns = 30;
  return { columns };
}

function renderBarcode(text) {
  lastPayloadText = text;

  const canvas = document.getElementById("barcodeCanvas");
  const dimLabel = document.getElementById("barcodeDimensions");
  const s = getSizerValues();
  const { columns } = getPDF417Layout(s);

  // For screen preview, use a simple scale.
  const screenScale = 2;

  // AAMVA typically recommends error correction level 3-5.
  // Standard defaults to 5 in this codebase, which is robust.
  // In strict compliance mode, we can ensure it's within a specific range if required,
  // but AAMVA spec often suggests "at least level 3" or similar.
  // We'll stick to 5 as a safe compliant default.
  // However, we should ensure aspect ratio logic (columns) remains compliant.
  // AAMVA DL/ID cards usually have 2 to 4 rows, but variable length.
  // PDF417 aspect ratio is controlled by rows/cols.
  // bwip-js calculates rows automatically based on text length and columns.

  try {
    bwipjs.toCanvas(canvas, {
      bcid:          'pdf417',
      text:          text,
      scale:         screenScale,
      columns:       columns,
      eclevel:       5, // AAMVA standard recommendation is typically 3+
      compact:       false,
      paddingwidth:  s.quietZone,
      paddingheight: s.quietZone,
    });

    // Update dimension label
    // bwipjs doesn't return matrix size easily.
    // We can infer from canvas width/height and scale.
    const modulesW = Math.floor(canvas.width / screenScale);
    const modulesH = Math.floor(canvas.height / screenScale);

    if (dimLabel) {
      const exportW = Math.round((s.widthMM / 25.4) * s.dpi);
      const exportH = Math.round((s.heightMM / 25.4) * s.dpi);
      dimLabel.textContent = `~${modulesW} x ~${modulesH} modules | Export: ${exportW} x ${exportH} px @ ${s.dpi} DPI`;
    }

  } catch (e) {
    console.error("Barcode render error:", e);
    // Draw error on canvas
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.font = "12px sans-serif";
    ctx.fillText("Render Error", 10, 20);
  }
}


/* ============================================================
   DECODER
   ============================================================ */

function renderDecoded(obj) {
  const out = document.getElementById("decodedOutput");

  // Use the decoder's field mapper if available for human-readable output
  if (window.AAMVA_DECODER && obj.version) {
    const decoded = window.AAMVA_DECODER.decode(JSON.stringify(obj));
    if (decoded.ok && decoded.mapped) {
      out.value = decoded.mapped;
      return;
    }
  }

  out.value = JSON.stringify(obj, null, 2);
}


/* ============================================================
   INSPECTOR PANES
   ============================================================ */

function renderInspector(obj, rawText) {
  document.getElementById("payloadInspector").value =
    JSON.stringify(obj, null, 2);

  // bwip-js abstracts codeword generation, so we don't display raw codewords.
  document.getElementById("rawCodewords").value = "Raw codewords inspection not available with new encoder.";
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
  if (!lastPayloadText) return null;
  const s = getSizerValues();

  // Create canvas
  const canvas = document.createElement("canvas");

  const { columns } = getPDF417Layout(s);

  // Calculate scale for export DPI
  const scale = (s.moduleWidthMil / 1000) * s.dpi;

  try {
    bwipjs.toCanvas(canvas, {
      bcid:          'pdf417',
      text:          lastPayloadText,
      scale:         scale,
      columns:       columns,
      eclevel:       5, // Consistent with preview
      compact:       false,
      paddingwidth:  s.quietZone,
      paddingheight: s.quietZone,
    });
    return canvas;
  } catch (e) {
    showError("Export Error: " + e.message);
    return null;
  }
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
    const aamvaData = generateAAMVAPayload(currentState, currentVersion, currentFields, payloadObj, { autoGenerateDiscriminator: true });

    // SVG export
    const s = getSizerValues();
    const { columns } = getPDF417Layout(s);
    const svg = bwipjs.toSVG({
        bcid:          'pdf417',
        text:          aamvaData,
        scale:         3,
        columns:       columns,
        eclevel:       5, // Consistent with preview
        compact:       false,
        paddingwidth:  s.quietZone,
        paddingheight: s.quietZone,
    });

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

function exportJSON() {
  if (!currentState || !currentVersion) return;

  try {
    const payloadObj = window.buildPayloadObject(currentState, currentVersion, currentFields);
    const json = JSON.stringify(payloadObj, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aamva_${currentState}_${currentVersion}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    showError("JSON Export Error: " + err.message);
  }
}

function clearForm() {
  currentFields.forEach(f => {
    const el = document.getElementById(f.code);
    if (el) el.value = "";
  });

  // Clear canvas
  const canvas = document.getElementById("barcodeCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Clear output panes
  const paneIds = ["decodedOutput", "rawCodewords", "payloadInspector"];
  paneIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  // Clear dimension label
  const dimLabel = document.getElementById("barcodeDimensions");
  if (dimLabel) dimLabel.textContent = "";

  // Reset cached state
  lastPayloadText = null;

  hideError();
  saveToLocalStorage();
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

const HISTORY_MAX = 100;

function snapshotHistory(obj) {
  if (isRestoringSnapshot) return;
  clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => {
    const snap = JSON.stringify(obj);
    // Avoid duplicate consecutive snapshots
    if (historyStack[historyIndex] === snap) return;
    historyStack = historyStack.slice(0, historyIndex + 1);
    historyStack.push(snap);
    // Cap history size to prevent unbounded memory growth
    if (historyStack.length > HISTORY_MAX) {
      historyStack = historyStack.slice(historyStack.length - HISTORY_MAX);
    }
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
      fields: {},
      strictMode: document.getElementById("complianceMode").checked
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
        autoFillStateFields(currentState);
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

    if (data.strictMode !== undefined) {
      document.getElementById("complianceMode").checked = data.strictMode;
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
  box.setAttribute("role", "alert");
}

function hideError() {
  const box = document.getElementById("errorBox");
  box.style.display = "none";
}
