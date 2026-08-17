import React from "react";
import { useFormStore } from "./useFormStore";
import {
  generateAAMVAPayload,
  generateStateCardRevisionDate,
  generateStateDiscriminator
} from "../core/generator";
import { getFieldsForStateAndVersion } from "../core/schema";

/** How long to wait after the last edit before re-encoding. */
export const PAYLOAD_DEBOUNCE_MS = 300;

export interface PayloadResult {
  /** The generated AAMVA string, or "" when generation failed. */
  payload: string;
  /** Generator error message, or null. */
  error: string | null;
  /**
   * True between an edit and the debounced re-encode. While stale, `payload`
   * still holds the *previous* result — callers must not copy, export, or
   * present it as current.
   */
  stale: boolean;
}

/**
 * Owns payload generation for the whole app.
 *
 * This used to live inside BarcodePreview, which forced two workarounds: the
 * keyboard shortcuts scraped the rendered DOM to find the payload (breaking
 * whenever the Raw Payload section was collapsed, since collapsing unmounts the
 * textarea), and nothing knew the preview was mid-debounce, so exports stayed
 * enabled while the canvas showed a barcode one keystroke out of date.
 *
 * Hoisting it into App gives both the panel and the shortcuts one source of
 * truth, and makes the debounce window observable.
 */
export function usePayload(): PayloadResult {
  const state = useFormStore((s) => s.state);
  const version = useFormStore((s) => s.version);
  const fields = useFormStore((s) => s.fields);
  const strictMode = useFormStore((s) => s.strictMode);
  const subfileType = useFormStore((s) => s.subfileType);

  // Identifies the inputs a result was produced from. Comparing the current
  // signature against the computed one derives staleness at render time, with
  // no setState in the effect body.
  const signature = React.useMemo(
    () => JSON.stringify([state, version, strictMode, subfileType, fields]),
    [state, version, strictMode, subfileType, fields]
  );

  const [result, setResult] = React.useState<{
    payload: string;
    error: string | null;
    signature: string | null;
  }>({ payload: "", error: null, signature: null });

  // Values the app invents on the user's behalf when the field is left empty.
  // They are cached rather than re-rolled per encode: the generator used to
  // mint a fresh one on every debounce, so the document discriminator inside
  // the barcode changed on every keystroke and two exports of an unchanged form
  // disagreed. DCF is stable for as long as the jurisdiction is; DDB is keyed
  // on the issue date it is derived from, so it stays consistent with it.
  const autoRef = React.useRef<{ dcfKey: string; dcf: string; ddbKey: string; ddb: string }>({
    dcfKey: "",
    dcf: "",
    ddbKey: "",
    ddb: ""
  });

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        const schemaFields = getFieldsForStateAndVersion(state, version);
        const present = new Set(schemaFields.map((f) => f.code));
        const auto = autoRef.current;
        const data: Record<string, string> = { ...fields, DAJ: state };

        if (present.has("DCF") && !data.DCF) {
          // Keyed on the issue date as well as the jurisdiction: some issuers
          // (Connecticut) build the discriminator out of the issue date, so a
          // DCF cached across a DBD edit would contradict the date beside it.
          const dcfKey = `${state}|${data.DBD ?? ""}`;
          if (auto.dcfKey !== dcfKey || !auto.dcf) {
            auto.dcfKey = dcfKey;
            auto.dcf = generateStateDiscriminator(state, data.DBD);
          }
          data.DCF = auto.dcf;
        }

        if (present.has("DDB") && !data.DDB) {
          const ddbKey = `${state}|${data.DBD ?? ""}`;
          if (auto.ddbKey !== ddbKey || !auto.ddb) {
            auto.ddbKey = ddbKey;
            auto.ddb = generateStateCardRevisionDate(state, data.DBD) ?? "";
          }
          if (auto.ddb) data.DDB = auto.ddb;
        }

        // DAQ is intentionally not filled in here — see AUTO_GENERATED_CODES in
        // core/generator. An empty customer ID number must surface as a missing
        // mandatory field, not be quietly invented.
        const payload = generateAAMVAPayload(state, version, schemaFields, data, {
          strictMode,
          subfileType
        });
        setResult({ payload, error: null, signature });
      } catch (err) {
        setResult({ payload: "", error: (err as Error).message, signature });
      }
    }, PAYLOAD_DEBOUNCE_MS);

    return () => window.clearTimeout(id);
  }, [state, version, fields, strictMode, subfileType, signature]);

  return {
    payload: result.payload,
    error: result.error,
    stale: result.signature !== signature
  };
}
