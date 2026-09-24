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
  let closedQuote = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
          closedQuote = true;
        }
      } else {
        cell += ch;
      }
      continue;
    }

    if (closedQuote && ch !== delimiter && ch !== "\n" && ch !== "\r")
      throw new Error("Unexpected text after a closing CSV quote.");
    if (ch === '"') {
      if (cell.length) throw new Error("A CSV quote must start a field.");
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
      closedQuote = false;
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      closedQuote = false;
    } else if (ch !== "\r") {
      cell += ch;
    }
  }

  // Flush whatever the last line left behind.
  if (inQuotes) throw new Error("Unclosed quoted CSV field.");
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
  if (new Set(headers).size !== headers.length) throw new Error("Duplicate CSV column headers.");

  const rows = grid.slice(1).map((cells) => {
    if (cells.length > headers.length) throw new Error("CSV row has more columns than its header.");
    const record: Record<string, string> = {};
    headers.forEach((header, idx) => {
      if (!header) return;
      const raw = cells[idx] ?? "";
      const value = header.startsWith("Z") ? raw : raw.trim();
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

/** A human-readable report is opened in spreadsheets; untrusted cells must not execute formulas. */
export function toSafeReportCsv(
  headers: string[],
  rows: Array<Record<string, string | number>>
): string {
  const safe = (value: string | number) =>
    typeof value === "string" && /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
  return toCsv(
    headers,
    rows.map((row) =>
      Object.fromEntries(Object.entries(row).map(([key, value]) => [key, safe(value)]))
    )
  );
}
