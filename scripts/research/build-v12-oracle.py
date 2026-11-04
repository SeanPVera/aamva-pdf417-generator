"""Independent CDS 2026 framing oracle. Does not import the production encoder.

These are synthetic standards tests, never issuer specimen or issued-card evidence.
The IIN table is a pinned snapshot of AAMVA's independently published registry.
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REGISTRY = json.loads((ROOT / "src/core/conformance/iin-registry-2026-10-31.json").read_text())
# The product's requested 55-jurisdiction scope. MP and diplomatic IDs are outside it.
CODES = "AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC AS GU PR VI".split()
IINS = {row["code"]: row["iin"] for row in REGISTRY["rows"]}
ORDER = "DCA DCB DCD DBA DCS DAC DAD DBD DBB DBC DAY DAU DAG DAI DAJ DAK DAQ DCF DCG DDE DDF DDG".split()
BASE = dict(DCA="D", DCB="NONE", DCD="NONE", DBA="10312030", DCS="SAMPLE", DAC="JANE", DAD="Q", DBD="10312026", DBB="02151990", DBC="2", DAY="BRO", DAU="067 IN", DAG="123 SAMPLE ST", DAI="ANYTOWN", DAK="941100000", DAQ="123456789", DCF="TEST00000001", DCG="USA", DDE="N", DDF="N", DDG="N")
vectors = []
for code in CODES:
    for kind in ["DL", "ID"]:
        values = {**BASE, "DAJ": code}
        values["DAQ"] = {"CA": "D1234567", "FL": "S123456789010", "TX": "12345678"}.get(code, values["DAQ"])
        order = [field for field in ORDER if kind == "DL" or field not in ["DCA", "DCB", "DCD"]]
        body = kind + "".join(field + values[field] + "\n" for field in order) + "\r"
        header = "@\n\x1e\rANSI " + IINS[code] + "120001"
        payload = header + kind + "0031" + f"{len(body.encode('ascii')):04d}" + body
        vectors.append({"state": code, "version": "12", "subfileType": kind, "input": {field: values[field] for field in order}, "expectedBytes": payload})
target = ROOT / "src/core/conformance/normative-v12-oracle.json"
target.write_text(json.dumps({"tier": "synthetic", "source": "scripts/research/build-v12-oracle.py", "standard": "https://www.aamva.org/getmedia/feab821e-baa5-4524-b865-3eb172b51acd/2026-DLID-Card-Design-Standard.pdf", "scope": "Independent Python construction from CDS 2026 Tables D.1-D.4; no production encoder imports. This does not establish any jurisdiction's issuance layout or version-12 adoption.", "vectors": vectors}, indent=2) + "\n")
print(f"Wrote {len(vectors)} independent synthetic DL/ID expectations")
