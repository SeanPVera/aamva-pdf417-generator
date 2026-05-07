import React from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ShortcutsModal } from "./components/ShortcutsModal";
import { CompareView } from "./components/CompareView";
import { WelcomeTour } from "./components/WelcomeTour";
import { FieldInput } from "./components/FieldInput";
import { FieldGroup } from "./components/FieldGroup";
import { FieldFilters } from "./components/FieldFilters";
import { DropZoneOverlay } from "./components/DropZoneOverlay";
import { useToast } from "./components/Toast";
import { useFormStore } from "./hooks/useFormStore";
import {
  getFieldsForStateAndVersion,
  AAMVA_FIELD_GROUPS,
  getFieldGroup,
  type AAMVAField,
  type FieldGroupId
} from "./core/schema";
import { applyStateThemeToDocument } from "./core/stateThemes";
import {
  generateStateDiscriminator,
  generateStateLicenseNumber,
  generateStateCardRevisionDate
} from "./core/generator";

// Heavy bundles (bwip-js ~250kB, jspdf ~150kB, zxing ~170kB) are loaded on
// demand so the initial paint doesn't pay for tooling the user may never open.
const WebcamScanner = React.lazy(() =>
  import("./components/WebcamScanner").then((module) => ({ default: module.WebcamScanner }))
);
const BarcodePreview = React.lazy(() =>
  import("./components/BarcodePreview").then((module) => ({ default: module.BarcodePreview }))
);
const BatchProcessor = React.lazy(() =>
  import("./components/BatchProcessor").then((module) => ({ default: module.BatchProcessor }))
);

function App() {
  const [isScanning, setIsScanning] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [tourOpen, setTourOpen] = React.useState(false);
  const [mobilePanel, setMobilePanel] = React.useState<"config" | "form" | "preview">("form");
  const {
    state,
    version,
    strictMode,
    fields,
    setField,
    setStrictMode,
    theme,
    undo,
    redo,
    canUndo,
    canRedo,
    collapsedGroups,
    toggleGroupCollapsed,
    requiredOnly,
    setRequiredOnly,
    tourSeenAt,
    markTourSeen
  } = useFormStore();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const schemaFields = getFieldsForStateAndVersion(state, version);
  const toast = useToast();

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleFields = React.useMemo(
    () =>
      schemaFields.filter((f) => {
        if (requiredOnly && !f.required) return false;
        if (!normalizedQuery) return true;
        return (
          f.code.toLowerCase().includes(normalizedQuery) ||
          f.label.toLowerCase().includes(normalizedQuery)
        );
      }),
    [schemaFields, requiredOnly, normalizedQuery]
  );

  const fieldsByGroup = React.useMemo(() => {
    const map = new Map<FieldGroupId, AAMVAField[]>();
    for (const field of visibleFields) {
      const group = getFieldGroup(field.code);
      const list = map.get(group);
      if (list) list.push(field);
      else map.set(group, [field]);
    }
    return map;
  }, [visibleFields]);

  const requiredFields = React.useMemo(
    () => schemaFields.filter((f) => f.required),
    [schemaFields]
  );
  const requiredFilled = requiredFields.filter(
    (f) => (fields[f.code] || "").trim().length > 0
  ).length;
  const requiredTotal = requiredFields.length;

  const isFieldFilled = (code: string) => (fields[code] || "").trim().length > 0;

  // Apply global theme + state palette to <html> element
  React.useEffect(() => {
    const html = document.documentElement;

    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    if (theme === "dmv") {
      html.setAttribute("data-theme", "dmv");
    } else {
      html.removeAttribute("data-theme");
    }
  }, [theme]);

  // Apply the jurisdiction-specific palette whenever the selected state
  // changes. The palette is exposed as CSS custom properties on <html>
  // (consumed by `header.state-themed`, `.state-themed-*` rules, etc.).
  React.useEffect(() => {
    applyStateThemeToDocument(state);
  }, [state]);

  // The tour is visible either because the user has never seen it OR they
  // explicitly chose to replay it. Closing it both hides it and persists the
  // "seen" timestamp so it doesn't auto-open on the next session.
  const showTour = tourOpen || !tourSeenAt;

  const handleCloseTour = React.useCallback(() => {
    setTourOpen(false);
    markTourSeen();
  }, [markTourSeen]);

  const handleChange = (code: string, value: string) => {
    setField(code, value);
  };

  const handleGenerate = (code: string) => {
    if (code === "DCF") handleChange(code, generateStateDiscriminator(state));
    else if (code === "DAQ") handleChange(code, generateStateLicenseNumber(state));
    else if (code === "DDB")
      handleChange(code, generateStateCardRevisionDate(state, fields["DBD"]) || "");
  };

  const handleGenerateAllAuto = () => {
    let count = 0;
    const presentCodes = new Set(schemaFields.map((f) => f.code));
    if (presentCodes.has("DCF")) {
      setField("DCF", generateStateDiscriminator(state));
      count++;
    }
    if (presentCodes.has("DAQ")) {
      setField("DAQ", generateStateLicenseNumber(state));
      count++;
    }
    if (presentCodes.has("DDB")) {
      const ddb = generateStateCardRevisionDate(state, fields["DBD"]);
      if (ddb) {
        setField("DDB", ddb);
        count++;
      }
    }
    if (count === 0) toast.info("No auto-generated fields available for this version.");
    else toast.success(`Generated ${count} auto field${count === 1 ? "" : "s"}.`);
  };

  const handleCopyPayload = async () => {
    const el = document.querySelector<HTMLTextAreaElement>(
      "textarea[aria-label='Raw AAMVA payload string']"
    );
    const payload = el?.value;
    if (!payload) {
      toast.error("No payload to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(payload);
      toast.success("Copied raw payload");
    } catch {
      toast.error("Could not copy payload");
    }
  };

  const handleExportPNGShortcut = () => {
    const btn = document.querySelector<HTMLButtonElement>(
      "button[aria-label='Export barcode as PNG']"
    );
    if (btn && !btn.disabled) btn.click();
  };

  const handleCopyField = async (code: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(code);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedField(null), 2000);
      toast.success(`Copied ${code}`);
    } catch {
      toast.error(`Could not copy ${code}`);
    }
  };

  const handleResetField = (code: string) => {
    handleChange(code, "");
    toast.info(`Reset ${code}`);
  };

  const handleScrollToField = (code: string) => {
    // On mobile, the form column may be hidden — switch to it first.
    setMobilePanel("form");
    // Expand the field's group so the input becomes reachable.
    const group = getFieldGroup(code);
    if (collapsedGroups[group]) toggleGroupCollapsed(group);
    // If the required-only filter is hiding this field, drop it.
    const fieldDef = schemaFields.find((f) => f.code === code);
    if (fieldDef && requiredOnly && !fieldDef.required) setRequiredOnly(false);
    // Clear the search query if it's filtering this field out.
    const q = searchQuery.trim().toLowerCase();
    if (q && !(code.toLowerCase().includes(q) || fieldDef?.label.toLowerCase().includes(q))) {
      setSearchQuery("");
    }
    // Defer to allow the panel to become visible.
    requestAnimationFrame(() => {
      const el = document.getElementById(code);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      try {
        el.focus({ preventScroll: true });
      } catch {
        el.focus();
      }
      // Flash the field briefly so the user can see where they landed.
      el.classList.remove("field-flash");
      // Force reflow so the animation re-runs even if the class was just removed.
      void el.offsetWidth;
      el.classList.add("field-flash");
      window.setTimeout(() => el.classList.remove("field-flash"), 1200);
    });
  };

  const nextEmptyRequiredCode = React.useMemo(
    () => requiredFields.find((f) => !isFieldFilled(f.code))?.code,
    // isFieldFilled closes over `fields`; depend on `fields` directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requiredFields, fields]
  );

  const handleJumpToNextEmpty = () => {
    if (nextEmptyRequiredCode) handleScrollToField(nextEmptyRequiredCode);
  };

  // Keyboard shortcuts (see ShortcutsModal for the user-facing list). Handlers
  // are routed through a ref so the global keydown listener doesn't need to
  // re-bind on every keystroke that touches store state.
  const shortcutHandlersRef = React.useRef({
    handleGenerateAllAuto,
    handleCopyPayload,
    handleExportPNGShortcut
  });
  React.useEffect(() => {
    shortcutHandlersRef.current = {
      handleGenerateAllAuto,
      handleCopyPayload,
      handleExportPNGShortcut
    };
  });

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if (e.key === "?" && !isTyping) {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();

      if (key === "z" && !e.shiftKey) {
        if (canUndo()) {
          e.preventDefault();
          undo();
        }
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        if (canRedo()) {
          e.preventDefault();
          redo();
        }
      } else if (key === "g" && !e.shiftKey) {
        e.preventDefault();
        shortcutHandlersRef.current.handleGenerateAllAuto();
      } else if (key === "c" && e.shiftKey) {
        e.preventDefault();
        shortcutHandlersRef.current.handleCopyPayload();
      } else if (key === "e" && !e.shiftKey) {
        e.preventDefault();
        shortcutHandlersRef.current.handleExportPNGShortcut();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [undo, redo, canUndo, canRedo]);

  return (
    <div className="app-shell flex flex-col min-h-screen bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-200 font-sans">
      <Header
        onStartScan={() => setIsScanning(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenCompare={() => setCompareOpen(true)}
      />

      <nav
        className="lg:hidden z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-2 pb-2 pt-1"
        aria-label="Mobile panel navigation"
      >
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "config", label: "Config" },
            { key: "form", label: "Fields" },
            { key: "preview", label: "Preview" }
          ].map((panel) => (
            <button
              key={panel.key}
              type="button"
              onClick={() => setMobilePanel(panel.key as "config" | "form" | "preview")}
              aria-current={mobilePanel === panel.key}
              className={`state-themed-tab rounded-md px-3 py-2 text-sm font-medium transition ${
                mobilePanel === panel.key
                  ? "state-primary-bg text-white"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
              }`}
            >
              {panel.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="flex flex-1 flex-col lg:flex-row overflow-visible lg:overflow-hidden gap-0 lg:gap-0 pb-safe">
        <Sidebar mobileHidden={mobilePanel !== "config"} />

        <div
          className={`dmv-main flex-1 flex flex-col overflow-y-auto bg-white dark:bg-[#1E1E1E] m-2 lg:m-4 rounded-xl shadow-google dark:shadow-none border border-gray-200 dark:border-[#333333] min-h-[40vh] ${
            mobilePanel !== "form" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              Payload Fields
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              AAMVA Version {version} &bull; {state}
            </div>
          </div>

          <FieldFilters
            query={searchQuery}
            onQueryChange={setSearchQuery}
            requiredOnly={requiredOnly}
            onRequiredOnlyChange={setRequiredOnly}
            matchCount={visibleFields.length}
            totalCount={schemaFields.length}
            requiredFilled={requiredFilled}
            requiredTotal={requiredTotal}
            onJumpToNextEmpty={handleJumpToNextEmpty}
            hasNextEmpty={!!nextEmptyRequiredCode}
            onGenerateAutoFields={handleGenerateAllAuto}
          />

          <div className="p-4 lg:p-6">
            {visibleFields.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic px-1">
                No fields match the current filters.
              </p>
            ) : (
              AAMVA_FIELD_GROUPS.map((group) => {
                const groupFields = fieldsByGroup.get(group.id);
                if (!groupFields || groupFields.length === 0) return null;
                const requiredInGroup = groupFields.filter((f) => f.required);
                const filledInGroup = groupFields.filter((f) => isFieldFilled(f.code)).length;
                const requiredFilledInGroup = requiredInGroup.filter((f) =>
                  isFieldFilled(f.code)
                ).length;
                const isCollapsed = !!collapsedGroups[group.id];
                return (
                  <FieldGroup
                    key={group.id}
                    group={group}
                    collapsed={isCollapsed}
                    fieldCount={groupFields.length}
                    filledCount={filledInGroup}
                    requiredCount={requiredInGroup.length}
                    requiredFilled={requiredFilledInGroup}
                    onToggle={() => toggleGroupCollapsed(group.id)}
                  >
                    {groupFields.map((field) => (
                      <FieldInput
                        key={field.code}
                        field={field}
                        value={fields[field.code] || ""}
                        state={state}
                        strictMode={strictMode}
                        copied={copiedField === field.code}
                        onChange={handleChange}
                        onCopy={handleCopyField}
                        onReset={handleResetField}
                        onGenerate={handleGenerate}
                        onDisableStrict={() => {
                          setStrictMode(false);
                          toast.info("Strict mode disabled");
                        }}
                      />
                    ))}
                  </FieldGroup>
                );
              })
            )}
          </div>
          <div className="mt-auto">
            <React.Suspense fallback={null}>
              <BatchProcessor />
            </React.Suspense>
          </div>
        </div>

        <React.Suspense fallback={null}>
          <BarcodePreview
            mobileHidden={mobilePanel !== "preview"}
            onScrollToField={handleScrollToField}
          />
        </React.Suspense>
      </main>

      {isScanning && (
        <React.Suspense fallback={null}>
          <WebcamScanner onClose={() => setIsScanning(false)} />
        </React.Suspense>
      )}

      <ShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        onReplayTour={() => {
          setShortcutsOpen(false);
          setTourOpen(true);
        }}
      />
      <CompareView open={compareOpen} onClose={() => setCompareOpen(false)} />
      <WelcomeTour open={showTour} onClose={handleCloseTour} />
      <DropZoneOverlay />
    </div>
  );
}

export default App;
