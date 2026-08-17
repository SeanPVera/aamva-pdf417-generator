import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FieldGroupId } from "../core/schema";
// Type-only: importing the badge *catalog* here would pull its definitions into
// the initial chunk, even though only the plaque modal ever renders them.
import type { BadgeStats } from "../core/badges";

// Persisted state intentionally excludes the AAMVA `fields` payload, so no PII
// is ever written to disk. Only UI preferences (state, version, strict mode,
// subfile type, theme) are persisted — see `partialize` below. Earlier versions
// of this file wrapped localStorage in CryptoJS AES, but the key was kept in
// plaintext localStorage next to the ciphertext, providing no real protection
// against same-origin access. Plain localStorage is the honest choice.

/** "system" follows prefers-color-scheme; the rest are explicit overrides. */
export type Theme = "system" | "light" | "dark" | "dmv";

const HISTORY_LIMIT = 20;

/**
 * Consecutive edits to the same field inside this window collapse into a single
 * undo entry. Without it, typing "SAN FRANCISCO" burns 13 of the 20 history
 * slots and Ctrl+Z can never reach the previous field.
 */
export const COALESCE_WINDOW_MS = 600;

/** How many recent jurisdictions the picker keeps at the top. */
const RECENT_STATES_LIMIT = 5;

/** Fresh decorative counters. Mirrors `EMPTY_BADGE_STATS` in core/badges. */
const INITIAL_BADGE_STATS: BadgeStats = {
  visitedStates: [],
  generated: 0,
  cleanGenerated: 0,
  firstTryClean: false,
  undos: 0,
  redos: 0,
  exports: 0,
  batchRows: 0,
  nightShift: false
};

export interface FormState {
  state: string;
  version: string;
  strictMode: boolean;
  subfileType: "DL" | "ID";
  fields: Record<string, string>;
  theme: Theme;
  // UI preferences for the form area (persisted, no PII).
  collapsedGroups: Partial<Record<FieldGroupId, boolean>>;
  requiredOnly: boolean;
  issuesOnly: boolean;
  // Jurisdiction codes recently selected, most recent first. Not PII.
  recentStates: string[];
  // Width of the preview/inspector column in px (desktop only).
  inspectorWidth: number;
  // Opt-in: write the cardholder's name into export filenames. Off by default —
  // a filename is the one place field values would escape the tab.
  includeNameInExport: boolean;
  // ISO timestamp the user finished or skipped the welcome tour. Empty = never seen.
  tourSeenAt: string;
  // Decorative preferences (persisted). `whimsy` gates all the playful flourishes;
  // `soundOn` gates the synthesized clerk-stamp clicks; `mascots` gates the two
  // screen-corner residents (Gus and the queue ticket) specifically. They are
  // the only decorations that sit over the page permanently rather than firing
  // in response to something, so they get their own opt-in and default to off.
  whimsy: boolean;
  soundOn: boolean;
  mascots: boolean;
  // Decorative counters behind the badge board and bingo card. Counters only —
  // never field values.
  badgeStats: BadgeStats;
  bingoMarked: string[];
  ticketNumber: number;
  // Last camera the user scanned with, so the scanner reopens on the same one.
  cameraDeviceId: string;
  // undo/redo stacks — not persisted
  _history: Array<Record<string, string>>;
  _future: Array<Record<string, string>>;
  // Coalescing bookkeeping for `setField` — not persisted.
  _lastEditCode: string;
  _lastEditAt: number;
  // Transient diff-highlight signal: which field codes changed in the last bulk
  // load (import / scan / preset) and when. Not persisted.
  _changedCodes: string[];
  _changedAt: number;
  setField: (code: string, value: string) => void;
  setDerivedField: (code: string, value: string) => void;
  setStateVersion: (state: string, version: string) => void;
  setStrictMode: (mode: boolean) => void;
  setSubfileType: (type: "DL" | "ID") => void;
  setTheme: (theme: Theme) => void;
  toggleGroupCollapsed: (group: FieldGroupId) => void;
  setRequiredOnly: (value: boolean) => void;
  setIssuesOnly: (value: boolean) => void;
  setInspectorWidth: (width: number) => void;
  setIncludeNameInExport: (value: boolean) => void;
  markTourSeen: () => void;
  resetTour: () => void;
  setWhimsy: (value: boolean) => void;
  setSoundOn: (value: boolean) => void;
  setMascots: (value: boolean) => void;
  setCameraDeviceId: (id: string) => void;
  recordBadgeEvent: (patch: Partial<BadgeStats>) => void;
  markBingo: (id: string) => void;
  resetBingo: () => void;
  clearFields: () => void;
  mergeFields: (patch: Record<string, string>) => void;
  restoreFields: (fields: Record<string, string>) => void;
  loadJson: (data: Record<string, string>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

/** Field codes whose value differs between two payload maps (added or changed). */
function diffChangedCodes(prev: Record<string, string>, next: Record<string, string>): string[] {
  const changed: string[] = [];
  for (const [code, value] of Object.entries(next)) {
    if (prev[code] !== value) changed.push(code);
  }
  return changed;
}

/** Moves `code` to the front of the recent list, de-duplicated and capped. */
function promoteRecent(list: string[], code: string): string[] {
  return [code, ...list.filter((c) => c !== code)].slice(0, RECENT_STATES_LIMIT);
}

export const useFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      state: "CA",
      version: "10",
      strictMode: true,
      subfileType: "DL",
      fields: {},
      theme: "system",
      collapsedGroups: {},
      requiredOnly: false,
      issuesOnly: false,
      recentStates: [],
      inspectorWidth: 320,
      includeNameInExport: false,
      tourSeenAt: "",
      whimsy: true,
      soundOn: false,
      mascots: false,
      badgeStats: { ...INITIAL_BADGE_STATS },
      bingoMarked: [],
      ticketNumber: 0,
      cameraDeviceId: "",
      _history: [],
      _future: [],
      _lastEditCode: "",
      _lastEditAt: 0,
      _changedCodes: [],
      _changedAt: 0,

      setField: (code, value) =>
        set((s) => {
          const now = Date.now();
          // Keep typing inside one field as a single undo step, as long as the
          // keystrokes keep coming and nothing else touched the form.
          const coalesce =
            s._lastEditCode === code &&
            now - s._lastEditAt < COALESCE_WINDOW_MS &&
            s._history.length > 0;
          const history = coalesce ? s._history : [...s._history, s.fields].slice(-HISTORY_LIMIT);
          return {
            fields: { ...s.fields, [code]: value },
            _history: history,
            _future: [],
            _lastEditCode: code,
            _lastEditAt: now
          };
        }),

      // For values the app owns rather than the user — today only DAJ, which
      // generateAAMVAPayload forces to the selected jurisdiction no matter what
      // the form holds. Deliberately does NOT touch undo history: a derived
      // value is not an edit, and burning a history slot on it would push the
      // user's own last change out of reach.
      setDerivedField: (code, value) =>
        set((s) => (s.fields[code] === value ? s : { fields: { ...s.fields, [code]: value } })),

      setStateVersion: (stateCode, version) =>
        set((s) => {
          const visited = s.badgeStats.visitedStates.includes(stateCode)
            ? s.badgeStats.visitedStates
            : [...s.badgeStats.visitedStates, stateCode];
          return {
            state: stateCode,
            version,
            recentStates: promoteRecent(s.recentStates, stateCode),
            badgeStats: { ...s.badgeStats, visitedStates: visited },
            // A jurisdiction switch is a deliberate break in the edit stream.
            _lastEditCode: "",
            _lastEditAt: 0
          };
        }),

      setStrictMode: (mode) => set({ strictMode: mode }),

      setSubfileType: (type) => set({ subfileType: type }),

      setTheme: (theme) => set({ theme }),

      toggleGroupCollapsed: (group) =>
        set((s) => ({
          collapsedGroups: { ...s.collapsedGroups, [group]: !s.collapsedGroups[group] }
        })),

      setRequiredOnly: (value) => set({ requiredOnly: value }),

      setIssuesOnly: (value) => set({ issuesOnly: value }),

      setInspectorWidth: (width) =>
        set({ inspectorWidth: Math.max(280, Math.min(720, Math.round(width))) }),

      setIncludeNameInExport: (value) => set({ includeNameInExport: value }),

      markTourSeen: () => set({ tourSeenAt: new Date().toISOString() }),

      resetTour: () => set({ tourSeenAt: "" }),

      setWhimsy: (value) => set({ whimsy: value }),

      setSoundOn: (value) => set({ soundOn: value }),

      setMascots: (value) => set({ mascots: value }),

      setCameraDeviceId: (id) => set({ cameraDeviceId: id }),

      recordBadgeEvent: (patch) =>
        set((s) => ({
          badgeStats: { ...s.badgeStats, ...patch },
          ticketNumber:
            patch.generated !== undefined && patch.generated > s.badgeStats.generated
              ? s.ticketNumber + 1
              : s.ticketNumber
        })),

      markBingo: (id) =>
        set((s) => (s.bingoMarked.includes(id) ? s : { bingoMarked: [...s.bingoMarked, id] })),

      resetBingo: () => set({ bingoMarked: [] }),

      clearFields: () =>
        set((s) => ({
          fields: {},
          _history: [...s._history, s.fields].slice(-HISTORY_LIMIT),
          _future: [],
          _lastEditCode: "",
          _lastEditAt: 0
        })),

      // Applies many field values as ONE undo step. Bulk actions used to call
      // `setField` in a loop, which pushed an entry per field: a 28-field sample
      // fill overflowed the 20-entry history, discarded everything the user had
      // typed before it, and still could not be undone once the stack ran out.
      mergeFields: (patch) =>
        set((s) => {
          const next = { ...s.fields, ...patch };
          return {
            fields: next,
            _history: [...s._history, s.fields].slice(-HISTORY_LIMIT),
            _future: [],
            _lastEditCode: "",
            _lastEditAt: 0,
            _changedCodes: diffChangedCodes(s.fields, next),
            _changedAt: Date.now()
          };
        }),

      // Used by the Undo action on the "cleared"/"preset applied" toasts, which
      // restore a specific snapshot rather than walking the history stack.
      restoreFields: (fields) =>
        set((s) => ({
          fields,
          _history: [...s._history, s.fields].slice(-HISTORY_LIMIT),
          _future: [],
          _lastEditCode: "",
          _lastEditAt: 0,
          _changedCodes: diffChangedCodes(s.fields, fields),
          _changedAt: Date.now()
        })),

      loadJson: (data) =>
        set((s) => {
          const { state: newState, version, ...rest } = data;
          const newFields = Object.fromEntries(
            Object.entries(rest).map(([k, v]) => [k, String(v)])
          );
          const history = [...s._history, s.fields].slice(-HISTORY_LIMIT);
          const nextState = newState || s.state;
          return {
            state: nextState,
            version: version || s.version,
            recentStates:
              nextState === s.state ? s.recentStates : promoteRecent(s.recentStates, nextState),
            fields: newFields,
            _history: history,
            _future: [],
            _lastEditCode: "",
            _lastEditAt: 0,
            _changedCodes: diffChangedCodes(s.fields, newFields),
            _changedAt: Date.now()
          };
        }),

      undo: () =>
        set((s) => {
          if (s._history.length === 0) return s;
          const prev = s._history[s._history.length - 1];
          const history = s._history.slice(0, -1);
          const future = [s.fields, ...s._future].slice(0, HISTORY_LIMIT);
          return {
            fields: prev,
            _history: history,
            _future: future,
            _lastEditCode: "",
            _lastEditAt: 0,
            badgeStats: { ...s.badgeStats, undos: s.badgeStats.undos + 1 }
          };
        }),

      redo: () =>
        set((s) => {
          if (s._future.length === 0) return s;
          const next = s._future[0];
          const future = s._future.slice(1);
          const history = [...s._history, s.fields].slice(-HISTORY_LIMIT);
          return {
            fields: next,
            _history: history,
            _future: future,
            _lastEditCode: "",
            _lastEditAt: 0,
            badgeStats: { ...s.badgeStats, redos: s.badgeStats.redos + 1 }
          };
        }),

      canUndo: () => get()._history.length > 0,
      canRedo: () => get()._future.length > 0
    }),
    {
      name: "aamva_form_prefs_v2",
      storage: createJSONStorage(() => localStorage),
      // Persist only non-sensitive UI preferences. AAMVA payload `fields`,
      // undo/redo stacks are intentionally excluded.
      partialize: (s) => ({
        state: s.state,
        version: s.version,
        strictMode: s.strictMode,
        subfileType: s.subfileType,
        theme: s.theme,
        collapsedGroups: s.collapsedGroups,
        requiredOnly: s.requiredOnly,
        issuesOnly: s.issuesOnly,
        recentStates: s.recentStates,
        inspectorWidth: s.inspectorWidth,
        includeNameInExport: s.includeNameInExport,
        tourSeenAt: s.tourSeenAt,
        whimsy: s.whimsy,
        soundOn: s.soundOn,
        mascots: s.mascots,
        badgeStats: s.badgeStats,
        bingoMarked: s.bingoMarked,
        ticketNumber: s.ticketNumber,
        cameraDeviceId: s.cameraDeviceId
      })
    }
  )
);
