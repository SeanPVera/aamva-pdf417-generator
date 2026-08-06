import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { FieldGroupId } from "../core/schema";

// Persisted state intentionally excludes the AAMVA `fields` payload, so no PII
// is ever written to disk. Only UI preferences (state, version, strict mode,
// subfile type, theme) are persisted — see `partialize` below. Earlier versions
// of this file wrapped localStorage in CryptoJS AES, but the key was kept in
// plaintext localStorage next to the ciphertext, providing no real protection
// against same-origin access. Plain localStorage is the honest choice.

export type Theme = "light" | "dark" | "dmv";

const HISTORY_LIMIT = 20;

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
  // ISO timestamp the user finished or skipped the welcome tour. Empty = never seen.
  tourSeenAt: string;
  // Decorative preferences (persisted). `whimsy` gates all the playful flourishes;
  // `soundOn` gates the synthesized clerk-stamp clicks.
  whimsy: boolean;
  soundOn: boolean;
  // Last camera the user scanned with, so the scanner reopens on the same one.
  cameraDeviceId: string;
  // undo/redo stacks — not persisted
  _history: Array<Record<string, string>>;
  _future: Array<Record<string, string>>;
  // Transient diff-highlight signal: which field codes changed in the last bulk
  // load (import / scan / preset) and when. Not persisted.
  _changedCodes: string[];
  _changedAt: number;
  setField: (code: string, value: string) => void;
  setStateVersion: (state: string, version: string) => void;
  setStrictMode: (mode: boolean) => void;
  setSubfileType: (type: "DL" | "ID") => void;
  setTheme: (theme: Theme) => void;
  toggleGroupCollapsed: (group: FieldGroupId) => void;
  setRequiredOnly: (value: boolean) => void;
  markTourSeen: () => void;
  resetTour: () => void;
  setWhimsy: (value: boolean) => void;
  setSoundOn: (value: boolean) => void;
  setCameraDeviceId: (id: string) => void;
  clearFields: () => void;
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

export const useFormStore = create<FormState>()(
  persist(
    (set, get) => ({
      state: "CA",
      version: "10",
      strictMode: true,
      subfileType: "DL",
      fields: {},
      theme: "dark",
      collapsedGroups: {},
      requiredOnly: false,
      tourSeenAt: "",
      whimsy: true,
      soundOn: false,
      cameraDeviceId: "",
      _history: [],
      _future: [],
      _changedCodes: [],
      _changedAt: 0,

      setField: (code, value) =>
        set((s) => {
          const history = [...s._history, s.fields].slice(-HISTORY_LIMIT);
          return {
            fields: { ...s.fields, [code]: value },
            _history: history,
            _future: []
          };
        }),

      setStateVersion: (stateCode, version) => set(() => ({ state: stateCode, version })),

      setStrictMode: (mode) => set({ strictMode: mode }),

      setSubfileType: (type) => set({ subfileType: type }),

      setTheme: (theme) => set({ theme }),

      toggleGroupCollapsed: (group) =>
        set((s) => ({
          collapsedGroups: { ...s.collapsedGroups, [group]: !s.collapsedGroups[group] }
        })),

      setRequiredOnly: (value) => set({ requiredOnly: value }),

      markTourSeen: () => set({ tourSeenAt: new Date().toISOString() }),

      resetTour: () => set({ tourSeenAt: "" }),

      setWhimsy: (value) => set({ whimsy: value }),

      setSoundOn: (value) => set({ soundOn: value }),

      setCameraDeviceId: (id) => set({ cameraDeviceId: id }),

      clearFields: () =>
        set((s) => ({
          fields: {},
          _history: [...s._history, s.fields].slice(-HISTORY_LIMIT),
          _future: []
        })),

      loadJson: (data) =>
        set((s) => {
          const { state: newState, version, ...rest } = data;
          const newFields = Object.fromEntries(
            Object.entries(rest).map(([k, v]) => [k, String(v)])
          );
          const history = [...s._history, s.fields].slice(-HISTORY_LIMIT);
          return {
            state: newState || s.state,
            version: version || s.version,
            fields: newFields,
            _history: history,
            _future: [],
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
          return { fields: prev, _history: history, _future: future };
        }),

      redo: () =>
        set((s) => {
          if (s._future.length === 0) return s;
          const next = s._future[0];
          const future = s._future.slice(1);
          const history = [...s._history, s.fields].slice(-HISTORY_LIMIT);
          return { fields: next, _history: history, _future: future };
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
        tourSeenAt: s.tourSeenAt,
        whimsy: s.whimsy,
        soundOn: s.soundOn,
        cameraDeviceId: s.cameraDeviceId
      })
    }
  )
);
