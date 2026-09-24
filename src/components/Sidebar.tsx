import React from "react";
import { useFormStore } from "../hooks/useFormStore";
import { AAMVA_STATES } from "../core/states";
import { AAMVA_VERSIONS, AAMVA_VERSION_KEYS, AAMVA_STATE_EXCLUDED_FIELDS } from "../core/schema";
import { JurisdictionCombobox } from "./JurisdictionCombobox";
const VersionBrowser = React.lazy(() =>
  import("./VersionBrowser").then((m) => ({ default: m.VersionBrowser }))
);

/** Record context is horizontal; the historical filename is retained for callers. */
export const Sidebar: React.FC<{ mobileHidden?: boolean; children?: React.ReactNode }> = ({
  mobileHidden = false
}) => {
  const {
    state,
    version,
    setStateVersion,
    strictMode,
    setStrictMode,
    subfileType,
    setSubfileType,
    recentStates
  } = useFormStore();
  const excluded = AAMVA_STATE_EXCLUDED_FIELDS[state] ?? [];
  return (
    <section
      className={`record-context ${mobileHidden ? "context-mobile-hidden" : ""}`}
      aria-label="Record settings"
    >
      <div className="context-fields">
        <div className="context-issuer">
          <label className="wb-label" htmlFor="state-select">
            Issuing jurisdiction
          </label>
          <JurisdictionCombobox
            id="state-select"
            value={state}
            onChange={(value) => setStateVersion(value, AAMVA_STATES[value]?.aamvaVersion || "10")}
            recent={recentStates}
          />
        </div>
        <div>
          <label className="wb-label" htmlFor="version-select">
            AAMVA version
          </label>
          <select
            id="version-select"
            className="wb-select"
            aria-label="Select AAMVA version"
            value={version}
            onChange={(e) => setStateVersion(state, e.target.value)}
          >
            {AAMVA_VERSION_KEYS.map((v) => (
              <option key={v} value={v}>
                {v} · {AAMVA_VERSIONS[v]?.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="wb-label" htmlFor="subfile-select">
            Document type
          </label>
          <select
            id="subfile-select"
            className="wb-select"
            aria-label="Select subfile type"
            value={subfileType}
            onChange={(e) => setSubfileType(e.target.value as "DL" | "ID")}
          >
            <option value="DL">DL · Driver license</option>
            <option value="ID">ID · Identification</option>
          </select>
        </div>
        <label className="strict-control">
          <input
            id="strictMode"
            type="checkbox"
            checked={strictMode}
            onChange={(e) => setStrictMode(e.target.checked)}
            aria-describedby="strictMode-desc"
          />
          <span>
            Strict validation<small id="strictMode-desc">Also block format advisories</small>
          </span>
        </label>
      </div>
      <details className="schema-details">
        <summary>Schema notes & version reference</summary>
        <div className="schema-detail-content">
          <p>
            This is the application's field model, not a certification of conformance. Jurisdiction
            patterns and default versions include implementation assumptions. Address jurisdiction
            remains independently editable.
          </p>
          {excluded.length > 0 && (
            <p>
              The {state} profile omits: <span className="font-mono">{excluded.join(", ")}</span>.
            </p>
          )}
          <React.Suspense fallback={<p>Loading version reference…</p>}>
            <VersionBrowser />
          </React.Suspense>
        </div>
      </details>
    </section>
  );
};
