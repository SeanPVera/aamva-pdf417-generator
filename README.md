# AAMVA PDF417 Generator

A full client-side, standards-compliant PDF417 barcode generator for U.S. driver's licenses and identification cards.

This application runs entirely in your browser using vanilla JavaScript. It requires **no server, no backend, and no installation** to use. It supports all 50 U.S. states and implements AAMVA DL/ID Card Design Standards (Versions 01, 04, and 07–10).

> **Note**: This tool is for educational, research, and testing purposes only. You are responsible for complying with all applicable laws.

---

## Features

- **No Installation Required**: Just open `index.html`.
- **100% Client-Side**: No data leaves your computer.
- **AAMVA Standard Support**: Implements versions 01, 04, 07, 08, 09, and 10.
- **State Mappings**: Includes IIN mappings for all 50 U.S. states.
- **Barcode Generation**: Real-time PDF417 generation using a custom byte-mode encoder.
- **Export Options**: Save barcodes as PNG images or PDF documents.
- **Developer Tools**:
  - **Payload Inspector**: View the raw JSON data structure.
  - **Raw Codewords**: Inspect the encoded PDF417 codewords.
  - **Decoder**: Built-in logic to decode and describe payload fields.
- **JSON Import**: Drag and drop JSON files to pre-fill the form.
- **Desktop App**: Optional Electron wrapper for a native desktop experience.

---

## Project Structure

```
aamva-pdf417-app/
│
├── index.html        # Main entry point (UI)
├── main.js           # Electron entry point (desktop app)
├── preload.js        # Electron preload script
├── package.json      # NPM/Electron metadata
├── README.md
│
├── js/
│   └── app.js        # Main UI logic (wires inputs to generator)
│
├── aamva.js          # AAMVA schema definitions (Versions, Fields, States)
├── decoder.js        # Payload decoder and field describer
│
├── lib/
│   ├── pdf417.js     # PDF417 encoder implementation
│   └── jspdf.umd.min.js # PDF generation library
│
└── assets/
    └── sample.json   # Example JSON import file
```

---

## Getting Started

### Option 1: Run in Browser (Recommended)

1.  Download or clone this repository.
2.  Open `index.html` in any modern web browser (Chrome, Firefox, Edge, Safari).
3.  That's it. No build step required.

### Option 2: Run as Desktop App (Electron)

If you prefer a standalone application window:

1.  Install [Node.js](https://nodejs.org/).
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the app:
    ```bash
    npm start
    ```

---

## Developer Guide

The project is built with modularity in mind, separating the UI logic from the AAMVA schema definitions and the barcode encoding.

### Architecture

1.  **`aamva.js`**: This is the core logic file. It contains:
    *   `AAMVA_STATES`: A map of state codes (e.g., "NY") to their IIN (Issuer Identification Number).
    *   `AAMVA_VERSIONS`: Definitions for AAMVA versions (e.g., "08", "10"), specifying which fields are required.
    *   `generateAAMVAPayload()`: The function that constructs the compliant string (header, subfile directory, data elements).
2.  **`lib/pdf417.js`**: A standalone PDF417 encoder. It accepts a string and returns a matrix of 1s and 0s (bars and spaces).
3.  **`js/app.js`**: The controller. It listens to UI events, calls `generateAAMVAPayload()`, and then passes the result to `PDF417.generate()`.
4.  **`decoder.js`**: Contains logic to parse a raw JSON payload and "describe" it (map codes like "DCS" to "Last Name"). Accessible via the console or internal tools.

### Modifying the Schema

To add support for a new AAMVA version or modify an existing one, edit `aamva.js`.

#### Adding a New Version

Find the `AAMVA_VERSIONS` object in `aamva.js` and add a new entry:

```javascript
"11": {
  name: "Version 2025 (Hypothetical)",
  fields: [
    { code: "DCS", label: "Last Name", type: "string", required: true },
    { code: "DAC", label: "First Name", type: "string", required: true },
    // ... add other fields
  ]
}
```

#### Adding/Modifying States

Find the `AAMVA_STATES` object in `aamva.js`:

```javascript
TX: { IIN: "636042", jurisdictionVersion: 8 },
```

*   **IIN**: The 6-digit Issuer Identification Number.
*   **jurisdictionVersion**: The version number specific to that jurisdiction (often encoded in the header).

### Manual Verification

You can verify the output using the built-in tools in the UI:

1.  **Decoded Output**: Shows the JSON representation of the current form data.
2.  **Payload Inspector**: Shows the exact string being sent to the barcode encoder.
3.  **Console Debugging**: You can access the `AAMVA_DECODER` tool in the browser console:
    ```javascript
    // In DevTools Console
    const payload = document.getElementById("decodedOutput").value;
    console.log(window.AAMVA_DECODER.decode(payload));
    ```

---

## License

MIT License. See `LICENSE` (if available) or `package.json` for details.

© 2025 Sean Vera
