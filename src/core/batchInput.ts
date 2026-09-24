import { parseBatchTable, type ParsedTable } from "./csv";

export const MAX_BATCH_BYTES = 5_000_000;
export const MAX_BATCH_ROWS = 1000;
/** Bound allocation and reject rows that the preview cannot safely represent. */
export function parseBatchInput(text: string): ParsedTable {
  if (text.length > MAX_BATCH_BYTES) throw new Error("Batch files are limited to 5 MB.");
  const clean = text.replace(/^\uFEFF/, "");
  let result: ParsedTable;
  if (clean.trimStart().startsWith("[")) {
    const raw: unknown = JSON.parse(clean);
    if (
      !Array.isArray(raw) ||
      raw.some((row) => !row || typeof row !== "object" || Array.isArray(row))
    )
      throw new Error("Each JSON batch row must be a record object.");
    if (raw.some((row) => Object.values(row).some((value) => typeof value !== "string")))
      throw new Error("Batch values must be text. Numeric identifiers can lose leading zeros.");
    result = {
      headers: [...new Set(raw.flatMap((row) => Object.keys(row)))],
      rows: raw,
      unknownHeaders: []
    };
  } else result = parseBatchTable(clean);
  if (result.rows.length === 0)
    throw new Error("No data rows found. The first CSV line must be a header of field codes.");
  if (result.rows.length > MAX_BATCH_ROWS)
    throw new Error("Batch files are limited to 1000 records.");
  return result;
}
