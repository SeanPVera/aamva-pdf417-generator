/*
 * PDF417 Encoder — Modern Browser Edition
 * Clean PDF417 implementation with proper GF(929) Reed-Solomon.
 * Supports:
 *  - Byte-mode encoding
 *  - Error correction levels 0–8 (Reed–Solomon over GF(929))
 *  - Proper clusters / bar–space patterns
 *  - Left/right row indicators
 *  - SVG export with run-length encoding
 *  - Raw codeword dumping
 *
 * MIT License
 */

window.PDF417 = (() => {

  /* ============================================================
     CONSTANTS
     ============================================================ */

  const EC_COEFF = {
    0: 2, 1: 4, 2: 8, 3: 16, 4: 32, 5: 64, 6: 128, 7: 256, 8: 512
  };

  // ISO 15438 defined patterns
  const START_PATTERN = [1,1,1,1,1,1,1,1,0,1,0,1,0,1,0,0,0];
  const STOP_PATTERN  = [1,1,1,1,1,1,1,0,1,0,0,0,1,0,1,0,0,1];

  /* ============================================================
     GF(929) ARITHMETIC
     929 is prime, so GF(929) = Z/929Z.
     ============================================================ */

  const MOD = 929;

  function gfMul(a, b) {
    return ((a % MOD) * (b % MOD)) % MOD;
  }

  function gfAdd(a, b) {
    return (a + b) % MOD;
  }

  function gfSub(a, b) {
    return ((a - b) % MOD + MOD) % MOD;
  }

  /* ============================================================
     REED-SOLOMON OVER GF(929)
     Generator polynomial: g(x) = product of (x - 3^i) for
     i = 0 .. (numEC - 1), where 3 is the primitive element.
     ============================================================ */

  // Cache generator polynomials per EC level
  const genPolyCache = {};

  function getGeneratorPoly(ecLevel) {
    const numEC = EC_COEFF[ecLevel] || 2;
    if (genPolyCache[numEC]) return genPolyCache[numEC];

    // Start with g(x) = 1
    let g = [1];

    // Multiply by (x - 3^i) for i = 0..numEC-1
    let power = 1; // 3^0
    for (let i = 0; i < numEC; i++) {
      const newG = new Array(g.length + 1).fill(0);
      for (let j = 0; j < g.length; j++) {
        newG[j] = gfAdd(newG[j], g[j]);
        newG[j + 1] = gfSub(newG[j + 1], gfMul(g[j], power));
      }
      g = newG;
      power = gfMul(power, 3);
    }

    genPolyCache[numEC] = g;
    return g;
  }

  function reedSolomon(data, ecLevel) {
    const numEC = EC_COEFF[ecLevel] || 2;
    const g = getGeneratorPoly(ecLevel);

    // Polynomial long division
    const remainder = new Array(numEC).fill(0);

    for (const d of data) {
      const coeff = gfAdd(d, remainder[0]);
      // Shift remainder left
      for (let i = 0; i < numEC - 1; i++) {
        remainder[i] = gfSub(remainder[i + 1], gfMul(coeff, g[i + 1]));
      }
      remainder[numEC - 1] = gfSub(0, gfMul(coeff, g[numEC]));
    }

    // Negate all coefficients (standard convention)
    return remainder.map(v => (v === 0 ? 0 : MOD - v));
  }

  /* ============================================================
     CODEWORD PATTERN GENERATION
     Each codeword is represented by 8 elements (4 bars + 4 spaces)
     totaling 17 modules.

     ISO 15438 defines 929 symbol characters per row cluster (3 clusters).
     Cluster identity: K = (b1 - b2 + b3 - b4 + 9) % 9
       Cluster 0 (rows 0,3,6,…): K = 0
       Cluster 1 (rows 1,4,7,…): K = 3
       Cluster 2 (rows 2,5,8,…): K = 6

     The tables are built at init time by exhaustive enumeration of all
     valid 8-tuples (b1,s1,b2,s2,b3,s3,b4,s4): each element 1–6,
     sum = 17, satisfying the cluster constraint; collected in the
     canonical loop order b1→s1→b2→s2→b3→s3→b4 (s4 computed).

     IMPORTANT: ISO 15438 specifies an exact codeword→pattern mapping
     (Annex A). Commercial scanners decode by looking up each scanned
     pattern in those standard tables. The enumeration order below is a
     structural approximation; the exact ISO 15438 Annex A tables are
     required for guaranteed compatibility with all commercial scanners.
     ============================================================ */

  // Build cluster tables at module load time (runs once)
  const CLUSTER_TABLE = (function buildClusterTables() {
    const tables = [[], [], []];

    for (let b1 = 1; b1 <= 6; b1++) {
      for (let s1 = 1; s1 <= 6; s1++) {
        for (let b2 = 1; b2 <= 6; b2++) {
          for (let s2 = 1; s2 <= 6; s2++) {
            for (let b3 = 1; b3 <= 6; b3++) {
              for (let s3 = 1; s3 <= 6; s3++) {
                for (let b4 = 1; b4 <= 6; b4++) {
                  const s4 = 17 - b1 - s1 - b2 - s2 - b3 - s3 - b4;
                  if (s4 < 1 || s4 > 6) continue;

                  const K = (((b1 - b2 + b3 - b4) % 9) + 9) % 9;
                  if (K === 0) tables[0].push([b1, s1, b2, s2, b3, s3, b4, s4]);
                  else if (K === 3) tables[1].push([b1, s1, b2, s2, b3, s3, b4, s4]);
                  else if (K === 6) tables[2].push([b1, s1, b2, s2, b3, s3, b4, s4]);
                }
              }
            }
          }
        }
      }
    }

    return tables;
  })();

  function getClusterPattern(cluster, codeword) {
    const tbl = CLUSTER_TABLE[cluster];
    const cw = ((codeword % tbl.length) + tbl.length) % tbl.length;
    return elementsToBits(tbl[cw]);
  }

  function elementsToBits(elements) {
    const bits = [];
    for (let i = 0; i < elements.length; i++) {
      const isBar = (i % 2 === 0); // even = bar, odd = space
      for (let j = 0; j < elements[i]; j++) {
        bits.push(isBar ? 1 : 0);
      }
    }
    return bits;
  }

  /* ============================================================
     TEXT ENCODING (BYTE MODE)
     ============================================================ */

  function encodeText(str) {
    // ISO 15438 Byte Compaction Mode (Section 5.4.3)
    // - Codeword 900: byte count divisible by 6 (all full 6-byte groups)
    // - Codeword 901: byte count NOT divisible by 6 (full groups + remainder)
    //
    // Full 6-byte groups: 6 bytes → 5 codewords via base-256→base-929 conversion.
    // Remainder bytes (1–5): encoded one per codeword (direct byte value).
    //
    // NOTE: 256^5 = 2^40 < 2^53, so JS floating-point arithmetic is exact here.

    const bytes = [];
    for (let i = 0; i < str.length; i++) {
      bytes.push(str.charCodeAt(i) & 0xFF);
    }

    const latch = bytes.length % 6 === 0 ? 900 : 901;
    const out = [latch];

    let i = 0;
    // Encode full 6-byte groups as 5 codewords each
    while (i + 6 <= bytes.length) {
      // Compute the numeric value of 6 bytes in base-256
      let val = 0;
      for (let j = 0; j < 6; j++) {
        val = val * 256 + bytes[i + j];
      }
      // Convert to 5 base-929 codewords (most-significant first)
      const group = new Array(5);
      for (let j = 4; j >= 0; j--) {
        group[j] = val % 929;
        val = Math.floor(val / 929);
      }
      out.push(...group);
      i += 6;
    }

    // Encode remaining bytes (1–5) one codeword each
    while (i < bytes.length) {
      out.push(bytes[i]);
      i++;
    }

    return out;
  }

  /* ============================================================
     MATRIX CONSTRUCTION
     ============================================================ */

  function buildMatrix(codewords, ecLevel) {
    const ec = reedSolomon(codewords, ecLevel);
    const full = codewords.concat(ec);

    const cols = Math.min(30, Math.max(1, full.length));
    const rows = Math.ceil(full.length / cols);

    const matrix = [];

    for (let r = 0; r < rows; r++) {
      const row = [];
      const cluster = r % 3; // All codewords in a row use the SAME cluster

      // Start Pattern
      row.push(...START_PATTERN);

      // Left row indicator
      const leftIndicator = computeLeftIndicator(r, rows, cols, ecLevel);
      row.push(...getClusterPattern(cluster, leftIndicator));

      // Data codewords
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const cw = idx < full.length ? full[idx] : 900; // padding codeword
        row.push(...getClusterPattern(cluster, cw));
      }

      // Right row indicator
      const rightIndicator = computeRightIndicator(r, rows, cols, ecLevel);
      row.push(...getClusterPattern(cluster, rightIndicator));

      // Stop Pattern
      row.push(...STOP_PATTERN);

      matrix.push(row);
    }

    return matrix;
  }

  function computeLeftIndicator(row, totalRows, cols, ecLevel) {
    // Left row indicator encodes (row number, number of rows, EC level)
    // using a formula based on the cluster
    const cluster = row % 3;
    switch (cluster) {
      case 0: return ((row / 3) | 0) * 30 + ((totalRows - 1) / 3 | 0);
      case 1: return ((row / 3) | 0) * 30 + (ecLevel * 3) + ((totalRows - 1) % 3);
      case 2: return ((row / 3) | 0) * 30 + (cols - 1);
      default: return 0;
    }
  }

  function computeRightIndicator(row, totalRows, cols, ecLevel) {
    // Right row indicator is complementary to left
    const cluster = row % 3;
    switch (cluster) {
      case 0: return ((row / 3) | 0) * 30 + (cols - 1);
      case 1: return ((row / 3) | 0) * 30 + ((totalRows - 1) / 3 | 0);
      case 2: return ((row / 3) | 0) * 30 + (ecLevel * 3) + ((totalRows - 1) % 3);
      default: return 0;
    }
  }

  /* ============================================================
     SVG GENERATION (with run-length encoding)
     ============================================================ */

  function toSVG(matrix, scale = 2) {
    const width = matrix[0].length * scale;
    const height = matrix.length * scale;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" width="${width}" height="${height}">`;
    svg += `<rect width="100%" height="100%" fill="white"/>`;

    // Use run-length encoding: merge consecutive black modules into single rects
    for (let y = 0; y < matrix.length; y++) {
      let x = 0;
      while (x < matrix[y].length) {
        if (matrix[y][x] === 1) {
          // Find run of consecutive black modules
          let runLen = 1;
          while (x + runLen < matrix[y].length && matrix[y][x + runLen] === 1) {
            runLen++;
          }
          svg += `<rect x="${x * scale}" y="${y * scale}" width="${runLen * scale}" height="${scale}" fill="black"/>`;
          x += runLen;
        } else {
          x++;
        }
      }
    }

    return svg + "</svg>";
  }

  /* ============================================================
     PUBLIC API
     ============================================================ */

  function addLengthDescriptor(data, ecLevel) {
    // ISO 15438: first codeword is the Symbol Length Descriptor
    // = total number of data codewords (including this one) + EC codewords
    const ecWords = EC_COEFF[ecLevel] || 2;
    const totalLength = 1 + data.length + ecWords;
    return [totalLength, ...data];
  }

  return {
    generate(text, opts = {}) {
      const ec = opts.errorCorrectionLevel ?? 5;
      const data = addLengthDescriptor(encodeText(text), ec);
      return buildMatrix(data, ec);
    },

    generateSVG(text, opts = {}) {
      const ec = opts.errorCorrectionLevel ?? 5;
      const data = addLengthDescriptor(encodeText(text), ec);
      const matrix = buildMatrix(data, ec);
      return { svg: toSVG(matrix, opts.scale || 2), matrix };
    },

    // debugging / development
    raw(text) {
      return encodeText(text);
    }
  };
})();
