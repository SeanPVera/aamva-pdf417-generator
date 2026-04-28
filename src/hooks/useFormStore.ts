import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  // undo/redo stacks — not persisted
  _history: Array<Record<string, string>>;
  _future: Array<Record<string, string>>;
  setField: (code: string, value: string) => void;
  setStateVersion: (state: string, version: string) => void;
  setStrictMode: (mode: boolean) => void;
  setSubfileType: (type: "DL" | "ID") => void;
  setTheme: (theme: Theme) => void;
  clearFields: () => void;
  loadJson: (data: Record<string, string>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
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
      _history: [],
      _future: [],

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
            _future: []
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
        theme: s.theme
      })
    }
  )
);
