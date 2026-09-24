import React from "react";
import { SearchX, ChevronLeft, ChevronRight } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { WelcomeTour } from "./components/WelcomeTour";
import { FieldInput } from "./components/FieldInput";
import { FieldGroup, FIELD_GRID_CLASS } from "./components/FieldGroup";
import { FieldFilters } from "./components/FieldFilters";
import { StepRail, type StepRailSection } from "./components/StepRail";
import { MobileActionBar } from "./components/MobileActionBar";
import { describeActiveFilters } from "./components/filterSummary";
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
import { getValidationIssues } from "./core/validation";
import { getFieldHelp } from "./core/fieldHelp";
import { parsePastedPayload } from "./core/pasteImport";
import {
  generateStateDiscriminator,
  generateStateLicenseNumber,
  generateStateCardRevisionDate
} from "./core/generator";
import { buildSampleFill } from "./core/sampleFiller";
import { hasUserData, seededFields } from "./core/derivedFields";
import { useSwipe } from "./hooks/useSwipe";
import { usePayload } from "./hooks/usePayload";

const MOBILE_PANELS = ["config", "form", "preview"] as const;
type MobilePanel = (typeof MOBILE_PANELS)[number];

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
// Modals that only ever appear on an explicit click. Keeping them out of the
// initial chunk holds the first-paint JS inside its size budget.
const ShortcutsModal = React.lazy(() =>
  import("./components/ShortcutsModal").then((module) => ({ default: module.ShortcutsModal }))
);
const CompareView = React.lazy(() =>
  import("./components/CompareView").then((module) => ({ default: module.CompareView }))
);

function App() {
  const [isScanning, setIsScanning] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [batchOpen, setBatchOpen] = React.useState(false);
  const [tourOpen, setTourOpen] = React.useState(false);
  const [mobilePanel, setMobilePanel] = React.useState<MobilePanel>("form");
  // Which rung of the rail is open. The form shows one section at a time; the
  // whole-form view comes back the moment a filter or a search is active.
  const [activeSectionRaw, setActiveSection] = React.useState<FieldGroupId>("identity");

  const cycleMobilePanel = React.useCallback((delta: 1 | -1) => {
    setMobilePanel((current) => {
      const idx = MOBILE_PANELS.indexOf(current);
      const next = (idx + delta + MOBILE_PANELS.length) % MOBILE_PANELS.length;
      return MOBILE_PANELS[next] ?? current;
    });
  }, []);

  // Stable identities: `useSwipe` re-runs its effect whenever a handler changes,
  // and inline arrows here made that every render.
  const handleSwipeLeft = React.useCallback(() => cycleMobilePanel(1), [cycleMobilePanel]);
  const handleSwipeRight = React.useCallback(() => cycleMobilePanel(-1), [cycleMobilePanel]);
  const swipeRef = useSwipe<HTMLElement>({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight
  });
  const {
    state,
    version,
    strictMode,
    fields,
    setField,
    mergeFields,
    subfileType,
    setStrictMode,
    theme,
    undo,
    redo,
    canUndo,
    canRedo,
    requiredOnly,
    setRequiredOnly,
    issuesOnly,
    setIssuesOnly,
    markTourSeen,
    _changedAt,
    _changedCodes
  } = useFormStore();
  const whimsy = false;
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  const handleResetFilters = React.useCallback(() => {
    setSearchQuery("");
    setRequiredOnly(false);
    setIssuesOnly(false);
  }, [setRequiredOnly, setIssuesOnly]);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const schemaFields = React.useMemo(
    () => getFieldsForStateAndVersion(state, version, subfileType),
    [state, version, subfileType]
  );
  const toast = useToast();

  // One source of truth for the generated payload — the preview renders it and
  // the keyboard shortcuts read it, instead of scraping the rendered DOM.
  const { payload, error: payloadError, stale: payloadStale } = usePayload();
  const exportPngRef = React.useRef<(() => void) | null>(null);
  const handleRegisterExportPng = React.useCallback((fn: (() => void) | null) => {
    exportPngRef.current = fn;
  }, []);

  // Single source of validation truth for the mobile tab badges, the issue
  // filter, and the clerk mascot.
  const issues = React.useMemo(
    () => getValidationIssues(schemaFields, fields, state, strictMode, subfileType),
    [schemaFields, fields, state, strictMode, subfileType]
  );
  // Everything that blocks generation, blank fields included. Only the
  // *display* of counts distinguishes the two kinds; the gate does not.
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const issueCodes = React.useMemo(() => new Set(issues.map((i) => i.code)), [issues]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const visibleFields = React.useMemo(
    () =>
      schemaFields.filter((f) => {
        if (requiredOnly && !f.required) return false;
        if (issuesOnly && !issueCodes.has(f.code)) return false;
        if (!normalizedQuery) return true;
        // Search reaches the help text and the group label too — "donor",
        // "REAL ID", and "truncation" all appear there and nowhere else.
        const group = AAMVA_FIELD_GROUPS.find((g) => g.id === getFieldGroup(f.code));
        const haystack = [f.code, f.label, getFieldHelp(f.code) ?? "", group?.label ?? ""]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      }),
    [schemaFields, requiredOnly, issuesOnly, issueCodes, normalizedQuery]
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

  const extraEntries = Object.entries(fields).filter(
    ([code, value]) => value && !schemaFields.some((f) => f.code === code)
  );

  const requiredFields = React.useMemo(
    () => schemaFields.filter((f) => f.required),
    [schemaFields]
  );

  // Per-section state for the rail. Counts come from the full schema rather
  // than the filtered view — a section the search hid still owes you the same
  // work, and a rail that forgets that is worse than no rail.
  //
  // `errors` counts only values the validator rejects. Blank required fields
  // are `requiredTotal - requiredFilled`, which the rail words as work
  // remaining. Counting them as errors is what made a form nobody had touched
  // open with every section in red.
  const railSections = React.useMemo<StepRailSection[]>(() => {
    const errorsBySection = new Map<FieldGroupId, number>();
    const advisoriesBySection = new Map<FieldGroupId, number>();
    for (const issue of issues) {
      const id = getFieldGroup(issue.code);
      if (issue.severity === "error") {
        if (issue.kind === "empty") continue;
        errorsBySection.set(id, (errorsBySection.get(id) ?? 0) + 1);
      } else {
        advisoriesBySection.set(id, (advisoriesBySection.get(id) ?? 0) + 1);
      }
    }

    return AAMVA_FIELD_GROUPS.map((group) => {
      const inGroup = schemaFields.filter((f) => getFieldGroup(f.code) === group.id);
      const requiredInGroup = inGroup.filter((f) => f.required);
      return {
        id: group.id,
        label: group.label,
        total: inGroup.length,
        requiredTotal: requiredInGroup.length,
        requiredFilled: requiredInGroup.filter((f) => (fields[f.code] || "").trim()).length,
        errors: errorsBySection.get(group.id) ?? 0,
        advisories: advisoriesBySection.get(group.id) ?? 0
      };
      // A version or jurisdiction that defines nothing for a section gets no
      // step — an empty "Jurisdiction Subfile" rung is a dead end, not a task.
    }).filter((section) => section.total > 0);
  }, [schemaFields, fields, issues]);
  // A jurisdiction switch can remove the section you were standing on — New
  // York defines a ZN subfile, most states define none — so the rung is
  // re-resolved against the current rail rather than trusted.
  const activeSection: FieldGroupId = railSections.some((s) => s.id === activeSectionRaw)
    ? activeSectionRaw
    : (railSections[0]?.id ?? "identity");

  // Searching or filtering is the whole-form view. One section at a time is
  // right for working through a blank form; it is exactly wrong for "where is
  // the donor field", which is the case the section IA would otherwise break.
  const isFiltering = normalizedQuery !== "" || requiredOnly || issuesOnly;

  const sectionFields = React.useMemo(
    () => visibleFields.filter((f) => getFieldGroup(f.code) === activeSection),
    [visibleFields, activeSection]
  );

  const activeSectionIndex = railSections.findIndex((s) => s.id === activeSection);
  const activeSectionDef = AAMVA_FIELD_GROUPS.find((g) => g.id === activeSection);
  const prevSection = activeSectionIndex > 0 ? railSections[activeSectionIndex - 1] : undefined;
  const nextSection =
    activeSectionIndex >= 0 && activeSectionIndex < railSections.length - 1
      ? railSections[activeSectionIndex + 1]
      : undefined;

  const requiredFilled = requiredFields.filter(
    (f) => (fields[f.code] || "").trim().length > 0
  ).length;
  const requiredTotal = requiredFields.length;

  // Blocking errors that are an actual mistake rather than an unfilled box.
  // The two are counted separately everywhere they surface.
  const invalidCount = issues.filter((i) => i.severity === "error" && i.kind === "invalid").length;
  const emptyRequiredCount = requiredTotal - requiredFilled;

  const isFieldFilled = (code: string) => (fields[code] || "").trim().length > 0;

  // What the app pre-filled, so the dirty-state checks can tell a seed from
  // something the user typed.
  const appSeeds = React.useMemo(() => seededFields(state, subfileType), [state, subfileType]);
  const anyFields = React.useMemo(() => hasUserData(fields, appSeeds), [fields, appSeeds]);
  const requiredComplete = requiredTotal > 0 && requiredFilled === requiredTotal;
  const previewReady = anyFields && errorCount === 0 && requiredComplete;

  // Field values are never persisted (see useFormStore) — which is the right
  // privacy call, but it also means a refresh or an accidental window close
  // discards a hand-typed form with no warning. Ask first.
  React.useEffect(() => {
    if (!anyFields) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Browsers show their own copy; a non-empty returnValue is the opt-in.
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [anyFields]);

  // Apply global theme + state palette to <html> element. "system" follows the
  // OS rather than forcing dark on every first-time visitor.
  React.useEffect(() => {
    const html = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const apply = () => {
      const wantsDark = theme === "dark" || (theme === "system" && media.matches);
      html.classList.toggle("dark", wantsDark);
      if (theme === "dmv") html.setAttribute("data-theme", "dmv");
      else html.removeAttribute("data-theme");
    };

    apply();
    if (theme !== "system") return;
    media.addEventListener?.("change", apply);
    return () => media.removeEventListener?.("change", apply);
  }, [theme]);

  // Page-level paste is a synchronous transaction. An explicit dialog also
  // supports paste into a focused editor without intercepting field input.
  React.useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      const text = event.clipboardData?.getData("text") ?? "";
      if (!text.trim()) return;
      const result = parsePastedPayload(text);
      if (!result.data) {
        if (result.kind !== "unknown") toast.error(result.summary);
        return;
      }
      event.preventDefault();
      useFormStore
        .getState()
        .loadJson(
          { ...result.data, ...(result.subfileType ? { subfileType: result.subfileType } : {}) },
          result.kind === "aamva" ? text : undefined
        );
      toast.success(`${result.summary} Undo is available in the toolbar.`);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [toast]);

  // Help is opened explicitly, never over an active workspace.
  const showTour = tourOpen;

  const handleCloseTour = React.useCallback(() => {
    setTourOpen(false);
    markTourSeen();
  }, [markTourSeen]);

  const handleChange = (code: string, value: string) => {
    setField(code, value);
  };

  // Diff-highlight: flash fields that changed in the last bulk load
  // (import / scan / preset) so the user sees exactly what landed.
  React.useEffect(() => {
    if (!_changedAt || _changedCodes.length === 0) return;
    const flashed: HTMLElement[] = [];
    for (const code of _changedCodes) {
      const el = document.getElementById(code);
      if (!el) continue;
      el.classList.remove("field-diff-flash");
      void el.offsetWidth; // restart the animation
      el.classList.add("field-diff-flash");
      flashed.push(el);
    }
    const t = window.setTimeout(
      () => flashed.forEach((el) => el.classList.remove("field-diff-flash")),
      1600
    );
    return () => window.clearTimeout(t);
  }, [_changedAt, _changedCodes]);

  // Collapse-all and expand-all went with the accordions. One section is open
  // at a time now, and in the filtered view every match is shown by
  // definition — there is nothing left for either control to do.

  const handleGenerate = (code: string) => {
    if (code === "DCF") {
      handleChange(code, generateStateDiscriminator(state, fields.DBD));
    } else if (code === "DAQ") handleChange(code, generateStateLicenseNumber(state));
    else if (code === "DDB")
      handleChange(code, generateStateCardRevisionDate(state, fields["DBD"], version) || "");
  };

  // One click, one undo step — see `mergeFields` in useFormStore.
  const handleGenerateAllAuto = () => {
    const presentCodes = new Set(schemaFields.map((f) => f.code));
    const patch: Record<string, string> = {};
    if (presentCodes.has("DCF")) patch.DCF = generateStateDiscriminator(state, fields.DBD);
    if (presentCodes.has("DAQ")) patch.DAQ = generateStateLicenseNumber(state);
    if (presentCodes.has("DDB")) {
      const ddb = generateStateCardRevisionDate(state, fields["DBD"], version);
      if (ddb) patch.DDB = ddb;
    }
    const count = Object.keys(patch).length;
    if (count === 0) {
      toast.info("No auto-generated fields available for this version.");
      return;
    }
    mergeFields(patch);
    toast.success(`Generated ${count} auto field${count === 1 ? "" : "s"}.`);
  };

  // Reads the payload the app already generated rather than hunting for a
  // textarea that the Raw Payload section unmounts when collapsed.
  const handleCopyPayload = async () => {
    if (payloadStale) {
      toast.info("Still encoding — try again in a moment.");
      return;
    }
    if (!payload) {
      toast.error(payloadError ?? "No payload to copy yet.");
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
    const run = exportPngRef.current;
    if (!run) {
      toast.info(
        payloadStale ? "Still encoding — try again in a moment." : "No barcode to export."
      );
      return;
    }
    run();
  };

  // Dev-only convenience: fill the form with valid sample values so we can
  // verify changes against a generated barcode without typing every field.
  const handleFillSample = () => {
    const sample = buildSampleFill(schemaFields, state);
    mergeFields(sample);
    toast.success(
      `Filled ${Object.keys(sample).length} synthetic sample fields. Undo is available in the toolbar.`
    );
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

  // A jump names a field; the effect below performs it once that field is
  // actually on the page.
  const pendingFocusRef = React.useRef<string | null>(null);

  const handleScrollToField = React.useCallback(
    (code: string) => {
      // On mobile, the form column may be hidden — switch to it first.
      setMobilePanel("form");
      // The field almost certainly lives on a rung other than the open one, and
      // an unmounted input cannot be scrolled to or focused. Open its section
      // first; this is what keeps "jump to the next error", the validation
      // panel's links, and F8 working now that the form is paginated.
      const group = getFieldGroup(code);
      setActiveSection(group);
      // If the required-only filter is hiding this field, drop it.
      const fieldDef = schemaFields.find((f) => f.code === code);
      if (fieldDef && requiredOnly && !fieldDef.required) setRequiredOnly(false);
      // Clear the search query if it's filtering this field out.
      const q = searchQuery.trim().toLowerCase();
      if (q && !(code.toLowerCase().includes(q) || fieldDef?.label.toLowerCase().includes(q))) {
        setSearchQuery("");
      }
      // Hand the focus off to the effect below rather than a rAF. Switching
      // sections unmounts one set of inputs and mounts another, and a rAF
      // scheduled here can run before React commits that — `getElementById`
      // then returns null for an input that is about to exist, and the jump
      // silently does nothing.
      pendingFocusRef.current = code;
    },
    [schemaFields, requiredOnly, setRequiredOnly, searchQuery]
  );

  // Runs after every commit, so a jump that had to change section, drop a
  // filter, or switch mobile panel lands as soon as its input is on the page.
  React.useEffect(() => {
    const code = pendingFocusRef.current;
    if (!code) return;
    const el = document.getElementById(code);
    // Still mid-switch: leave the request standing and try again next commit.
    if (!el) return;
    pendingFocusRef.current = null;
    const disclosure = el.closest("details");
    if (disclosure) disclosure.open = true;
    el.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "center"
    });
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
    const timer = window.setTimeout(() => el.classList.remove("field-flash"), 1200);
    return () => window.clearTimeout(timer);
  });

  const nextEmptyRequiredCode = React.useMemo(
    () => requiredFields.find((f) => !isFieldFilled(f.code))?.code,
    // isFieldFilled closes over `fields`; depend on `fields` directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requiredFields, fields]
  );

  const handleJumpToNextEmpty = () => {
    if (nextEmptyRequiredCode) handleScrollToField(nextEmptyRequiredCode);
  };

  const handleSelectSection = React.useCallback((id: FieldGroupId) => {
    setMobilePanel("form");
    setActiveSection(id);
    // A section swap replaces the whole column; leaving the reader wherever
    // the last one was scrolled to means landing mid-form with no heading.
    requestAnimationFrame(() => {
      document.getElementById("section-heading")?.scrollIntoView({ block: "start" });
    });
  }, []);

  // The bottom bar's single action. A mistake outranks a blank box — a wrong
  // value is the thing you cannot finish around.
  const handleMobileFixNext = React.useCallback(() => {
    const firstInvalid = issues.find((i) => i.severity === "error" && i.kind === "invalid");
    const target = firstInvalid?.code ?? nextEmptyRequiredCode;
    if (target) handleScrollToField(target);
  }, [issues, nextEmptyRequiredCode, handleScrollToField]);

  // F8 / Shift+F8 walk the issue list without leaving the keyboard.
  const issueCursorRef = React.useRef(0);
  const stepIssue = React.useCallback(
    (delta: 1 | -1) => {
      if (issues.length === 0) {
        toast.info("No validation issues.");
        return;
      }
      issueCursorRef.current = (issueCursorRef.current + delta + issues.length) % issues.length;
      const issue = issues[issueCursorRef.current];
      if (issue) handleScrollToField(issue.code);
    },
    [issues, handleScrollToField, toast]
  );

  // Keyboard shortcuts (see ShortcutsModal for the user-facing list). Handlers
  // are routed through a ref so the global keydown listener doesn't need to
  // re-bind on every keystroke that touches store state.
  const shortcutHandlersRef = React.useRef({
    handleGenerateAllAuto,
    handleCopyPayload,
    handleExportPNGShortcut,
    stepIssue
  });
  React.useEffect(() => {
    shortcutHandlersRef.current = {
      handleGenerateAllAuto,
      handleCopyPayload,
      handleExportPNGShortcut,
      stepIssue
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

      if (e.key === "F8") {
        e.preventDefault();
        shortcutHandlersRef.current.stepIssue(e.shiftKey ? -1 : 1);
        return;
      }

      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();

      if (isTyping && (key === "z" || key === "y")) return;
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

  // One field renderer for both views. They diverge in what they show and how
  // it is grouped, never in how a field behaves; two copies of this prop list
  // is how a fix lands in the section view and not in search results.
  const renderField = (field: AAMVAField) => (
    <FieldInput
      key={field.code}
      field={field}
      value={fields[field.code] || ""}
      state={state}
      strictMode={strictMode}
      copied={copiedField === field.code}
      whimsy={whimsy}
      allValues={fields}
      highlight={searchQuery}
      onChange={handleChange}
      onCopy={handleCopyField}
      onReset={handleResetField}
      onGenerate={handleGenerate}
      onDisableStrict={() => {
        setStrictMode(false);
        toast.info("Strict mode disabled");
      }}
    />
  );

  return (
    <div className="app-shell">
      <Header
        onStartScan={() => setIsScanning(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenCompare={() => {
          setCompareOpen(true);
        }}
        onOpenBatch={() => setBatchOpen(true)}
      />

      <Sidebar mobileHidden={mobilePanel !== "config"} />
      <main id="record-workspace" ref={swipeRef} className="workspace-grid" tabIndex={-1}>
        <div className={`record-editor ${mobilePanel !== "form" ? "hidden lg:flex" : "flex"}`}>
          <div className="section-index">
            <StepRail
              sections={railSections}
              active={activeSection}
              onSelect={handleSelectSection}
              orientation="horizontal"
            />
          </div>
          <div id="section-heading" className="section-heading">
            {isFiltering ? (
              <>
                <span className="text-k-eyebrow font-bold uppercase text-gray-600 dark:text-gray-400">
                  Across all sections
                </span>
                <h2 className="mt-1 text-k-section font-bold text-gray-900 dark:text-gray-50">
                  {visibleFields.length} of {schemaFields.length} fields
                </h2>
                <p className="mt-1 text-k-help text-gray-600 dark:text-gray-400">
                  {describeActiveFilters(searchQuery, requiredOnly, issuesOnly, issues.length)}
                </p>
              </>
            ) : (
              <>
                <span className="section-progress text-k-eyebrow font-bold uppercase text-gray-600 dark:text-gray-400">
                  Section {activeSectionIndex + 1} of {railSections.length}
                </span>
                <h2 className="mt-1 text-k-section font-bold text-gray-900 dark:text-gray-50">
                  {activeSectionDef?.label}
                </h2>
                <p className="section-description mt-1 text-k-help text-gray-600 dark:text-gray-400">
                  {activeSectionDef?.description}
                </p>
              </>
            )}
          </div>

          <FieldFilters
            query={searchQuery}
            onQueryChange={(value) => {
              setSearchQuery(value);
            }}
            requiredOnly={requiredOnly}
            onRequiredOnlyChange={setRequiredOnly}
            issuesOnly={issuesOnly}
            onIssuesOnlyChange={setIssuesOnly}
            issueCount={invalidCount}
            matchCount={visibleFields.length}
            totalCount={schemaFields.length}
            requiredFilled={requiredFilled}
            requiredTotal={requiredTotal}
            onJumpToNextEmpty={handleJumpToNextEmpty}
            hasNextEmpty={!!nextEmptyRequiredCode}
            onGenerateAutoFields={handleGenerateAllAuto}
            onFillSample={handleFillSample}
          />

          <div className="record-fields">
            {visibleFields.length === 0 ? (
              // role="status" so screen readers announce the dead end as soon
              // as the filters produce nothing, and a reset button so the user
              // can recover without hunting for which filter to undo.
              <div
                role="status"
                className="flex flex-col items-center justify-center rounded-k-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-dark-border dark:bg-dark-surface"
              >
                <SearchX className="mb-3 h-8 w-8 text-gray-500 dark:text-gray-400" aria-hidden />
                <h3 className="mb-1 text-k-label font-bold text-gray-900 dark:text-gray-100">
                  No fields found
                </h3>
                <p className="mb-4 max-w-sm text-k-help text-gray-600 dark:text-gray-400">
                  {describeActiveFilters(searchQuery, requiredOnly, issuesOnly, issues.length)}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex h-k-touch items-center gap-1.5 rounded-k bg-brand-700 px-4 text-k-help font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Reset all filters
                </button>
              </div>
            ) : isFiltering ? (
              // Filtering is the whole-form view: matches from every section at
              // once, each run labelled with where it came from. Paginating
              // search results by section would mean hunting for the section
              // holding your match, which is the thing you searched to avoid.
              AAMVA_FIELD_GROUPS.map((group) => {
                const groupFields = fieldsByGroup.get(group.id);
                if (!groupFields || groupFields.length === 0) return null;
                const requiredInGroup = groupFields.filter((f) => f.required);
                return (
                  <FieldGroup
                    key={group.id}
                    group={group}
                    fieldCount={groupFields.length}
                    filledCount={groupFields.filter((f) => isFieldFilled(f.code)).length}
                    requiredCount={requiredInGroup.length}
                    requiredFilled={requiredInGroup.filter((f) => isFieldFilled(f.code)).length}
                  >
                    {groupFields.map(renderField)}
                  </FieldGroup>
                );
              })
            ) : (
              <>
                <div className={FIELD_GRID_CLASS}>
                  {sectionFields
                    .filter((f) => !["DDE", "DDF", "DDG", "DCU"].includes(f.code))
                    .map(renderField)}
                </div>
                {sectionFields.some((f) => ["DDE", "DDF", "DDG", "DCU"].includes(f.code)) && (
                  <details className="name-encoding">
                    <summary>
                      Name encoding & suffix <span>Truncation indicators and optional suffix</span>
                    </summary>
                    <div className={FIELD_GRID_CLASS}>
                      {sectionFields
                        .filter((f) => ["DDE", "DDF", "DDG", "DCU"].includes(f.code))
                        .map(renderField)}
                    </div>
                  </details>
                )}
              </>
            )}
          </div>

          {extraEntries.length > 0 && (
            <details className="unmodeled-fields">
              <summary>{extraEntries.length} fields outside this schema</summary>
              <p>
                Preserved in record JSON, omitted from the generated barcode. Switch back to their
                schema or remove them explicitly.
              </p>
              <div className="field-grid">
                {extraEntries.map(([code, value]) => (
                  <label key={code}>
                    {code}
                    <input
                      aria-label={`Unmodeled ${code}`}
                      value={value}
                      onChange={(e) => setField(code, e.target.value)}
                      autoComplete="off"
                    />
                  </label>
                ))}
              </div>
            </details>
          )}
          {/* Step navigation. Only in the section view — in search results
              "next section" has no meaning. */}
          {!isFiltering && railSections.length > 1 && (
            <nav aria-label="Section navigation" className="section-footer">
              {prevSection ? (
                <button
                  type="button"
                  onClick={() => handleSelectSection(prevSection.id)}
                  className="inline-flex h-k-touch items-center gap-2 rounded-k border-[1.5px] border-gray-300 px-4 text-k-label font-semibold text-gray-800 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 dark:border-[#4A4A4A] dark:text-gray-100 dark:hover:bg-dark-surface2"
                >
                  <ChevronLeft size={18} aria-hidden />
                  {prevSection.label}
                </button>
              ) : (
                <span />
              )}
              {nextSection && (
                <button
                  type="button"
                  onClick={() => handleSelectSection(nextSection.id)}
                  className="inline-flex h-k-touch items-center gap-2 rounded-k bg-brand-700 px-5 text-k-label font-bold text-white transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                >
                  {nextSection.label}
                  <ChevronRight size={18} aria-hidden />
                </button>
              )}
            </nav>
          )}
        </div>

        <React.Suspense fallback={null}>
          <BarcodePreview
            mobileHidden={mobilePanel !== "preview"}
            onScrollToField={handleScrollToField}
            whimsy={whimsy}
            payload={payload}
            error={payloadError}
            stale={payloadStale}
            onRegisterExportPng={handleRegisterExportPng}
          />
        </React.Suspense>
      </main>

      {isScanning && (
        <React.Suspense fallback={null}>
          <WebcamScanner onClose={() => setIsScanning(false)} />
        </React.Suspense>
      )}

      {batchOpen && (
        <React.Suspense fallback={null}>
          <BatchProcessor open={batchOpen} onClose={() => setBatchOpen(false)} />
        </React.Suspense>
      )}

      {shortcutsOpen && (
        <React.Suspense fallback={null}>
          <ShortcutsModal
            open={shortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
            onReplayTour={() => {
              setShortcutsOpen(false);
              setTourOpen(true);
            }}
          />
        </React.Suspense>
      )}
      {compareOpen && (
        <React.Suspense fallback={null}>
          <CompareView open={compareOpen} onClose={() => setCompareOpen(false)} />
        </React.Suspense>
      )}
      <WelcomeTour open={showTour} onClose={handleCloseTour} />
      <MobileActionBar
        panel={mobilePanel}
        onPanelChange={setMobilePanel}
        errorCount={invalidCount}
        emptyRequired={emptyRequiredCount}
        stale={payloadStale}
        ready={previewReady && !!payload}
        onFixNext={handleMobileFixNext}
        onExport={handleExportPNGShortcut}
      />

      <DropZoneOverlay />
      <footer className="workspace-footer">
        <span>Local processing · Records are not saved in this browser</span>
        <span>Application validation ≠ standards certification</span>
      </footer>
    </div>
  );
}

export default App;
