import {
  AAMVA_STATES,
  AAMVA_VERSIONS,
  buildAAMVAPayload
} from "./aamva.js";

let currentFields = [];

window.addEventListener("DOMContentLoaded", () => {
  populateStateList();
  populateVersionList();
  renderFieldsForVersion("08");

  document.getElementById("state").addEventListener("change", liveUpdate);
  document.getElementById("version").addEventListener("change", e =>
    renderFieldsForVersion(e.target.value)
  );

  document.getElementById("generateBtn").addEventListener("click", generate);
  document.getElementById("exportPNG").addEventListener("click", exportPNG);
  document.getElementById("exportPDF").addEventListener("click", exportPDF);

  setupDropZone();
});

/* -----------------------------
   Populate state & version lists
   ----------------------------- */

function populateStateList() {
  const stateSelect = document.getElementById("state");
  Object.keys(AAMVA_STATES).forEach(code => {
    const op = document.createElement("option");
    op.value = code;
    op.textContent = code;
    stateSelect.appendChild(op);
  });
}

function populateVersionList() {
  const versionSelect = document.getElementById("version");
  Object.keys(AAMVA_VERSIONS).forEach(v => {
    const op = document.createElement("option");
    op.value = v;
    op.textContent = v;
    versionSelect.appendChild(op);
  });
}

/* -----------------------------
   Render fields based on version
   ----------------------------- */

function renderFieldsForVersion(version) {
  const container = document.getElementById("fieldContainer");
  container.innerHTML = "";

  const schema = AAMVA_VERSIONS[version];
  currentFields = schema.fields;

  schema.fields.forEach(field => {
    const wrap = document.createElement("div");

    const label = document.createElement("label");
    label.textContent = `${field.code}${field.required ? " *" : ""}`;

    const input = document.createElement("input");
    input.id = field.code;
    input.dataset.required = field.required;
    input.addEventListener("input", liveUpdate);

    wrap.appendChild(label);
    wrap.appendChild(input);
    container.appendChild(wrap);
  });

  liveUpdate();
}

/* -----------------------------
   Collect all field values
   ----------------------------- */

function collectInput() {
  const data = {};
  currentFields.forEach(field => {
    const el = document.getElementById(field.code);
    if (el && el.value.trim() !== "") {
      data[field.code] = el.value.trim();
    }
  });
  return data;
}

/* -----------------------------
   Validators for required fields
   ----------------------------- */

function validateFields() {
  let valid = true;

  currentFields.forEach(field => {
    const el = document.getElementById(field.code);
    const value = el.value.trim();

    // Required field check
    if (field.required && !value) {
      el.classList.add("invalid");
      valid = false;
      return;
    } else {
      el.classList.remove("invalid");
    }

    // Date fields (YYYYMMDD)
    if (["DBB", "DBA", "DBD"].includes(field.code)) {
      if (value && !/^\d{8}$/.test(value)) {
        el.classList.add("invalid");
        valid = false;
        return;
      }
    }

    // ZIP code (5 or 9 digits)
    if (field.code === "DAK") {
      if (value && !/^\d{5}(-\d{4})?$/.test(value)) {
        el.classList.add("invalid");
        valid = false;
        return;
      }
    }
  });

  return valid;
}

/* -----------------------------
   Live preview
   ----------------------------- */

function liveUpdate() {
  if (!validateFields()) return;

  try {
    const payload = buildAAMVAPayload(
      collectInput(),
      document.getElementById("state").value,
      document.getElementById("version").value
    );

    renderPDF417(payload);
    document.getElementById("payloadBox").textContent = payload;

  } catch (err) {
    // Ignore errors during live editing
  }
}

/* -----------------------------
   Manual generate button
   ----------------------------- */

function generate() {
  if (!validateFields()) {
    alert("Please fix invalid fields before generating.");
    return;
  }
  liveUpdate();
}

/* -----------------------------
   PDF417 barcode renderer
   ----------------------------- */

function renderPDF417(payload) {
  const canvas = document.getElementById("barcode");
  const ctx = canvas.getContext("2d");

  const barcode = PDF417.generate(payload, { errorCorrectionLevel: 5 });
  const scale = 2;

  canvas.width = barcode[0].length * scale;
  canvas.height = barcode.length * scale;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "black";

  barcode.forEach((row, y) => {
    row.forEach((bit, x) => {
      if (bit) ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });
}

/* -----------------------------
   PNG Export
   ----------------------------- */

function exportPNG() {
  const canvas = document.getElementById("barcode");
  const url = canvas.toDataURL("image/png");

  const a = document.createElement("a");
  a.href = url;
  a.download = "barcode.png";
  a.click();
}

/* -----------------------------
   PDF Export
   ----------------------------- */

function exportPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const canvas = document.getElementById("barcode");
  const img = canvas.toDataURL("image/png");

  doc.addImage(img, "PNG", 15, 15, 180, 60);
  doc.save("barcode.pdf");
}

/* -----------------------------
   Drag & Drop JSON Importer
   ----------------------------- */

function setupDropZone() {
  const dz = document.getElementById("dropZone");

  ["dragenter", "dragover"].forEach(evt => {
    dz.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
      dz.style.borderColor = "#ff50bf";
      dz.style.color = "#ffb0f0";
    });
  });

  ["dragleave", "drop"].forEach(evt => {
    dz.addEventListener(evt, e => {
      e.preventDefault();
      e.stopPropagation();
      dz.style.borderColor = "#555";
      dz.style.color = "#aaa";
    });
  });

  dz.addEventListener("drop", async e => {
    const file = e.dataTransfer.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      applyJsonToForm(json);
    } catch (err) {
      alert("Invalid JSON file.");
    }
  });
}

function applyJsonToForm(json) {
  if (json.state) {
    document.getElementById("state").value = json.state;
  }
  if (json.version) {
    document.getElementById("version").value = json.version;
    renderFieldsForVersion(json.version);
  }

  currentFields.forEach(field => {
    if (json[field.code] !== undefined) {
      document.getElementById(field.code).value = json[field.code];
    }
  });

  liveUpdate();
}
