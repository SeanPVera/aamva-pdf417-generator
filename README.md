# AAMVA PDF417 Generator

A full client-side, standards-compliant PDF417 barcode generator for U.S. driver's licenses and identification cards (AAMVA DL/ID Specification Versions 01–10).  
Supports all 50 U.S. states through official IIN mappings.

Runs entirely in the browser.  
No server. No dependencies. No data leaves your machine.

---

## Features

- Supports **AAMVA Versions 01 through 10**
- Supports **all 50 U.S. states**
- Fully implemented **IIN table**
- Real-time PDF417 barcode preview
- Automatic field validators
- Dark mode UI
- Drag-and-drop JSON import
- Export to **PNG**
- Export to **PDF**
- 100% browser-based; no backend needed
- Optional **Electron desktop app**
- Clean, modular architecture

---

## Project Structure

```
aamva-pdf417-app/
│
├── index.html        # Application UI
├── app.js            # Live preview, validation, JSON import
├── aamva.js          # AAMVA schema + payload generator
├── main.js           # Electron desktop wrapper (optional)
├── package.json      # NPM/Electron metadata
├── .gitignore
├── README.md
│
├── lib/
│   └── pdf417.js     # Full PDF417 encoder implementation
│
└── assets/
    └── sample.json   # Example JSON import file
```

---

## Running in a Browser (Recommended)

Simply open:

```
index.html
```

Everything works locally. No installation, no dev server, nothing else required.

---

## Running as a Desktop App (Electron)

Install dependencies:

```bash
npm install
```

Start the Electron app:

```bash
npm start
```

---

## JSON Import Format

Drag a `.json` file onto the drop zone in the UI.

Example:

```json
{
  "state": "NY",
  "version": "08",
  "DAQ": "V12345678",
  "DCS": "VERA",
  "DAC": "SEAN",
  "DAD": "CNB",
  "DBB": "19900101",
  "DBA": "20300101",
  "DBD": "20200101",
  "DBC": "1",
  "DAU": "070",
  "DAY": "BRN",
  "DAG": "123 FAKE STREET",
  "DAI": "NEW YORK",
  "DAJ": "NY",
  "DAK": "10001"
}
```

Any fields present that match the chosen AAMVA version will automatically populate the form.

---

## Exporting PNG or PDF

- **Export PNG:** Saves the barcode as a PNG image.
- **Export PDF:** Generates a PDF with the barcode embedded (via jsPDF).

---

## Technologies Used

- Vanilla JavaScript
- PDF417 Encoder (MIT-licensed standalone JavaScript)
- jsPDF (PDF export)
- Electron (optional desktop app)

---

## Disclaimer

This project is provided for:

- Development  
- Research  
- Machine-readable standards testing  
- Educational use  

You are responsible for complying with all applicable laws related to identification documents in your jurisdiction.

Misuse may be illegal. Use responsibly.

---

## License

MIT License  
© 2025 Sean Vera

---

## Contributing

Pull requests are welcome.  
Open an issue to propose new features or report bugs.

---

## Notes

This project was built with an unhealthy level of attention to bureaucratic detail and a slightly unhinged dedication to the AAMVA spec.  
Enjoy responsibly.
