// Minimal RFC 4180-ish CSV/TSV handling for the batch processor. Written by
// hand rather than pulled from npm: the batch input is a flat table of AAMVA
// field codes with no nesting, and the app ships a bundle-size budget.

export interface ParsedTable {
  headers: string[];
  rows: Record<string, string>[];
  /** Header cells that are not valid AAMVA field codes or known control keys. */
  unknownHeaders: string[];
}

/** Control columns the batch processor understands alongside field codes. */
export const BATCH_CONTROL_COLUMNS = ["state", "version", "subfileType"] as const;

const FIELD_CODE_RE = /^[A-Z]{2}[A-Z0-9]$/;

/** Picks the delimiter by counting candidates in the header line. */
export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const semis = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  if (tabs >= commas && tabs >= semis && tabs > 0) return "\t";
  if (semis > commas) return ";";
  return ",";
}

/**
 * Splits delimited text into rows of cells, honouring double-quoted fields
 * (including embedded delimiters, newlines, and "" escapes).
 */
export function splitDelimited(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  // Flush whatever the last line left behind.
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // Drop trailing blank lines produced by a file that ends with a newline.
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

/**
 * Parses a CSV/TSV batch file whose header row holds AAMVA field codes plus the
 * `state` / `version` / `subfileType` control columns. Header cells are
 * normalized: field codes are upper-cased, control columns are matched
 * case-insensitively.
 */
export function parseBatchTable(text: string, delimiter?: string): ParsedTable {
  const grid = splitDelimited(text, delimiter ?? detectDelimiter(text));
  const headerRow = grid[0];
  if (!headerRow) return { headers: [], rows: [], unknownHeaders: [] };

  const controlByLower = new Map<string, string>(
    BATCH_CONTROL_COLUMNS.map((c) => [c.toLowerCase(), c])
  );

  const headers = headerRow.map((raw) => {
    const trimmed = raw.trim();
    const control = controlByLower.get(trimmed.toLowerCase());
    return control ?? trimmed.toUpperCase();
  });

  const unknownHeaders = headers.filter(
    (h) => !FIELD_CODE_RE.test(h) && !BATCH_CONTROL_COLUMNS.includes(h as never)
  );

  const rows = grid.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      const value = (cells[idx] ?? "").trim();
      if (value) record[header] = value;
    });
    return record;
  });

  return { headers, rows, unknownHeaders };
}

/** Quotes a cell only when it would otherwise break the row. */
function quoteCell(value: string, delimiter: string): string {
  const needsQuotes =
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r") ||
    value.includes(delimiter);
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/** Serializes rows to CSV text, using `headers` for both order and the header row. */
export function toCsv(
  headers: string[],
  rows: Array<Record<string, string | number>>,
  delimiter = ","
): string {
  const lines = [headers.map((h) => quoteCell(h, delimiter)).join(delimiter)];
  for (const row of rows) {
    lines.push(headers.map((h) => quoteCell(String(row[h] ?? ""), delimiter)).join(delimiter));
  }
  return lines.join("\r\n");
}
