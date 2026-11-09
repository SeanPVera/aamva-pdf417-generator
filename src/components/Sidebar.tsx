import React from "react";
import { useFormStore } from "../hooks/useFormStore";
import { AAMVA_STATES } from "../core/states";
import { AAMVA_VERSIONS, AAMVA_VERSION_KEYS, AAMVA_STATE_EXCLUDED_FIELDS } from "../core/schema";
import { JurisdictionCombobox } from "./JurisdictionCombobox";

const VersionBrowser = React.lazy(() =>
  import("./VersionBrowser").then((m) => ({ default: m.VersionBrowser }))
);

interface SidebarProps {
  mobileHidden?: boolean;
  children?: React.ReactNode;
  /** Optional live payload length for the context strip. */
  payloadBytes?: number | null;
  /** Increment to open the schema/version reference details. */
  versionsOpenSignal?: number;
}

/** Record context strip + issuer controls. Filename retained for callers. */
export const Sidebar: React.FC<SidebarProps> = ({
  mobileHidden = false,
  payloadBytes = null,
  versionsOpenSignal = 0
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
  const iin = AAMVA_STATES[state]?.IIN ?? "—";
  const detailsRef = React.useRef<HTMLDetailsElement>(null);

  React.useEffect(() => {
    if (!versionsOpenSignal || !detailsRef.current) return;
    detailsRef.current.open = true;
    detailsRef.current.scrollIntoView({ block: "nearest" });
  }, [versionsOpenSignal]);

  return (
    <section
      className={`record-context ${mobileHidden ? "context-mobile-hidden" : ""}`}
      aria-label="Record settings"
    >
      <div className="context-meta" aria-label="Record context">
        <div>
          <label>IIN / Jurisdiction</label>
          {iin} · {state}
        </div>
        <div>
          <label>AAMVA version</label>
          {version} · {AAMVA_VERSIONS[version]?.name ?? "—"}
        </div>
        <div>
          <label>Subfile</label>
          {subfileType}
        </div>
        <div>
          <label>Strict mode</label>
          {strictMode ? "on" : "off"}
        </div>
        <div>
          <label>Directory</label>
          {payloadBytes == null ? "—" : `${payloadBytes} bytes`}
        </div>
        <div>
          <label>Data class</label>
          SAMPLE · synthetic
        </div>
      </div>
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
          {version === "12" && (
            <p className="mt-2 text-sm">
              The 2026 standard is supported. Turn off Strict validation for v12 tests. Issuer
              adoption remains unverified.
            </p>
          )}
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
      <details ref={detailsRef} className="schema-details" style={{ paddingInline: "1rem" }}>
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
