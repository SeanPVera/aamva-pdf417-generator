import React from "react";
import { SearchX } from "lucide-react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
// Static on purpose: the tour auto-opens on first load. Behind React.lazy it
// mounted *after* the page was already interactive, dropping an aria-modal
// dialog over a usable page — which also hides everything outside it from the
// accessibility tree. The bundle saving is not worth that.
import { WelcomeTour } from "./components/WelcomeTour";
import { FieldInput } from "./components/FieldInput";
import { FieldGroup } from "./components/FieldGroup";
import { FieldFilters } from "./components/FieldFilters";
import { GroupNav, type GroupNavStat } from "./components/GroupNav";
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
import { applyStateThemeToDocument } from "./core/stateThemes";
import {
  generateStateDiscriminator,
  generateStateLicenseNumber,
  generateStateCardRevisionDate
} from "./core/generator";
import { buildSampleFill } from "./core/sampleFiller";
import { parsePastedPayload } from "./core/pasteImport";
import { useSwipe } from "./hooks/useSwipe";
import { useClickClack } from "./hooks/useClickClack";
import { useKonami } from "./hooks/useKonami";
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
const EmployeeOfTheMonth = React.lazy(() =>
  import("./components/EmployeeOfTheMonth").then((module) => ({
    default: module.EmployeeOfTheMonth
  }))
);
const DmvBingo = React.lazy(() =>
  import("./components/DmvBingo").then((module) => ({ default: module.DmvBingo }))
);
// Decorative and gated behind the whimsy preference — never part of first paint,
// and nothing blocks on them appearing.
const TicketDispenser = React.lazy(() =>
  import("./components/TicketDispenser").then((module) => ({ default: module.TicketDispenser }))
);
const ClerkMascot = React.lazy(() =>
  import("./components/ClerkMascot").then((module) => ({ default: module.ClerkMascot }))
);
// Physics, a canvas loop, and an examiner. Nothing about it is needed to make a
// barcode, so it is never in the initial chunk.
const RoadTest = React.lazy(() =>
  import("./components/RoadTest").then((module) => ({ default: module.RoadTest }))
);

function App() {
  const [isScanning, setIsScanning] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [compareOpen, setCompareOpen] = React.useState(false);
  const [batchOpen, setBatchOpen] = React.useState(false);
  const [badgesOpen, setBadgesOpen] = React.useState(false);
  const [bingoOpen, setBingoOpen] = React.useState(false);
  const [roadTestOpen, setRoadTestOpen] = React.useState(false);
  const [tourOpen, setTourOpen] = React.useState(false);
  const [mobilePanel, setMobilePanel] = React.useState<MobilePanel>("form");

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
    setDerivedField,
    loadJson,
    mergeFields,
    restoreFields,
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
    issuesOnly,
    setIssuesOnly,
    tourSeenAt,
    markTourSeen,
    whimsy,
    soundOn,
    badgeStats,
    recordBadgeEvent,
    bingoMarked,
    markBingo,
    resetBingo,
    _changedAt,
    _changedCodes
  } = useFormStore();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [party, setParty] = React.useState(false);

  const handleResetFilters = React.useCallback(() => {
    setSearchQuery("");
    setRequiredOnly(false);
    setIssuesOnly(false);
  }, [setRequiredOnly, setIssuesOnly]);
  const playClack = useClickClack(soundOn && whimsy);
  const copyTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const schemaFields = React.useMemo(
    () => getFieldsForStateAndVersion(state, version),
    [state, version]
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
    () => getValidationIssues(schemaFields, { ...fields, DAJ: state }, state, strictMode),
    [schemaFields, fields, state, strictMode]
  );
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

  const requiredFields = React.useMemo(
    () => schemaFields.filter((f) => f.required),
    [schemaFields]
  );

  // Per-group state for the navigator strip. Counts come from the full schema
  // (a filtered-away error is still an error); `total` comes from what is
  // actually on screen, so a group the filters emptied drops out of the strip.
  const groupStats = React.useMemo<GroupNavStat[]>(() => {
    const errorsByGroup = new Map<FieldGroupId, number>();
    for (const issue of issues) {
      if (issue.severity !== "error") continue;
      const id = getFieldGroup(issue.code);
      errorsByGroup.set(id, (errorsByGroup.get(id) ?? 0) + 1);
    }

    return AAMVA_FIELD_GROUPS.map((group) => {
      const inGroup = schemaFields.filter((f) => getFieldGroup(f.code) === group.id);
      const requiredInGroup = inGroup.filter((f) => f.required);
      const emptyRequired = requiredInGroup.filter((f) => !(fields[f.code] || "").trim()).length;
      return {
        id: group.id,
        label: group.label,
        total: fieldsByGroup.get(group.id)?.length ?? 0,
        emptyRequired,
        errors: errorsByGroup.get(group.id) ?? 0,
        complete: requiredInGroup.length > 0 && emptyRequired === 0
      };
    });
  }, [schemaFields, fields, issues, fieldsByGroup]);
  const requiredFilled = requiredFields.filter(
    (f) => (fields[f.code] || "").trim().length > 0
  ).length;
  const requiredTotal = requiredFields.length;

  const isFieldFilled = (code: string) => (fields[code] || "").trim().length > 0;

  const anyFields = React.useMemo(
    () => Object.values(fields).some((v) => (v || "").trim().length > 0),
    [fields]
  );
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

  // Apply the jurisdiction-specific palette whenever the selected state
  // changes. The palette is exposed as CSS custom properties on <html>
  // (consumed by `header.state-themed`, `.state-themed-*` rules, etc.).
  React.useEffect(() => {
    applyStateThemeToDocument(state);
  }, [state]);

  // DAJ is the jurisdiction code, and generateAAMVAPayload forces it to the
  // selected state regardless of what the form holds — so leaving it as an
  // empty required field made the progress meter permanently short and sent
  // "next empty required" to an input whose value could never matter. Fill it
  // from the selection and show it read-only instead.
  const hasJurisdictionField = React.useMemo(
    () => schemaFields.some((f) => f.code === "DAJ"),
    [schemaFields]
  );
  React.useEffect(() => {
    if (!hasJurisdictionField) return;
    if (fields.DAJ !== state) setDerivedField("DAJ", state);
  }, [hasJurisdictionField, fields.DAJ, state, setDerivedField]);

  // Paste a payload anywhere on the page and it loads. The app could already
  // take a payload from a file, a drop, and a camera — but not from the
  // clipboard, which is how a payload actually travels between tools.
  //
  // The handler reads `fields` through a ref for the same reason the keyboard
  // shortcuts do: a window listener that closes over form state would re-bind on
  // every keystroke.
  const pasteStateRef = React.useRef({ fields, loadJson, restoreFields, toast });
  React.useEffect(() => {
    pasteStateRef.current = { fields, loadJson, restoreFields, toast };
  });

  React.useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const {
        fields: current,
        loadJson: load,
        restoreFields: restore,
        toast: notify
      } = pasteStateRef.current;
      const target = e.target as HTMLElement | null;
      // Never hijack a paste the user aimed at a field.
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }
      const text = e.clipboardData?.getData("text") ?? "";
      if (!text.trim()) return;

      const result = parsePastedPayload(text);
      if (!result.data) {
        // Silence on a stray paste; an explanation only once it looked like a
        // payload and still failed.
        if (result.kind !== "unknown") notify.error(result.summary);
        return;
      }

      e.preventDefault();
      const snapshot = { ...current };
      const hadValues = Object.values(current).some((v) => (v ?? "").trim().length > 0);
      load(result.data);
      notify.success(
        result.summary,
        hadValues ? { action: { label: "Undo", onClick: () => restore(snapshot) } } : undefined
      );
    };

    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // Night shift badge — checked once per session.
  React.useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 4 && !badgeStats.nightShift) {
      recordBadgeEvent({ nightShift: true });
      markBingo("night-owl");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    playClack();
  };

  // Konami code → DMV disco. Cosmetic; gated behind the whimsy preference.
  useKonami(() => {
    if (!whimsy) return;
    markBingo("konami");
    setParty((p) => {
      const next = !p;
      toast.success(next ? "🪩 DMV disco mode engaged!" : "Back to business.");
      return next;
    });
  });

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

  const handleCollapseAll = () => {
    for (const group of AAMVA_FIELD_GROUPS) {
      if (!collapsedGroups[group.id]) toggleGroupCollapsed(group.id);
    }
    markBingo("collapsed-all");
  };
  const handleExpandAll = () => {
    for (const group of AAMVA_FIELD_GROUPS) {
      if (collapsedGroups[group.id]) toggleGroupCollapsed(group.id);
    }
  };

  const handleGenerate = (code: string) => {
    if (code === "DCF") {
      handleChange(code, generateStateDiscriminator(state));
      markBingo("regenerated-dd");
    } else if (code === "DAQ") handleChange(code, generateStateLicenseNumber(state));
    else if (code === "DDB")
      handleChange(code, generateStateCardRevisionDate(state, fields["DBD"]) || "");
  };

  // One click, one undo step — see `mergeFields` in useFormStore.
  const handleGenerateAllAuto = () => {
    const presentCodes = new Set(schemaFields.map((f) => f.code));
    const patch: Record<string, string> = {};
    if (presentCodes.has("DCF")) patch.DCF = generateStateDiscriminator(state);
    if (presentCodes.has("DAQ")) patch.DAQ = generateStateLicenseNumber(state);
    if (presentCodes.has("DDB")) {
      const ddb = generateStateCardRevisionDate(state, fields["DBD"]);
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
    const snapshot = { ...fields };
    const sample = buildSampleFill(schemaFields, state);
    mergeFields(sample);
    toast.success(`Filled ${Object.keys(sample).length} sample fields`, {
      action: { label: "Undo", onClick: () => restoreFields(snapshot) }
    });
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

  const handleScrollToField = React.useCallback(
    (code: string) => {
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
    },
    [
      collapsedGroups,
      toggleGroupCollapsed,
      schemaFields,
      requiredOnly,
      setRequiredOnly,
      searchQuery
    ]
  );

  const nextEmptyRequiredCode = React.useMemo(
    () => requiredFields.find((f) => !isFieldFilled(f.code))?.code,
    // isFieldFilled closes over `fields`; depend on `fields` directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requiredFields, fields]
  );

  const handleJumpToNextEmpty = () => {
    if (nextEmptyRequiredCode) handleScrollToField(nextEmptyRequiredCode);
  };

  const handleJumpToGroup = React.useCallback(
    (id: FieldGroupId) => {
      setMobilePanel("form");
      if (collapsedGroups[id]) toggleGroupCollapsed(id);
      requestAnimationFrame(() => {
        document
          .getElementById(`field-group-${id}-heading`)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    [collapsedGroups, toggleGroupCollapsed]
  );

  // The bottom bar's single action: the first error if there is one, otherwise
  // the first field still missing a value.
  const handleMobileFixNext = React.useCallback(() => {
    const firstError = issues.find((i) => i.severity === "error");
    const target = firstError?.code ?? nextEmptyRequiredCode;
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

  const handleGenerated = React.useCallback(
    (clean: boolean) => {
      const isFirst = badgeStats.generated === 0;
      recordBadgeEvent({
        generated: badgeStats.generated + 1,
        cleanGenerated: badgeStats.cleanGenerated + (clean ? 1 : 0),
        firstTryClean: badgeStats.firstTryClean || (isFirst && clean)
      });
    },
    [badgeStats, recordBadgeEvent]
  );

  const handleExported = React.useCallback(() => {
    recordBadgeEvent({ exports: badgeStats.exports + 1 });
  }, [badgeStats.exports, recordBadgeEvent]);

  return (
    <div
      className={`app-shell flex flex-col min-h-screen bg-white dark:bg-[#121212] text-gray-900 dark:text-gray-200 font-sans${
        party && whimsy ? " party-mode" : ""
      }`}
    >
      <Header
        onStartScan={() => setIsScanning(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
        onOpenCompare={() => {
          markBingo("compared");
          setCompareOpen(true);
        }}
        onOpenBatch={() => setBatchOpen(true)}
        onOpenBadges={() => setBadgesOpen(true)}
        onOpenBingo={() => setBingoOpen(true)}
        onOpenRoadTest={() => setRoadTestOpen(true)}
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
          ].map((panel) => {
            const showErrorBadge = panel.key === "form" && errorCount > 0;
            const showReadyBadge = panel.key === "preview" && previewReady;
            return (
              <button
                key={panel.key}
                type="button"
                onClick={() => setMobilePanel(panel.key as MobilePanel)}
                aria-current={mobilePanel === panel.key}
                className={`state-themed-tab relative rounded-md px-3 py-2 text-sm font-medium transition ${
                  mobilePanel === panel.key
                    ? "state-primary-bg text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                }`}
              >
                {panel.label}
                {showErrorBadge && (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] leading-4 font-semibold shadow"
                    aria-label={`${errorCount} validation error${errorCount === 1 ? "" : "s"}`}
                  >
                    {errorCount > 9 ? "9+" : errorCount}
                  </span>
                )}
                {showReadyBadge && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 text-white text-[10px] leading-4 text-center shadow"
                    aria-label="Barcode ready"
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1 select-none">
          Swipe left or right to switch panels
        </p>
      </nav>

      <main
        ref={swipeRef}
        className="flex flex-1 flex-col lg:flex-row overflow-visible lg:overflow-hidden gap-0 lg:gap-0 pb-safe"
      >
        <Sidebar mobileHidden={mobilePanel !== "config"} />

        <div
          className={`dmv-main flex-1 flex flex-col overflow-y-auto bg-white dark:bg-[#1E1E1E] m-2 lg:m-4 rounded-xl shadow-google dark:shadow-none border border-gray-200 dark:border-[#333333] min-h-[40vh] min-w-0 ${
            mobilePanel !== "form" ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                Payload Fields
              </h2>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                Field values stay in memory only — never written to disk. Export JSON to keep a
                copy.
              </p>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium shrink-0">
              AAMVA Version {version} &bull; {state}
            </div>
          </div>

          <FieldFilters
            query={searchQuery}
            onQueryChange={(value) => {
              setSearchQuery(value);
              if (value.trim()) markBingo("searched-fields");
            }}
            requiredOnly={requiredOnly}
            onRequiredOnlyChange={setRequiredOnly}
            issuesOnly={issuesOnly}
            onIssuesOnlyChange={setIssuesOnly}
            issueCount={issues.length}
            matchCount={visibleFields.length}
            totalCount={schemaFields.length}
            requiredFilled={requiredFilled}
            requiredTotal={requiredTotal}
            onJumpToNextEmpty={handleJumpToNextEmpty}
            hasNextEmpty={!!nextEmptyRequiredCode}
            onGenerateAutoFields={handleGenerateAllAuto}
            onFillSample={handleFillSample}
            onCollapseAll={handleCollapseAll}
            onExpandAll={handleExpandAll}
          >
            <GroupNav stats={groupStats} onJump={handleJumpToGroup} />
          </FieldFilters>

          <div className="p-4 lg:p-6">
            {visibleFields.length === 0 ? (
              // role="status" so screen readers announce the dead end as soon
              // as the filters produce nothing, and a reset button so the user
              // can recover without hunting for which filter to undo.
              <div
                role="status"
                className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 p-8 text-center dark:border-dark-border dark:bg-dark-surface"
              >
                <SearchX className="mb-3 h-8 w-8 text-gray-400 dark:text-gray-500" aria-hidden />
                <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
                  No fields found
                </h3>
                <p className="mb-4 max-w-sm text-xs text-gray-600 dark:text-gray-400">
                  {describeActiveFilters(searchQuery, requiredOnly, issuesOnly, issues.length)}
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                  Reset all filters
                </button>
              </div>
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
                        whimsy={whimsy}
                        allValues={fields}
                        highlight={searchQuery}
                        derivedFrom={
                          field.code === "DAJ" ? "Set from the selected jurisdiction." : undefined
                        }
                        onChange={handleChange}
                        onCopy={handleCopyField}
                        onReset={handleResetField}
                        onGenerate={handleGenerate}
                        onHelpOpened={() => markBingo("read-the-help")}
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
            onExported={handleExported}
            onGenerated={handleGenerated}
            onBingo={markBingo}
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
      {badgesOpen && (
        <React.Suspense fallback={null}>
          <EmployeeOfTheMonth
            open={badgesOpen}
            onClose={() => setBadgesOpen(false)}
            stats={badgeStats}
          />
        </React.Suspense>
      )}
      {bingoOpen && (
        <React.Suspense fallback={null}>
          <DmvBingo
            open={bingoOpen}
            onClose={() => setBingoOpen(false)}
            marked={bingoMarked}
            onReset={resetBingo}
          />
        </React.Suspense>
      )}
      <MobileActionBar
        errorCount={errorCount}
        emptyRequired={requiredTotal - requiredFilled}
        stale={payloadStale}
        ready={previewReady && !!payload}
        onFixNext={handleMobileFixNext}
        onExport={handleExportPNGShortcut}
      />

      {roadTestOpen && (
        <React.Suspense fallback={null}>
          <RoadTest
            open={roadTestOpen}
            onClose={() => setRoadTestOpen(false)}
            onPassed={() => {
              markBingo("road-tested");
              toast.success("🚗 Road test passed. You may now park anywhere.");
            }}
          />
        </React.Suspense>
      )}
      <DropZoneOverlay />
      {whimsy && (
        <React.Suspense fallback={null}>
          <TicketDispenser
            enabled={whimsy}
            served={badgeStats.generated}
            onTakeTicket={() => markBingo("took-a-number")}
          />
        </React.Suspense>
      )}
      {whimsy && (
        <React.Suspense fallback={null}>
          <ClerkMascot
            enabled={whimsy}
            errorCount={errorCount}
            requiredComplete={requiredComplete}
            anyFields={anyFields}
            onDismiss={() => markBingo("dismissed-gus")}
          />
        </React.Suspense>
      )}
    </div>
  );
}

export default App;
